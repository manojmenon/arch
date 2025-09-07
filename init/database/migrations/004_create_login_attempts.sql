-- Create login_attempts table for tracking failed login attempts
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT FALSE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);

-- Add suspension fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP WITH TIME ZONE;

-- Add index for suspension queries
CREATE INDEX IF NOT EXISTS idx_users_suspended_until ON users(suspended_until);
CREATE INDEX IF NOT EXISTS idx_users_failed_login_count ON users(failed_login_count);

-- Comments for documentation
COMMENT ON TABLE login_attempts IS 'Tracks all login attempts for security monitoring and account suspension.';
COMMENT ON COLUMN users.suspended_until IS 'Timestamp when account suspension expires (NULL if not suspended).';
COMMENT ON COLUMN users.suspension_reason IS 'Reason for account suspension (e.g., "Too many failed login attempts").';
COMMENT ON COLUMN users.failed_login_count IS 'Number of consecutive failed login attempts in the current window.';
COMMENT ON COLUMN users.last_failed_login IS 'Timestamp of the last failed login attempt.';
