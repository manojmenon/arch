# Real Estate Project Management System - Data Model

## Overview

This document describes the data model and business rules for the Real Estate Project Management System. The system manages projects, owners, houses, buildings, and users with strict business rule enforcement.

## Business Rules

### 1. Projects
- **Must have at least one owner, and can have up to 10 owners**
- **Each owner assigned to the project has a percentage (numeric percent)**
- **Sum of all owners percentages for a project must equal 100**
- **A project can have at most 4 admins, at most 10 sub-admins, and at most 100 users**
- **Project type must be one of: Colony, IndependentHouse, LinkHouse, HousingEstate**
- **A project takes place at a specific postal address and has geo-coordinates (latitude, longitude)**

### 2. Owners
- **Can own zero or more projects**
- **For each project-owner assignment, there's a percentage share and a role (primary/co-owner optional)**

### 3. Houses
- **Must belong to a project**
- **Must have at least one owner and can have multiple owners**
- **If project type = Colony, the project can contain multiple houses or multiple Apartment Buildings**
- **If type is not Colony, houses may still exist for IndependentHouse, LinkHouse (interpret as single house project)**

### 4. Apartment Buildings
- **Belongs to a project (only meaningful in Colony or HousingEstate types)**
- **Can contain many Houses (units)**
- **Each house (unit) inside a building has a category_type (e.g., Studio, 1BHK, 2BHK) and size_sqm**

### 5. General
- **All entities should have created_at, updated_at, deleted_at (soft delete optional)**
- **All primary keys should be UUIDs**
- **Enforce referential integrity**

## Database Schema

### Tables

#### 1. `projects`
```sql
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
```

#### 2. `owners`
```sql
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
```

#### 3. `project_owners`
```sql
CREATE TABLE project_owners (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  percentage NUMERIC(5,2) CHECK (percentage >= 0 AND percentage <= 100),
  role TEXT CHECK (role IN ('primary','co-owner')) DEFAULT 'co-owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (project_id, owner_id)
);
```

#### 4. `project_users`
```sql
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
```

#### 5. `apartment_buildings`
```sql
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
```

