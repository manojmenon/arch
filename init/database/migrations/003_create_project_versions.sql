-- Create project_versions table for archiving project changes
CREATE TABLE IF NOT EXISTS project_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning',
    priority VARCHAR(20),
    budget DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    owner_name VARCHAR(200),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    organization_id UUID REFERENCES organizations(id),
    category_id UUID REFERENCES project_categories(id),
    metadata JSONB DEFAULT '{}',
    documents JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique version per project
    UNIQUE(project_id, version)
);

-- Add version column to projects table if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add deleted_at column to projects table for soft deletes
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_version ON project_versions(project_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);

-- Add comments
COMMENT ON TABLE project_versions IS 'Archived versions of projects for audit trail';
COMMENT ON COLUMN project_versions.version IS 'Version number of the project';
COMMENT ON COLUMN project_versions.archived_at IS 'When this version was archived';
COMMENT ON COLUMN projects.version IS 'Current version number of the project';
COMMENT ON COLUMN projects.deleted_at IS 'Soft delete timestamp, NULL means not deleted';
