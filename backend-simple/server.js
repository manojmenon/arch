const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5434,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'project_management',
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to check if user can manage project
const canManageProject = async (userId, projectId, pool) => {
  // Get user role
  const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) return false;
  
  const userRole = userResult.rows[0].role;
  
  // Superuser and localadmin can manage all projects
  if (['superuser', 'localadmin'].includes(userRole)) {
    return true;
  }
  
  // For org-admin, check if they have admin access to the project's organization
  if (userRole === 'org-admin') {
    const projectResult = await pool.query(`
      SELECT p.organization_id, ou.role as org_role
      FROM projects p
      LEFT JOIN organization_users ou ON p.organization_id = ou.organization_id AND ou.user_id = $1
      WHERE p.id = $2 AND p.deleted_at IS NULL
    `, [userId, projectId]);
    
    if (projectResult.rows.length === 0) return false;
    const { organization_id, org_role } = projectResult.rows[0];
    
    // If project has no organization, org-admin cannot manage it
    if (!organization_id) return false;
    
    // Check if user has admin role in the organization
    return org_role === 'admin';
  }
  
  return false;
};

// Helper function to check if user is localadmin or superuser
const isAdmin = (userRole) => {
  return ['superuser', 'localadmin'].includes(userRole);
};

// Helper function to get effective role (considering inheritance)
const getEffectiveRole = async (userId, pool) => {
  const result = await pool.query(`
    SELECT 
      u.role as original_role,
      ri.inherited_role,
      ri.is_active,
      ri.expires_at
    FROM users u
    LEFT JOIN role_inheritance ri ON u.id = ri.user_id AND ri.is_active = true
    WHERE u.id = $1
  `, [userId]);
  
  if (result.rows.length === 0) return null;
  
  const { original_role, inherited_role, is_active, expires_at } = result.rows[0];
  
  // Check if inheritance is expired
  if (is_active && inherited_role && expires_at && new Date(expires_at) <= new Date()) {
    // Deactivate expired inheritance
    await pool.query('UPDATE role_inheritance SET is_active = false WHERE user_id = $1 AND is_active = true', [userId]);
    return original_role;
  }
  
  return is_active && inherited_role ? inherited_role : original_role;
};

// Helper function to check if user can inherit a role
// Users can only inherit roles with LOWER privileges (downgrade)
const canInheritRole = (originalRole, targetRole) => {
  const roleHierarchy = {
    'guest': 1,
    'user': 2,
    'localadmin': 3,
    'sysadmin': 4,
    'superuser': 5
  };
  
  const originalLevel = roleHierarchy[originalRole] || 0;
  const targetLevel = roleHierarchy[targetRole] || 0;
  
  // Can only inherit roles with lower privilege levels
  return targetLevel < originalLevel;
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // First try to verify as JWT session token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (jwtError) {
    // If JWT verification fails, try to verify as API token
    verifyApiToken(req, res, next, token);
  }
};

