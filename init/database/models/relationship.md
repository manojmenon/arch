Prompt — Design DB schema + APIs for Projects / Owners / Houses / Buildings with strict relationship rules

You are a senior backend engineer. Produce SQL table definitions, constraints, trigger/functions (Postgres 15), and OpenAPI v3.0-style CRUD endpoint specifications to implement the data model and rules below. Make sensible choices for implementation details and call out which rules must be enforced at the DB level vs which should be enforced in the application layer (Go + sqlc/pgx or GORM). Where DB-level enforcement is possible, provide the SQL. Where it requires business logic or complex checks (concurrency/transactions), describe a robust approach and provide pseudocode.

⸻

Business rules (exact)
	1.	A Project
	•	Must have at least one owner, and can have up to 10 owners.
	•	Each owner assigned to the project has a percentage (numeric or integer percent). Sum of all owners percentages for a project must equal 100.
	•	A project can have at most 4 admins, at most 10 sub-admins, and at most 100 users.
	•	Project type must be one of: Colony, IndependentHouse, LinkHouse, HousingEstate.
	•	A project takes place at a specific postal address and has geo-coordinates (latitude, longitude).
	2.	An Owner
	•	Can own zero or more projects.
	•	For each project-owner assignment, there’s a percentage share and a role (primary/co-owner optional).
	3.	A House
	•	Must belong to a project (if project type allows houses — see Colony handling below).
	•	Must have at least one owner and can have multiple owners (no explicit global max for house owners, but project owners are capped per project).
	•	If project type = Colony, the project can contain multiple houses or multiple Apartment Buildings. If type is not Colony, houses may still exist for IndependentHouse, LinkHouse (interpret as single house project) — design to allow all but document intended usage.
	4.	An ApartmentBuilding
	•	Belongs to a project (only meaningful in Colony or HousingEstate types).
	•	Can contain many Houses (units).
	•	Each house (unit) inside a building has a category_type (e.g., Studio, 1BHK, 2BHK) and size_sqm (or sqft).
	5.	General
	•	All entities should have created_at, updated_at, deleted_at (soft delete optional).
	•	All primary keys should be UUIDs.
	•	Enforce referential integrity.
	•	Provide seed scripts or sample SQL to create sample records.

⸻

Deliverables (what the prompt should ask the generator to create)
	1.	SQL migration(s) for Postgres 15 that create tables and indices.
	2.	DB-level functions + triggers that enforce:
	•	Maximum owner count per project (10).
	•	Sum of percentages = 100 for owners of a project (enforced on insert/update/delete of project_owner rows).
	•	Max counts for admins / sub-admins / users per project (enforced via triggers or via application-level checks with strong transactions — include both options and recommend application enforcement with DB guardrails).
	3.	OpenAPI v3.0 endpoint list (paths + methods + summary + required request/response shapes) for CRUD operations on:
	•	Projects
	•	Owners
	•	ProjectOwners (assign / update percentage / remove)
	•	Users (project-level users, admins, sub-admins)
	•	Houses
	•	ApartmentBuildings and BuildingUnits (houses in buildings)
	4.	Example SQL seed to create a project with multiple owners whose percentages sum to 100 and an apartment building with units.
	5.	Notes for Go implementation (transactions, concurrency control, error handling) and sample SQLC-friendly queries or pseudocode.

⸻

Suggested SQL schema (Postgres 15) — include constraints & triggers

Below is a complete, ready-to-run example SQL migration. Use pgcrypto extension to generate UUIDs (gen_random_uuid()), or uuid-ossp if preferred.

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS btree_gist; -- useful if needed for exclusion constraints

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Owners (people/entities)
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Project owners join table (enforces 1..10 owners per project and percentage summation)
CREATE TABLE project_owners (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  percentage NUMERIC CHECK (percentage >= 0 AND percentage <= 100),
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Apartment buildings (optional, for Colony/HousingEstate)
CREATE TABLE apartment_buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT,
  address TEXT,
  floors INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- House units (can be standalone houses (project_id referenced) or units inside apartment_buildings)
CREATE TABLE houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  building_id UUID REFERENCES apartment_buildings(id) ON DELETE CASCADE, -- nullable: standalone house if null
  unit_number TEXT, -- unit number inside building; null for standalone
  name TEXT, -- e.g., 'Unit 1A' or house name
  category_type TEXT, -- e.g., 'Studio','1BHK','2BHK'
  size_sqm NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- House owners: many-to-many between houses and owners (house must have at least one owner)
CREATE TABLE house_owners (
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  percentage NUMERIC CHECK (percentage >= 0 AND percentage <= 100),
  role TEXT CHECK (role IN ('primary','co-owner')) DEFAULT 'co-owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (house_id, owner_id)
);

Indexes and helper constraints

-- Index for quick project owner lookups
CREATE INDEX idx_project_owners_project ON project_owners(project_id);
CREATE INDEX idx_house_owners_house ON house_owners(house_id);
CREATE INDEX idx_project_users_project_role ON project_users(project_id, role);

-- Ensure a project has at most 4 admins, 10 subadmins and 100 users:
-- We cannot write a simple CHECK constraint for counts across rows.
-- Use triggers to prevent INSERT/UPDATE that would violate counts, and also enforce at application level with transaction.


⸻

Triggers / Functions to enforce owner counts & percentage sum

1) Enforce max 10 owners and percentage sum = 100

