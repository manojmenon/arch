-- Organizations and Enhanced Project Management Schema
-- Adds organization structure and enhanced filtering capabilities

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('Company', 'Government', 'NGO', 'Individual', 'Partnership')),
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  phone TEXT,
  email TEXT,
  website TEXT,
  tax_id TEXT,
  registration_number TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add organization_id to projects table
ALTER TABLE projects ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to owners table
ALTER TABLE owners ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Organization users (users who can access organization data)
CREATE TABLE organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'viewer', 'member')),
  permissions JSONB, -- Custom permissions per user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, user_id)
);

-- Project categories for better organization
CREATE TABLE project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT, -- Hex color for UI
  icon TEXT, -- Icon name for UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add category_id to projects
ALTER TABLE projects ADD COLUMN category_id UUID REFERENCES project_categories(id) ON DELETE SET NULL;

-- Project tags for flexible categorization
CREATE TABLE project_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT, -- Hex color for UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, name)
);

-- Many-to-many relationship between projects and tags
CREATE TABLE project_tag_assignments (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES project_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (project_id, tag_id)
);

-- Enhanced project status tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled', 'archived'));

-- Project priority levels
ALTER TABLE projects ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Project phases for better tracking
CREATE TABLE project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phase_order INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_city ON organizations(city);
CREATE INDEX idx_organizations_country ON organizations(country);
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_category_id ON projects(category_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_owners_organization_id ON owners(organization_id);
CREATE INDEX idx_organization_users_org_id ON organization_users(organization_id);
CREATE INDEX idx_organization_users_user_id ON organization_users(user_id);
CREATE INDEX idx_organization_users_role ON organization_users(role);
CREATE INDEX idx_project_categories_org_id ON project_categories(organization_id);
CREATE INDEX idx_project_tags_org_id ON project_tags(organization_id);
CREATE INDEX idx_project_tag_assignments_project_id ON project_tag_assignments(project_id);
CREATE INDEX idx_project_tag_assignments_tag_id ON project_tag_assignments(tag_id);
CREATE INDEX idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX idx_project_phases_status ON project_phases(status);

-- Triggers for updated_at
CREATE TRIGGER trigger_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_organization_users_updated_at BEFORE UPDATE ON organization_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_project_categories_updated_at BEFORE UPDATE ON project_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_project_tags_updated_at BEFORE UPDATE ON project_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_project_phases_updated_at BEFORE UPDATE ON project_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper functions for filtering and search
CREATE OR REPLACE FUNCTION search_projects(
  org_id UUID DEFAULT NULL,
  category_id UUID DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  priority_filter TEXT DEFAULT NULL,
  search_term TEXT DEFAULT NULL,
  tag_ids UUID[] DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  status TEXT,
  priority TEXT,
  organization_name TEXT,
  category_name TEXT,
  owner_count INTEGER,
  house_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.type,
    p.status,
    p.priority,
    o.name as organization_name,
    pc.name as category_name,
    (SELECT COUNT(*) FROM project_owners po WHERE po.project_id = p.id) as owner_count,
    (SELECT COUNT(*) FROM houses h WHERE h.project_id = p.id) as house_count,
    p.created_at
  FROM projects p
  LEFT JOIN organizations o ON p.organization_id = o.id
  LEFT JOIN project_categories pc ON p.category_id = pc.id
  WHERE 
    (org_id IS NULL OR p.organization_id = org_id)
    AND (category_id IS NULL OR p.category_id = category_id)
    AND (status_filter IS NULL OR p.status = status_filter)
    AND (priority_filter IS NULL OR p.priority = priority_filter)
    AND (search_term IS NULL OR p.name ILIKE '%' || search_term || '%' OR p.address ILIKE '%' || search_term || '%')
    AND (tag_ids IS NULL OR p.id IN (
      SELECT pta.project_id FROM project_tag_assignments pta WHERE pta.tag_id = ANY(tag_ids)
    ))
    AND p.deleted_at IS NULL
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get organization statistics
CREATE OR REPLACE FUNCTION get_organization_stats(org_id UUID)
RETURNS TABLE (
  total_projects INTEGER,
  active_projects INTEGER,
  total_owners INTEGER,
  total_houses INTEGER,
  total_buildings INTEGER,
  projects_by_status JSONB,
  projects_by_priority JSONB,
  projects_by_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM projects WHERE organization_id = org_id AND deleted_at IS NULL) as total_projects,
    (SELECT COUNT(*) FROM projects WHERE organization_id = org_id AND status = 'active' AND deleted_at IS NULL) as active_projects,
    (SELECT COUNT(DISTINCT po.owner_id) FROM projects p JOIN project_owners po ON p.id = po.project_id WHERE p.organization_id = org_id AND p.deleted_at IS NULL) as total_owners,
    (SELECT COUNT(*) FROM projects p JOIN houses h ON p.id = h.project_id WHERE p.organization_id = org_id AND p.deleted_at IS NULL AND h.deleted_at IS NULL) as total_houses,
    (SELECT COUNT(*) FROM projects p JOIN apartment_buildings ab ON p.id = ab.project_id WHERE p.organization_id = org_id AND p.deleted_at IS NULL AND ab.deleted_at IS NULL) as total_buildings,
    (SELECT jsonb_object_agg(status, count) FROM (
      SELECT status, COUNT(*) as count FROM projects WHERE organization_id = org_id AND deleted_at IS NULL GROUP BY status
    ) t) as projects_by_status,
    (SELECT jsonb_object_agg(priority, count) FROM (
      SELECT priority, COUNT(*) as count FROM projects WHERE organization_id = org_id AND deleted_at IS NULL GROUP BY priority
    ) t) as projects_by_priority,
    (SELECT jsonb_object_agg(type, count) FROM (
      SELECT type, COUNT(*) as count FROM projects WHERE organization_id = org_id AND deleted_at IS NULL GROUP BY type
    ) t) as projects_by_type;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's accessible organizations
CREATE OR REPLACE FUNCTION get_user_organizations(user_uuid UUID)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  user_role TEXT,
  project_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as organization_id,
    o.name as organization_name,
    ou.role as user_role,
    (SELECT COUNT(*) FROM projects p WHERE p.organization_id = o.id AND p.deleted_at IS NULL) as project_count
  FROM organizations o
  JOIN organization_users ou ON o.id = ou.organization_id
  WHERE ou.user_id = user_uuid AND o.deleted_at IS NULL AND ou.deleted_at IS NULL
  ORDER BY o.name;
END;
$$ LANGUAGE plpgsql;