const verifyApiToken = async (req, res, next, token) => {
  try {
    // Check if token exists in database and is not expired
    const result = await pool.query(
      'SELECT at.*, u.id as user_id, u.username, u.email, u.role FROM api_tokens at JOIN users u ON at.user_id = u.id WHERE at.token = $1 AND at.is_active = true AND (at.expires_at IS NULL OR at.expires_at > NOW())',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired API token' });
    }

    const tokenData = result.rows[0];
    
    // Update last_used_at
    await pool.query(
      'UPDATE api_tokens SET last_used_at = NOW() WHERE id = $1',
      [tokenData.id]
    );

    // Set user data similar to JWT token
    req.user = {
      userId: tokenData.user_id,
      username: tokenData.username,
      role: tokenData.role,
      tokenType: 'api'
    };
    
    next();
  } catch (error) {
    console.error('API token verification error:', error);
    return res.status(401).json({ error: 'Invalid API token' });
  }
};

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (id, username, email, password, role, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING id, username, email, role',
      [username, email, hashedPassword, role]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      session_token: token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user with suspension status
    const result = await pool.query(
      'SELECT id, username, email, password, role, suspended_until, suspension_reason, failed_login_count, last_failed_login FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      // Log failed attempt for non-existent user
      await pool.query(
        'INSERT INTO login_attempts (user_id, username, ip_address, user_agent, success) VALUES (NULL, $1, $2, $3, FALSE)',
        [username, clientIP, userAgent]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if account is suspended
    if (user.suspended_until && new Date(user.suspended_until) > new Date()) {
      return res.status(423).json({ 
        error: 'Account is suspended',
        suspended_until: user.suspended_until,
        suspension_reason: user.suspension_reason || 'Too many failed login attempts'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      // Log failed attempt
      await pool.query(
        'INSERT INTO login_attempts (user_id, username, ip_address, user_agent, success) VALUES ($1, $2, $3, $4, FALSE)',
        [user.id, username, clientIP, userAgent]
      );

      // Update failed login count
      const newFailedCount = (user.failed_login_count || 0) + 1;
      const now = new Date();
      
      // Check if we need to suspend the account (5 failed attempts in 1 hour)
      if (newFailedCount >= 5) {
        const suspendUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
        
        await pool.query(
          'UPDATE users SET failed_login_count = $1, last_failed_login = $2, suspended_until = $3, suspension_reason = $4 WHERE id = $5',
          [newFailedCount, now, suspendUntil, 'Too many failed login attempts', user.id]
        );

        return res.status(423).json({ 
          error: 'Account suspended due to too many failed login attempts',
          suspended_until: suspendUntil,
          suspension_reason: 'Too many failed login attempts'
        });
      } else {
        // Update failed login count but don't suspend yet
        await pool.query(
          'UPDATE users SET failed_login_count = $1, last_failed_login = $2 WHERE id = $3',
          [newFailedCount, now, user.id]
        );
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Successful login - reset failed login count and clear suspension if any
    await pool.query(
      'UPDATE users SET failed_login_count = 0, last_failed_login = NULL, suspended_until = NULL, suspension_reason = NULL WHERE id = $1',
      [user.id]
    );

    // Log successful attempt
    await pool.query(
      'INSERT INTO login_attempts (user_id, username, ip_address, user_agent, success) VALUES ($1, $2, $3, $4, TRUE)',
      [user.id, username, clientIP, userAgent]
    );

    // Get effective role (considering inheritance)
    const effectiveRole = await getEffectiveRole(user.id, pool);

    // Generate JWT token with effective role
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: effectiveRole, originalRole: user.role },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: effectiveRole,
        originalRole: user.role
      },
      session_token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unlock suspended account (localadmin only)
app.post('/api/auth/unlock/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserRole = req.user.role;

    // Check if current user is admin
    if (!isAdmin(currentUserRole)) {
      return res.status(403).json({ error: 'Access denied. Only administrators can unlock accounts.' });
    }

    // Check if target user exists
    const userResult = await pool.query(
      'SELECT id, username, suspended_until FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check if user is actually suspended
    if (!user.suspended_until || new Date(user.suspended_until) <= new Date()) {
      return res.status(400).json({ error: 'User is not currently suspended' });
    }

    // Unlock the account
    await pool.query(
      'UPDATE users SET suspended_until = NULL, suspension_reason = NULL, failed_login_count = 0, last_failed_login = NULL WHERE id = $1',
      [userId]
    );

    res.json({
      message: 'Account unlocked successfully',
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Unlock account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get suspended accounts (localadmin only)
app.get('/api/auth/suspended', verifyToken, async (req, res) => {
  try {
    const currentUserRole = req.user.role;

    // Check if current user is admin
    if (!isAdmin(currentUserRole)) {
      return res.status(403).json({ error: 'Access denied. Only administrators can view suspended accounts.' });
    }

    // Get all suspended accounts
    const result = await pool.query(`
      SELECT 
        id, username, email, role, 
        suspended_until, suspension_reason, 
        failed_login_count, last_failed_login,
        created_at
      FROM users 
      WHERE suspended_until IS NOT NULL AND suspended_until > NOW()
      ORDER BY suspended_until ASC
    `);

    res.json({
      suspended_accounts: result.rows
    });
  } catch (error) {
    console.error('Get suspended accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Switch to inherited role
app.post('/api/auth/switch-role', verifyToken, async (req, res) => {
  try {
    const { target_role, expires_in_hours } = req.body;
    const userId = req.user.userId;
    const currentUserRole = req.user.role;

    // Get user's original role
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const originalRole = userResult.rows[0].role;

    // Check if user can inherit the target role
    if (!canInheritRole(originalRole, target_role)) {
      const roleHierarchy = {
        'guest': 1,
        'user': 2,
        'localadmin': 3,
        'sysadmin': 4,
        'superuser': 5
      };
      
      const availableRoles = Object.keys(roleHierarchy)
        .filter(role => roleHierarchy[role] < roleHierarchy[originalRole])
        .join(', ');
      
      return res.status(403).json({ 
        error: `Cannot inherit role '${target_role}'. ${originalRole} can only inherit roles with lower privileges: ${availableRoles || 'none'}` 
      });
    }

    // Deactivate any existing inheritance
    await pool.query('UPDATE role_inheritance SET is_active = false WHERE user_id = $1', [userId]);

    // Calculate expiration time
    let expiresAt = null;
    if (expires_in_hours && expires_in_hours > 0) {
      expiresAt = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000);
    }

    // Create new inheritance
    const inheritanceResult = await pool.query(`
      INSERT INTO role_inheritance (user_id, original_role, inherited_role, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, originalRole, target_role, expiresAt]);

    res.json({
      message: `Successfully switched to ${target_role} role`,
      inheritance: {
        original_role: originalRole,
        inherited_role: target_role,
        expires_at: expiresAt,
        is_active: true
      }
    });
  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Return to original role
app.post('/api/auth/return-role', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Deactivate current inheritance
    const result = await pool.query(`
      UPDATE role_inheritance 
      SET is_active = false 
      WHERE user_id = $1 AND is_active = true
      RETURNING original_role, inherited_role
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No active role inheritance found' });
    }

    const { original_role, inherited_role } = result.rows[0];

    res.json({
      message: `Successfully returned to ${original_role} role`,
      previous_inheritance: {
        original_role: original_role,
        inherited_role: inherited_role
      }
    });
  } catch (error) {
    console.error('Return role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current role status
app.get('/api/auth/role-status', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT 
        u.role as original_role,
        ri.inherited_role,
        ri.is_active,
        ri.expires_at,
        ri.inherited_at
      FROM users u
      LEFT JOIN role_inheritance ri ON u.id = ri.user_id AND ri.is_active = true
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { original_role, inherited_role, is_active, expires_at, inherited_at } = result.rows[0];
    const effectiveRole = is_active && inherited_role ? inherited_role : original_role;

    res.json({
      original_role: original_role,
      effective_role: effectiveRole,
      is_inheriting: is_active && inherited_role,
      inheritance: is_active && inherited_role ? {
        inherited_role: inherited_role,
        inherited_at: inherited_at,
        expires_at: expires_at
      } : null,
      available_roles: (() => {
        const roleHierarchy = {
          'guest': 1,
          'user': 2,
          'localadmin': 3,
          'sysadmin': 4,
          'superuser': 5
        };
        
        return Object.keys(roleHierarchy)
          .filter(role => roleHierarchy[role] < roleHierarchy[original_role]);
      })()
    });
  } catch (error) {
    console.error('Get role status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', verifyToken, async (req, res) => {
  try {
    // In a real application, you would add the token to a blacklist
    // For now, we'll just return success since JWT tokens are stateless
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin impersonation: start impersonating another user
app.post('/api/auth/impersonate', verifyToken, async (req, res) => {
  try {
    const { target_user_id, target_username } = req.body || {};
    const requester = req.user;

    // Only superuser or localadmin can impersonate
    if (!isAdmin(requester.role)) {
      return res.status(403).json({ error: 'Only administrators can impersonate users' });
    }

    // Find the target user
    let targetResult;
    if (target_user_id) {
      targetResult = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [target_user_id]);
    } else if (target_username) {
      targetResult = await pool.query('SELECT id, username, email, role FROM users WHERE username = $1', [target_username]);
    } else {
      return res.status(400).json({ error: 'Provide target_user_id or target_username' });
    }

    if (targetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    const targetUser = targetResult.rows[0];

    // Prevent impersonating administrators
    if (['superuser', 'localadmin', 'sysadmin'].includes(targetUser.role)) {
      return res.status(403).json({ error: 'Cannot impersonate administrator-level accounts' });
    }

    // Generate token with target user's privileges but keep original in claims
    const targetEffectiveRole = await getEffectiveRole(targetUser.id, pool) || targetUser.role;
    const impersonationToken = jwt.sign(
      {
        userId: targetUser.id,
        username: targetUser.username,
        role: targetEffectiveRole,
        originalUserId: requester.userId,
        originalUsername: requester.username,
        originalRole: requester.role,
        impersonating: true
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      message: `Now impersonating ${targetUser.username}`,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        role: targetEffectiveRole,
        originalRole: requester.role,
        impersonating: true,
        originalUser: { id: requester.userId, username: requester.username }
      },
      session_token: impersonationToken
    });
  } catch (error) {
    console.error('Impersonate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stop impersonation: return to original admin identity
app.post('/api/auth/stop-impersonation', verifyToken, async (req, res) => {
  try {
    const current = req.user;

    if (!current.impersonating || !current.originalUserId) {
      return res.status(400).json({ error: 'Not currently impersonating' });
    }

    // Load original user
    const origResult = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [current.originalUserId]);
    if (origResult.rows.length === 0) {
      return res.status(404).json({ error: 'Original user not found' });
    }

    const orig = origResult.rows[0];
    const token = jwt.sign(
      { userId: orig.id, username: orig.username, role: orig.role, originalRole: orig.role },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({
      message: 'Stopped impersonation',
      user: { id: orig.id, username: orig.username, email: orig.email, role: orig.role, originalRole: orig.role },
      session_token: token
    });
  } catch (error) {
    console.error('Stop impersonation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get impersonation status
app.get('/api/auth/impersonation-status', verifyToken, async (req, res) => {
  try {
    const u = req.user || {};
    res.json({
      impersonating: !!u.impersonating,
      originalUserId: u.originalUserId || null,
      originalUsername: u.originalUsername || null,
      currentUserId: u.userId,
      currentUsername: u.username,
      role: u.role
    });
  } catch (error) {
    console.error('Impersonation status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User profile endpoints (old - removed to avoid conflict)

app.put('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user.userId;

    // Check if username or email already exists for other users
    if (username || email) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
        [username, email, userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
    }

    // Update user profile
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      updateFields.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    if (email) {
      updateFields.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, role, created_at, updated_at`,
      values
    );

    const user = result.rows[0];
    
    // Generate avatar initials
    let avatarInitials = '';
    if (user.username) {
      const nameParts = user.username.split(' ');
      if (nameParts.length >= 2) {
        avatarInitials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      } else {
        avatarInitials = user.username.substring(0, 2).toUpperCase();
      }
    } else if (user.email) {
      avatarInitials = user.email.substring(0, 2).toUpperCase();
    }

    res.json({
      ...user,
      avatarInitials
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Tokens endpoints
app.get('/api/auth/tokens', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(
      'SELECT id, name, description, token_prefix, expires_at, last_used_at, created_at, is_active FROM api_tokens WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    const tokens = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      token_prefix: row.token_prefix,
      expires_at: row.expires_at,
      last_used_at: row.last_used_at,
      created_at: row.created_at,
      is_active: row.is_active
    }));
    
    res.json(tokens);
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/tokens', verifyToken, async (req, res) => {
  try {
    const { name, description, expires_in_hours } = req.body;
    const userId = req.user.userId;

    if (!name) {
      return res.status(400).json({ error: 'Token name is required' });
    }

    // Check if a token with this name already exists for this user
    const existingToken = await pool.query(
      'SELECT id FROM api_tokens WHERE user_id = $1 AND name = $2',
      [userId, name]
    );

    if (existingToken.rows.length > 0) {
      return res.status(409).json({ 
        error: 'A token with this name already exists. Please choose a different name.' 
      });
    }

    // Generate a secure random token (limit to 60 chars to fit in 64-char column)
    const tokenValue = 'pm_' + crypto.randomBytes(28).toString('hex');
    const tokenPrefix = tokenValue.substring(0, 7) + '...'; // Limit to 10 chars for varchar(10)
    
    // Calculate expiration date (default 1 year if not specified)
    const expiresInHours = expires_in_hours || (365 * 24); // Default 1 year
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    
    const result = await pool.query(
      'INSERT INTO api_tokens (user_id, name, description, token, token_prefix, expires_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, description, token_prefix, expires_at, created_at, is_active',
      [userId, name, description || '', tokenValue, tokenPrefix, expiresAt]
    );
    
    const newToken = result.rows[0];
    
    // Return the full token only once (for display to user)
    res.status(201).json({
      id: newToken.id,
      name: newToken.name,
      description: newToken.description,
      token: tokenValue, // Full token returned only on creation
      token_prefix: newToken.token_prefix,
      expires_at: newToken.expires_at,
      created_at: newToken.created_at,
      is_active: newToken.is_active
    });
  } catch (error) {
    console.error('Create token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/auth/tokens/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Delete token from database (only if it belongs to the user)
    const result = await pool.query(
      'DELETE FROM api_tokens WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json({ message: 'Token deleted successfully' });
  } catch (error) {
    console.error('Delete token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Organizations endpoints
app.get('/api/organizations', verifyToken, async (req, res) => {
  try {
    const { search, type, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT o.*, 
             COUNT(DISTINCT p.id) as project_count,
             COUNT(DISTINCT ou.user_id) as user_count
      FROM organizations o
      LEFT JOIN projects p ON o.id = p.organization_id AND p.deleted_at IS NULL
      LEFT JOIN organization_users ou ON o.id = ou.organization_id AND ou.deleted_at IS NULL
      WHERE o.deleted_at IS NULL
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (o.name ILIKE $${paramCount} OR o.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (type) {
      paramCount++;
      query += ` AND o.type = $${paramCount}`;
      params.push(type);
    }

    query += ` GROUP BY o.id ORDER BY o.name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/organizations/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT o.*, 
             COUNT(DISTINCT p.id) as project_count,
             COUNT(DISTINCT ou.user_id) as user_count
      FROM organizations o
      LEFT JOIN projects p ON o.id = p.organization_id AND p.deleted_at IS NULL
      LEFT JOIN organization_users ou ON o.id = ou.organization_id AND ou.deleted_at IS NULL
      WHERE o.id = $1 AND o.deleted_at IS NULL
      GROUP BY o.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Projects endpoints with enhanced filtering
app.get('/api/projects', verifyToken, async (req, res) => {
  try {
    const { 
      organization_id, 
      category_id, 
      status, 
      priority, 
      search, 
      tags,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = `
      SELECT p.*, 
             o.name as organization_name,
             pc.name as category_name,
             pc.color as category_color,
             pc.icon as category_icon,
             COUNT(DISTINCT po.owner_id) as owner_count,
             COUNT(DISTINCT h.id) as house_count,
             array_agg(DISTINCT pt.name) as tag_names,
             array_agg(DISTINCT pt.color) as tag_colors
      FROM projects p
      LEFT JOIN organizations o ON p.organization_id = o.id
      LEFT JOIN project_categories pc ON p.category_id = pc.id
      LEFT JOIN project_owners po ON p.id = po.project_id
      LEFT JOIN houses h ON p.id = h.project_id
      LEFT JOIN project_tag_assignments pta ON p.id = pta.project_id
      LEFT JOIN project_tags pt ON pta.tag_id = pt.id
      WHERE p.deleted_at IS NULL
    `;
    
    const params = [];
    let paramCount = 0;

    if (organization_id) {
      paramCount++;
      query += ` AND p.organization_id = $${paramCount}`;
      params.push(organization_id);
    }

    if (category_id) {
      paramCount++;
      query += ` AND p.category_id = $${paramCount}`;
      params.push(category_id);
    }

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    if (priority) {
      paramCount++;
      query += ` AND p.priority = $${paramCount}`;
      params.push(priority);
    }

    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.address ILIKE $${paramCount} OR o.name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (tags) {
      const tagArray = tags.split(',');
      paramCount++;
      query += ` AND p.id IN (
        SELECT pta2.project_id FROM project_tag_assignments pta2 
        JOIN project_tags pt2 ON pta2.tag_id = pt2.id 
        WHERE pt2.name = ANY($${paramCount})
      )`;
      params.push(tagArray);
    }

    query += ` GROUP BY p.id, o.name, pc.name, pc.color, pc.icon 
               ORDER BY p.created_at DESC 
               LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Categories endpoints
app.get('/api/categories', verifyToken, async (req, res) => {
  try {
    const { organization_id } = req.query;
    let query = 'SELECT * FROM project_categories WHERE deleted_at IS NULL';
    const params = [];
    
    if (organization_id) {
      query += ' AND organization_id = $1';
      params.push(organization_id);
    }
    
    query += ' ORDER BY name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tags endpoints
app.get('/api/tags', verifyToken, async (req, res) => {
  try {
    const { organization_id } = req.query;
    let query = 'SELECT * FROM project_tags WHERE deleted_at IS NULL';
    const params = [];
    
    if (organization_id) {
      query += ' AND organization_id = $1';
      params.push(organization_id);
    }
    
    query += ' ORDER BY name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User organization memberships endpoints
app.get('/api/user/organizations', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(`
      SELECT 
        o.id,
        o.name,
        o.description,
        o.type,
        o.city,
        o.state,
        o.country,
        ou.role,
        ou.permissions,
        ou.created_at as joined_at,
        COUNT(DISTINCT p.id) as project_count,
        COUNT(DISTINCT ou2.user_id) as member_count
      FROM organization_users ou
      JOIN organizations o ON ou.organization_id = o.id
      LEFT JOIN projects p ON o.id = p.organization_id AND p.deleted_at IS NULL
      LEFT JOIN organization_users ou2 ON o.id = ou2.organization_id AND ou2.deleted_at IS NULL
      WHERE ou.user_id = $1 AND ou.deleted_at IS NULL AND o.deleted_at IS NULL
      GROUP BY o.id, o.name, o.description, o.type, o.city, o.state, o.country, ou.role, ou.permissions, ou.created_at
      ORDER BY ou.created_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile with organization memberships
app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user details
    const userResult = await pool.query(`
      SELECT id, username, email, role, created_at, updated_at
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get organization memberships
    const orgResult = await pool.query(`
      SELECT 
        o.id,
        o.name,
        o.description,
        o.type,
        o.city,
        o.state,
        o.country,
        ou.role as organization_role,
        ou.permissions,
        ou.created_at as joined_at,
        COUNT(DISTINCT p.id) as project_count
      FROM organization_users ou
      JOIN organizations o ON ou.organization_id = o.id
      LEFT JOIN projects p ON o.id = p.organization_id AND p.deleted_at IS NULL
      WHERE ou.user_id = $1 AND ou.deleted_at IS NULL AND o.deleted_at IS NULL
      GROUP BY o.id, o.name, o.description, o.type, o.city, o.state, o.country, ou.role, ou.permissions, ou.created_at
      ORDER BY ou.created_at DESC
    `, [userId]);
    
    user.organizations = orgResult.rows;
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile

// Organization management endpoints (for organization admins)
app.get('/api/organizations/:id/members', verifyToken, async (req, res) => {
  try {
    const { id: organizationId } = req.params;
    const userId = req.user.userId;
    
    // Check if user has admin access to this organization
    const accessResult = await pool.query(`
      SELECT role FROM organization_users 
      WHERE user_id = $1 AND organization_id = $2 AND deleted_at IS NULL
    `, [userId, organizationId]);
    
    if (accessResult.rows.length === 0 || !['owner', 'admin'].includes(accessResult.rows[0].role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role as system_role,
        ou.role as organization_role,
        ou.permissions,
        ou.created_at as joined_at,
        ou.updated_at
      FROM organization_users ou
      JOIN users u ON ou.user_id = u.id
      WHERE ou.organization_id = $1 AND ou.deleted_at IS NULL
      ORDER BY ou.created_at DESC
    `, [organizationId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching organization members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite user to organization
app.post('/api/organizations/:id/invite', verifyToken, async (req, res) => {
  try {
    const { id: organizationId } = req.params;
    const { email, role = 'member' } = req.body;
    const userId = req.user.userId;
    
    // Check if user has admin access to this organization
    const accessResult = await pool.query(`
      SELECT role FROM organization_users 
      WHERE user_id = $1 AND organization_id = $2 AND deleted_at IS NULL
    `, [userId, organizationId]);
    
    if (accessResult.rows.length === 0 || !['owner', 'admin'].includes(accessResult.rows[0].role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Find user by email
    const userResult = await pool.query(`
      SELECT id FROM users WHERE email = $1
    `, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const invitedUserId = userResult.rows[0].id;
    
    // Check if user is already a member
    const existingResult = await pool.query(`
      SELECT id FROM organization_users 
      WHERE user_id = $1 AND organization_id = $2 AND deleted_at IS NULL
    `, [invitedUserId, organizationId]);
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a member of this organization' });
    }
    
    // Add user to organization
    const result = await pool.query(`
      INSERT INTO organization_users (user_id, organization_id, role, created_at, updated_at)
      VALUES ($1, $2, $3, now(), now())
      RETURNING id, role, created_at
    `, [invitedUserId, organizationId, role]);
    
    res.json({
      message: 'User added to organization successfully',
      membership: result.rows[0]
    });
  } catch (error) {
    console.error('Error inviting user to organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role in organization
app.put('/api/organizations/:id/members/:userId/role', verifyToken, async (req, res) => {
  try {
    const { id: organizationId, userId: targetUserId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user.userId;
    
    // Check if current user has admin access to this organization
    const accessResult = await pool.query(`
      SELECT role FROM organization_users 
      WHERE user_id = $1 AND organization_id = $2 AND deleted_at IS NULL
    `, [currentUserId, organizationId]);
    
    if (accessResult.rows.length === 0 || !['owner', 'admin'].includes(accessResult.rows[0].role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update user role
    const result = await pool.query(`
      UPDATE organization_users 
      SET role = $1, updated_at = now()
      WHERE user_id = $2 AND organization_id = $3 AND deleted_at IS NULL
      RETURNING id, role, updated_at
    `, [role, targetUserId, organizationId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    
    res.json({
      message: 'User role updated successfully',
      membership: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove user from organization
app.delete('/api/organizations/:id/members/:userId', verifyToken, async (req, res) => {
  try {
    const { id: organizationId, userId: targetUserId } = req.params;
    const currentUserId = req.user.userId;
    
    // Check if current user has admin access to this organization
    const accessResult = await pool.query(`
      SELECT role FROM organization_users 
      WHERE user_id = $1 AND organization_id = $2 AND deleted_at IS NULL
    `, [currentUserId, organizationId]);
    
    if (accessResult.rows.length === 0 || !['owner', 'admin'].includes(accessResult.rows[0].role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Prevent removing the last owner
    if (targetUserId === currentUserId) {
      const ownerCountResult = await pool.query(`
        SELECT COUNT(*) as count FROM organization_users 
        WHERE organization_id = $1 AND role = 'owner' AND deleted_at IS NULL
      `, [organizationId]);
      
      if (ownerCountResult.rows[0].count <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last owner from the organization' });
      }
    }
    
    // Soft delete the membership
    const result = await pool.query(`
      UPDATE organization_users 
      SET deleted_at = now(), updated_at = now()
      WHERE user_id = $1 AND organization_id = $2 AND deleted_at IS NULL
      RETURNING id
    `, [targetUserId, organizationId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    
    res.json({ message: 'User removed from organization successfully' });
  } catch (error) {
    console.error('Error removing user from organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/projects/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*, 
             o.name as organization_name,
             pc.name as category_name,
             pc.color as category_color,
             pc.icon as category_icon,
             array_agg(DISTINCT pt.name) as tag_names,
             array_agg(DISTINCT pt.color) as tag_colors
      FROM projects p
      LEFT JOIN organizations o ON p.organization_id = o.id
      LEFT JOIN project_categories pc ON p.category_id = pc.id
      LEFT JOIN project_tag_assignments pta ON p.id = pta.project_id
      LEFT JOIN project_tags pt ON pta.tag_id = pt.id
      WHERE p.id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id, o.name, pc.name, pc.color, pc.icon
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create project
app.post('/api/projects', verifyToken, async (req, res) => {
  try {
    const {
      name, description, status = 'planning', priority, budget, start_date, end_date,
      owner_name, address, city, state, postal_code, organization_id, category_id,
      metadata = {}, documents = {}
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const userId = req.user.userId;
    const userRole = req.user.role;

    // Check permissions for org-admin users
    if (userRole === 'org-admin' && organization_id) {
      const accessResult = await pool.query(`
        SELECT role FROM organization_users 
        WHERE user_id = $1 AND organization_id = $2 AND deleted_at IS NULL
      `, [userId, organization_id]);
      
      if (accessResult.rows.length === 0 || !['owner', 'admin'].includes(accessResult.rows[0].role)) {
        return res.status(403).json({ error: 'Access denied. You can only create projects in organizations where you have admin access.' });
      }
    }

    const result = await pool.query(`
      INSERT INTO projects (
        name, description, status, priority, budget, start_date, end_date,
        owner_name, address, city, state, postal_code, organization_id, category_id,
        metadata, documents, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `, [
      name, description, status, priority, budget, start_date, end_date,
      owner_name, address, city, state, postal_code, organization_id, category_id,
      JSON.stringify(metadata), JSON.stringify(documents)
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project
app.put('/api/projects/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, status, priority, budget, start_date, end_date,
      owner_name, address, city, state, postal_code, organization_id, category_id,
      metadata, documents
    } = req.body;

    // First, get the current project data for archiving
    const currentProject = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    
    if (currentProject.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const currentData = currentProject.rows[0];

    // Archive the current version
    await pool.query(`
      INSERT INTO project_versions (
        project_id, version, name, description, status, priority, budget, start_date, end_date,
        owner_name, address, city, state, postal_code, organization_id, category_id,
        metadata, documents, created_at, updated_at, archived_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
    `, [
      id, currentData.version || 1, currentData.name, currentData.description, currentData.status,
      currentData.priority, currentData.budget, currentData.start_date, currentData.end_date,
      currentData.owner_name, currentData.address, currentData.city, currentData.state,
      currentData.postal_code, currentData.organization_id, currentData.category_id,
      currentData.metadata, currentData.documents, currentData.created_at, currentData.updated_at
    ]);

    // Update the project with new data
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    const fieldsToUpdate = {
      name, description, status, priority, budget, start_date, end_date,
      owner_name, address, city, state, postal_code, organization_id, category_id
    };

    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
        paramCount++;
      }
    });

    // Handle metadata and documents separately
    if (metadata !== undefined) {
      updateFields.push(`metadata = $${paramCount}`);
      updateValues.push(JSON.stringify(metadata));
      paramCount++;
    }

    if (documents !== undefined) {
      updateFields.push(`documents = $${paramCount}`);
      updateValues.push(JSON.stringify(documents));
      paramCount++;
    }

    // Always update version and updated_at
    updateFields.push(`version = $${paramCount}`);
    updateValues.push((currentData.version || 1) + 1);
    paramCount++;

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    const result = await pool.query(`
      UPDATE projects 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, updateValues);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project
app.delete('/api/projects/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting deleted_at timestamp
    const result = await pool.query(`
      UPDATE projects 
      SET deleted_at = NOW()
      WHERE id = $1
      RETURNING id, name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully', project: result.rows[0] });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project versions (archived versions)
app.get('/api/projects/:id/versions', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT * FROM project_versions 
      WHERE project_id = $1 
      ORDER BY version DESC
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get project versions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