#### 6. `houses`
```sql
CREATE TABLE houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  building_id UUID REFERENCES apartment_buildings(id) ON DELETE CASCADE,
  unit_number TEXT,
  name TEXT,
  category_type TEXT,
  size_sqm NUMERIC(10,2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

#### 7. `house_owners`
```sql
CREATE TABLE house_owners (
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  percentage NUMERIC(5,2) CHECK (percentage >= 0 AND percentage <= 100),
  role TEXT CHECK (role IN ('primary','co-owner')) DEFAULT 'co-owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (house_id, owner_id)
);
```

## Business Rule Enforcement

### Database-Level Enforcement

#### 1. Project Owner Constraints
- **Maximum 10 owners per project**: Enforced via trigger `fn_validate_project_owners()`
- **Minimum 1 owner per project**: Enforced via trigger `fn_validate_project_owners()`
- **Percentage sum = 100**: Enforced via trigger `fn_validate_project_owners()`

#### 2. House Owner Constraints
- **Minimum 1 owner per house**: Enforced via trigger `fn_validate_house_owners()`
- **Percentage sum = 100**: Enforced via trigger `fn_validate_house_owners()`

#### 3. Project User Role Limits
- **Maximum 4 admins per project**: Enforced via trigger `fn_validate_project_user_counts()`
- **Maximum 10 sub-admins per project**: Enforced via trigger `fn_validate_project_user_counts()`
- **Maximum 100 users per project**: Enforced via trigger `fn_validate_project_user_counts()`

### Application-Level Enforcement

#### 1. Transaction Safety
```go
// Example Go implementation with transaction safety
func AddProjectOwner(tx *sql.Tx, projectID, ownerID string, percentage float64, role string) error {
    // Lock the project row to prevent concurrent modifications
    _, err := tx.Exec("SELECT id FROM projects WHERE id = $1 FOR UPDATE", projectID)
    if err != nil {
        return err
    }
    
    // Insert the project owner
    _, err = tx.Exec(`
        INSERT INTO project_owners (project_id, owner_id, percentage, role)
        VALUES ($1, $2, $3, $4)
    `, projectID, ownerID, percentage, role)
    
    return err
}
```

#### 2. Concurrency Control
- Use `SELECT ... FOR UPDATE` on project rows before modifying related data
- Implement retry logic for serialization failures
- Use SERIALIZABLE transactions for critical operations

#### 3. Validation Functions
```sql
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
```

## API Endpoints

### Projects
- `GET /projects` - List projects with filtering
- `POST /projects` - Create project with initial owners
- `GET /projects/{project_id}` - Get project details
- `PUT /projects/{project_id}` - Update project
- `DELETE /projects/{project_id}` - Delete project

### Project Owners
- `GET /projects/{project_id}/owners` - Get project owners
- `POST /projects/{project_id}/owners` - Add owner to project
- `PUT /projects/{project_id}/owners/{owner_id}` - Update owner percentage/role
- `DELETE /projects/{project_id}/owners/{owner_id}` - Remove owner from project

### Owners
- `GET /owners` - List all owners
- `POST /owners` - Create new owner
- `GET /owners/{owner_id}` - Get owner details
- `PUT /owners/{owner_id}` - Update owner
- `DELETE /owners/{owner_id}` - Delete owner

### Houses
- `GET /projects/{project_id}/houses` - Get project houses
- `POST /projects/{project_id}/houses` - Create new house
- `GET /houses/{house_id}` - Get house details
- `PUT /houses/{house_id}` - Update house
- `DELETE /houses/{house_id}` - Delete house

### House Owners
- `GET /houses/{house_id}/owners` - Get house owners
- `POST /houses/{house_id}/owners` - Add owner to house
- `PUT /houses/{house_id}/owners/{owner_id}` - Update owner percentage/role
- `DELETE /houses/{house_id}/owners/{owner_id}` - Remove owner from house

### Apartment Buildings
- `GET /projects/{project_id}/buildings` - Get project buildings
- `POST /projects/{project_id}/buildings` - Create new building
- `GET /buildings/{building_id}` - Get building details
- `PUT /buildings/{building_id}` - Update building
- `DELETE /buildings/{building_id}` - Delete building

### Project Users
- `GET /projects/{project_id}/users` - Get project users
- `POST /projects/{project_id}/users` - Add user to project
- `PUT /projects/{project_id}/users/{user_id}` - Update user role
- `DELETE /projects/{project_id}/users/{user_id}` - Remove user from project

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content (for deletions)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (business rule violations)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Business rule violation",
  "message": "project cannot have more than 10 owners",
  "details": {
    "current_count": 10,
    "max_allowed": 10
  }
}
```

## Testing Strategy

### Unit Tests
- Test all business rule validations
- Test percentage calculations
- Test owner count limits
- Test role count limits

### Integration Tests
- Test complete project creation with owners
- Test owner addition/removal scenarios
- Test concurrent modification scenarios
- Test transaction rollback scenarios

### Example Test Cases
1. **Create project with 1 owner (100%)** - Should succeed
2. **Try to delete the only owner** - Should fail with 409
3. **Add 11th owner to project** - Should fail with 409
4. **Add owners with percentages not summing to 100** - Should fail with 409
5. **Add 5th admin to project** - Should fail with 409
6. **Add 11th subadmin to project** - Should fail with 409
7. **Add 101st user to project** - Should fail with 409

## Performance Considerations

### Indexes
- Primary key indexes on all tables
- Foreign key indexes for joins
- Composite indexes for common query patterns
- Partial indexes for soft-deleted records

### Query Optimization
- Use prepared statements
- Implement connection pooling
- Use appropriate transaction isolation levels
- Monitor query performance with pg_stat_statements

### Scalability
- Consider read replicas for reporting queries
- Implement caching for frequently accessed data
- Use database partitioning for large tables
- Consider sharding for multi-tenant scenarios

## Security Considerations

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all API communications
- Implement proper authentication and authorization
- Audit all data modifications

### Access Control
- Implement role-based access control (RBAC)
- Use principle of least privilege
- Implement API rate limiting
- Log all access attempts

### Data Validation
- Validate all input data
- Use parameterized queries to prevent SQL injection
- Implement proper error handling without information leakage
- Sanitize all output data
