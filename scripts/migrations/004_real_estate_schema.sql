-- Real Estate Project Management System Schema
-- Based on relationship.md specifications
-- PostgreSQL 15 with strict business rules enforcement

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS btree_gist; -- useful for exclusion constraints

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Colony','IndependentHouse','LinkHouse','HousingEstate')),
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Owners (people/entities)
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Project owners join table (enforces 1..10 owners per project and percentage summation)
CREATE TABLE project_owners (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  percentage NUMERIC(5,2) CHECK (percentage >= 0 AND percentage <= 100),
  role TEXT CHECK (role IN ('primary','co-owner')) DEFAULT 'co-owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (project_id, owner_id)
);

-- Admin/sub-admin/user lists (project-level user accounts)
CREATE TABLE project_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('superuser','sysadmin','localadmin','admin','subadmin','user','guest')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, username)
);

-- Apartment buildings (optional, for Colony/HousingEstate)
CREATE TABLE apartment_buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT,
  address TEXT,
  floors INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- House units (can be standalone houses (project_id referenced) or units inside apartment_buildings)
CREATE TABLE houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  building_id UUID REFERENCES apartment_buildings(id) ON DELETE CASCADE, -- nullable: standalone house if null
  unit_number TEXT, -- unit number inside building; null for standalone
  name TEXT, -- e.g., 'Unit 1A' or house name
  category_type TEXT, -- e.g., 'Studio','1BHK','2BHK'
  size_sqm NUMERIC(10,2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- House owners: many-to-many between houses and owners (house must have at least one owner)
CREATE TABLE house_owners (
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  percentage NUMERIC(5,2) CHECK (percentage >= 0 AND percentage <= 100),
  role TEXT CHECK (role IN ('primary','co-owner')) DEFAULT 'co-owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (house_id, owner_id)
);

-- Indexes for performance
CREATE INDEX idx_project_owners_project ON project_owners(project_id);
CREATE INDEX idx_project_owners_owner ON project_owners(owner_id);
CREATE INDEX idx_house_owners_house ON house_owners(house_id);
CREATE INDEX idx_house_owners_owner ON house_owners(owner_id);
CREATE INDEX idx_project_users_project_role ON project_users(project_id, role);
CREATE INDEX idx_houses_project ON houses(project_id);
CREATE INDEX idx_houses_building ON houses(building_id);
CREATE INDEX idx_apartment_buildings_project ON apartment_buildings(project_id);
CREATE INDEX idx_projects_type ON projects(type);
CREATE INDEX idx_projects_city ON projects(city);
CREATE INDEX idx_owners_email ON owners(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_owners_updated_at BEFORE UPDATE ON owners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_project_owners_updated_at BEFORE UPDATE ON project_owners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_project_users_updated_at BEFORE UPDATE ON project_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_apartment_buildings_updated_at BEFORE UPDATE ON apartment_buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_houses_updated_at BEFORE UPDATE ON houses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_house_owners_updated_at BEFORE UPDATE ON house_owners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1) Enforce max 10 owners and percentage sum = 100 for project_owners
CREATE OR REPLACE FUNCTION fn_validate_project_owners()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  owner_count INT;
  pct_sum NUMERIC;
BEGIN
  -- Count owners for the project
  SELECT COUNT(*), COALESCE(SUM(percentage),0) INTO owner_count, pct_sum
  FROM project_owners
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);

  IF TG_OP = 'DELETE' THEN
    -- If delete results in 0 owners -> reject
    IF owner_count = 0 THEN
      RAISE EXCEPTION 'project must have at least one owner';
    END IF;
  ELSE
    -- For insert/update, ensure count <= 10 and >=1
    IF owner_count < 1 THEN
      RAISE EXCEPTION 'project must have at least one owner';
    END IF;
    IF owner_count > 10 THEN
      RAISE EXCEPTION 'project cannot have more than 10 owners';
    END IF;

    -- Enforce percentage total equals 100
    -- Using numeric; require exact 100.00
    IF pct_sum <> 100 THEN
      RAISE EXCEPTION 'sum of owner percentages for project % is %; must equal 100', COALESCE(NEW.project_id, OLD.project_id), pct_sum;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_validate_project_owners
AFTER INSERT OR UPDATE OR DELETE ON project_owners
FOR EACH ROW EXECUTE FUNCTION fn_validate_project_owners();

-- 2) Enforce house owners >=1 and percentage sum = 100 for house_owners
CREATE OR REPLACE FUNCTION fn_validate_house_owners()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  owner_count INT;
  pct_sum NUMERIC;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(percentage),0) INTO owner_count, pct_sum
  FROM house_owners
  WHERE house_id = COALESCE(NEW.house_id, OLD.house_id);

  IF TG_OP = 'DELETE' THEN
    IF owner_count = 0 THEN
      RAISE EXCEPTION 'house must have at least one owner';
    END IF;
  ELSE
    IF owner_count < 1 THEN
      RAISE EXCEPTION 'house must have at least one owner';
    END IF;
    -- no hard upper limit provided for house owners
    IF pct_sum <> 100 THEN
      RAISE EXCEPTION 'sum of house owner percentages for house % is %; must equal 100', COALESCE(NEW.house_id, OLD.house_id), pct_sum;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_validate_house_owners
AFTER INSERT OR UPDATE OR DELETE ON house_owners
FOR EACH ROW EXECUTE FUNCTION fn_validate_house_owners();

-- 3) Enforce role counts (admins/subadmins/users) per project
CREATE OR REPLACE FUNCTION fn_validate_project_user_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  admin_count INT;
  subadmin_count INT;
  user_count INT;
BEGIN
  -- We compute counts after the current row is inserted/updated/deleted
  SELECT COUNT(*) INTO admin_count FROM project_users WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) AND role = 'admin';
  SELECT COUNT(*) INTO subadmin_count FROM project_users WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) AND role = 'subadmin';
  SELECT COUNT(*) INTO user_count FROM project_users WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) AND role = 'user';

  IF admin_count > 4 THEN
    RAISE EXCEPTION 'project % cannot have more than 4 admins (found %)', COALESCE(NEW.project_id, OLD.project_id), admin_count;
  END IF;
  IF subadmin_count > 10 THEN
    RAISE EXCEPTION 'project % cannot have more than 10 sub-admins (found %)', COALESCE(NEW.project_id, OLD.project_id), subadmin_count;
  END IF;
  IF user_count > 100 THEN
    RAISE EXCEPTION 'project % cannot have more than 100 users (found %)', COALESCE(NEW.project_id, OLD.project_id), user_count;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_validate_project_user_counts
AFTER INSERT OR UPDATE OR DELETE ON project_users
FOR EACH ROW EXECUTE FUNCTION fn_validate_project_user_counts();

-- Helper functions for application use
CREATE OR REPLACE FUNCTION get_project_owner_count(project_uuid UUID)
RETURNS INT AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM project_owners WHERE project_id = project_uuid);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_project_owner_percentage_sum(project_uuid UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(percentage), 0) FROM project_owners WHERE project_id = project_uuid);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_house_owner_count(house_uuid UUID)
RETURNS INT AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM house_owners WHERE house_id = house_uuid);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_house_owner_percentage_sum(house_uuid UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(percentage), 0) FROM house_owners WHERE house_id = house_uuid);
END;
$$ LANGUAGE plpgsql;