Implement a trigger on project_owners that, after INSERT/UPDATE/DELETE, validates that:
	•	the number of owners for the project <= 10 and >= 1,
	•	the sum of percentages for the project = 100 (allow small rounding tolerance if using floats; use numeric for exactness).

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

Notes:
	•	The trigger above runs after DML; it queries the table which is safe because triggers are in same transaction.
	•	To avoid race conditions on concurrent writes, ensure operations that modify project owners are done inside a SERIALIZABLE or REPEATABLE READ transaction, or lock the project row with SELECT FOR UPDATE in the application before modifying owners.

2) Enforce house owners >=1 and percentage sum = 100 for house_owners

Analogous trigger for house_owners:

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

3) Enforce role counts (admins/subadmins/users) per project

Because project_users rows contain role, we enforce upper limits via a trigger that checks counts for admin (<=4), subadmin (<=10), and total user role (<=100). Note: roles include superuser/sysadmin/localadmin too — you may want to exempt them from project caps (interpretation to make explicit).

Example trigger:

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

Note: These triggers can cause concurrency errors if two concurrent inserts push counts past limits simultaneously. To avoid this, perform modifications in the app with SELECT ... FOR UPDATE on the projects row or run in SERIALIZABLE transactions and handle retries.

⸻

OpenAPI endpoints (high-level)

Create an OpenAPI v3 spec for these paths (examples below - generator should produce full YAML).

Projects
	•	GET /projects — list projects (filter by type, city, owner_id)
	•	POST /projects — create project (body includes type, address, coords, optional initial owners array)
	•	GET /projects/{project_id} — get project details (include owners, counts)
	•	PUT /projects/{project_id} — update project (address, coords, metadata)
	•	DELETE /projects/{project_id} — delete project

Owners
	•	GET /owners
	•	POST /owners
	•	GET /owners/{owner_id}
	•	PUT /owners/{owner_id}
	•	DELETE /owners/{owner_id}

ProjectOwners (assign / update / remove)
	•	POST /projects/{project_id}/owners — assign an owner with owner_id and percentage and optional role
	•	PUT /projects/{project_id}/owners/{owner_id} — update percentage/role
	•	DELETE /projects/{project_id}/owners/{owner_id} — remove owner (trigger will prevent deletion if leads to zero owners)

ProjectUsers (admins/subadmins/users)
	•	GET /projects/{project_id}/users
	•	POST /projects/{project_id}/users — create project user with role (validate role)
	•	PUT /projects/{project_id}/users/{user_id} — update role/info
	•	DELETE /projects/{project_id}/users/{user_id}

Houses
	•	GET /projects/{project_id}/houses
	•	POST /projects/{project_id}/houses — create house; body may include building_id (nullable), unit_number, category_type, size_sqm, initial owners array
	•	GET /houses/{house_id}
	•	PUT /houses/{house_id}
	•	DELETE /houses/{house_id}

Apartment Buildings
	•	GET /projects/{project_id}/buildings
	•	POST /projects/{project_id}/buildings
	•	GET /buildings/{building_id}
	•	PUT /buildings/{building_id}
	•	DELETE /buildings/{building_id}

House Owners
	•	POST /houses/{house_id}/owners
	•	PUT /houses/{house_id}/owners/{owner_id}
	•	DELETE /houses/{house_id}/owners/{owner_id}

⸻

Example request/response shape (Project creation with owners)

POST /projects

Request body (JSON):

{
  "name": "Green Meadows Colony",
  "type": "Colony",
  "address": "10 Meadow Lane",
  "city": "Metropolis",
  "postal_code": "12345",
  "latitude": 12.345678,
  "longitude": 98.765432,
  "metadata": { "phase": "phase-1" },
  "owners": [
    { "owner_id": "a111...uuid", "percentage": 60, "role": "primary" },
    { "owner_id": "b222...uuid", "percentage": 40, "role": "co-owner" }
  ]
}

Response:
	•	201 Created with created project_id, or 400 on validation error (e.g., percentages don’t sum to 100, >10 owners, etc.)

⸻

