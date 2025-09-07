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

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, username, email, password, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      session_token: token
    });
  } catch (error) {
    console.error('Login error:', error);
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

// User profile endpoints
app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

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
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

// Projects endpoints
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, address, city, state, status, budget, start_date, end_date, created_at, updated_at FROM projects ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
