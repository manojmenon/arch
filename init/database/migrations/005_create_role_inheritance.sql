-- Create role_inheritance table for tracking role switching
CREATE TABLE IF NOT EXISTS role_inheritance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_role VARCHAR(20) NOT NULL,
    inherited_role VARCHAR(20) NOT NULL,
    inherited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one active inheritance per user
    UNIQUE(user_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_inheritance_user_id ON role_inheritance(user_id);
CREATE INDEX IF NOT EXISTS idx_role_inheritance_active ON role_inheritance(is_active);
CREATE INDEX IF NOT EXISTS idx_role_inheritance_expires_at ON role_inheritance(expires_at);

-- Add constraint to ensure valid role inheritance (only downgrade allowed)
ALTER TABLE role_inheritance ADD CONSTRAINT check_role_inheritance 
CHECK (
    (original_role = 'superuser' AND inherited_role IN ('sysadmin', 'localadmin', 'user', 'guest')) OR
    (original_role = 'sysadmin' AND inherited_role IN ('localadmin', 'user', 'guest')) OR
    (original_role = 'localadmin' AND inherited_role IN ('user', 'guest')) OR
    (original_role = 'user' AND inherited_role = 'guest')
);

-- Comments for documentation
COMMENT ON TABLE role_inheritance IS 'Tracks role inheritance for superuser and localadmin role switching capabilities.';
COMMENT ON COLUMN role_inheritance.original_role IS 'The original role of the user before inheritance.';
COMMENT ON COLUMN role_inheritance.inherited_role IS 'The role that the user has inherited/switched to.';
COMMENT ON COLUMN role_inheritance.expires_at IS 'Optional expiration time for the inherited role (NULL means no expiration).';
COMMENT ON COLUMN role_inheritance.is_active IS 'Whether this inheritance is currently active (only one per user).';