Seed SQL example (creates a project with two owners sum=100 and a building with units)

-- Create owners
INSERT INTO owners (id, name, email) VALUES (gen_random_uuid(), 'Alice Owner', 'alice@example.com');
INSERT INTO owners (id, name, email) VALUES (gen_random_uuid(), 'Bob Owner', 'bob@example.com');

-- Create project
INSERT INTO projects (id, name, type, address, city, postal_code, latitude, longitude)
VALUES (gen_random_uuid(), 'Green Meadows Colony', 'Colony', '10 Meadow Lane', 'Metropolis', '12345', 12.345678, 98.765432);

-- Suppose we fetch project_id and owner_ids to variables in seed script and then:
INSERT INTO project_owners (project_id, owner_id, percentage, role)
VALUES
  ('<project_id>', '<alice_owner_id>', 60, 'primary'),
  ('<project_id>', '<bob_owner_id>', 40, 'co-owner');

-- Add a building
INSERT INTO apartment_buildings (id, project_id, name, address, floors)
VALUES (gen_random_uuid(), '<project_id>', 'Block A', '10 Meadow Lane', 5);

-- Add unit houses
INSERT INTO houses (id, project_id, building_id, unit_number, category_type, size_sqm)
VALUES
  (gen_random_uuid(), '<project_id>', '<building_id>', '1A', '2BHK', 75),
  (gen_random_uuid(), '<project_id>', '<building_id>', '1B', '1BHK', 50);

(Seed script in Go should perform these inserts inside a transaction and use RETURNING to obtain UUIDs.)

⸻

Application-level enforcement notes (Go + sqlc/pgx)
	•	Wrap operations that change owners or role counts in a DB transaction.
	•	Example: When adding a project_owner, application should:
	1.	BEGIN
	2.	SELECT id FROM projects WHERE id = $1 FOR UPDATE — lock the project row to avoid concurrent modification races.
	3.	Insert/Update the project_owners row.
	4.	Optionally run SELECT COUNT(*)/SUM(percentage) FROM project_owners WHERE project_id = $1 to verify business rules (app-level guard).
	5.	COMMIT
	•	Handle serialization_failure or deadlock_detected SQLSTATE by retrying (idempotent up to a few attempts).
	•	Use sqlc to generate strongly-typed queries. Example SQL queries:
	•	GetProjectOwners(project_id)
	•	InsertProjectOwner(project_id, owner_id, percentage, role)
	•	DeleteProjectOwner(project_id, owner_id)
	•	SumProjectOwnerPercentages(project_id) — used for validation.
	•	For role count caps (admins/subadmins/users), either:
	•	enforce via DB triggers (above) and still do application checks to provide user-friendly errors, or
	•	only enforce in the application but use DB unique/index constraints to prevent duplicates and use SELECT FOR UPDATE to serialize changes.
	•	Always validate owner percentages server-side even if DB trigger exists — to return proper API error messages and avoid heavy DB exception parsing.

⸻

Concurrency & transactional safety recommendations
	•	Prefer SELECT ... FOR UPDATE on the projects row before mutating related owner/user rows.
	•	Use repeatable transactions or SERIALIZABLE with backoff retries for critical operations (owner changes).
	•	Keep expensive validation (e.g., global counts across many rows) inside the transaction to avoid TOCTOU issues.

⸻

Tests to include in generated project
	•	Unit tests for:
	•	project_owner insert/update/delete validations (percent sum, counts).
	•	house_owners validations.
	•	Integration tests that:
	•	Create a project with 1 owner; attempt to delete that owner and assert rejection.
	•	Attempt to add 11 owners and assert rejection.
	•	Add owners whose percentages don’t sum to 100 and assert rejection.
	•	Add users exceeding admin/subadmin/user caps and assert rejection.

⸻

Summary / What to output

Ask the generator to output:
	•	File: migrations/001_schema.sql — with the SQL above (tables, indexes, functions, triggers).
	•	File: openapi/projects.yaml (and owners/houses) — OpenAPI definitions covering all CRUD endpoints above. Each operation must include request/response schemas and error responses (400/409/500).
	•	File: scripts/seed_projects.go — a Go seed program that inserts example data, demonstrating transactions and use of FOR UPDATE when needed.
	•	README: docs/model.md explaining the model, constraints, and enforcement strategy (DB triggers + app-level transactions).
	•	Tests folder with sample SQL/unit/integration tests demonstrating enforcement.

⸻

If anything is ambiguous, make safe assumptions (document them). For example:
	•	If user/guest counts include admin roles or are exclusive — assume role counts are for exact match (i.e., role=‘admin’ is separate from role=‘user’).
	•	Owner percentages must be integer or numeric; prefer NUMERIC for exact arithmetic.

⸻

End of prompt.