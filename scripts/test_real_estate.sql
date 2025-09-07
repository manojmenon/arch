-- Real Estate Project Management System - Test Cases
-- These tests demonstrate the business rule enforcement

-- Test 1: Create a project with valid owners (percentages sum to 100)
BEGIN;

-- Create test owners
INSERT INTO owners (id, name, email) VALUES 
  (gen_random_uuid(), 'Test Owner 1', 'owner1@test.com'),
  (gen_random_uuid(), 'Test Owner 2', 'owner2@test.com');

-- Create test project
INSERT INTO projects (id, name, type, address) VALUES 
  (gen_random_uuid(), 'Test Project', 'Colony', '123 Test Street');

-- Get the IDs for the test
DO $$
DECLARE
    project_id UUID;
    owner1_id UUID;
    owner2_id UUID;
BEGIN
    -- Get the project ID
    SELECT id INTO project_id FROM projects WHERE name = 'Test Project';
    
    -- Get owner IDs
    SELECT id INTO owner1_id FROM owners WHERE name = 'Test Owner 1';
    SELECT id INTO owner2_id FROM owners WHERE name = 'Test Owner 2';
    
    -- Add owners with percentages that sum to 100
    INSERT INTO project_owners (project_id, owner_id, percentage, role) VALUES 
      (project_id, owner1_id, 60.0, 'primary'),
      (project_id, owner2_id, 40.0, 'co-owner');
    
    RAISE NOTICE 'Test 1 PASSED: Project created with valid owners (60% + 40% = 100%)';
END $$;

ROLLBACK;

-- Test 2: Try to create a project with invalid percentages (should fail)
BEGIN;

-- Create test owners
INSERT INTO owners (id, name, email) VALUES 
  (gen_random_uuid(), 'Test Owner 3', 'owner3@test.com'),
  (gen_random_uuid(), 'Test Owner 4', 'owner4@test.com');

-- Create test project
INSERT INTO projects (id, name, type, address) VALUES 
  (gen_random_uuid(), 'Test Project 2', 'Colony', '456 Test Avenue');

-- Try to add owners with percentages that don't sum to 100
DO $$
DECLARE
    project_id UUID;
    owner3_id UUID;
    owner4_id UUID;
BEGIN
    -- Get the project ID
    SELECT id INTO project_id FROM projects WHERE name = 'Test Project 2';
    
    -- Get owner IDs
    SELECT id INTO owner3_id FROM owners WHERE name = 'Test Owner 3';
    SELECT id INTO owner4_id FROM owners WHERE name = 'Test Owner 4';
    
    -- Add first owner
    INSERT INTO project_owners (project_id, owner_id, percentage, role) VALUES 
      (project_id, owner3_id, 60.0, 'primary');
    
    -- Try to add second owner with percentage that makes total != 100
    BEGIN
        INSERT INTO project_owners (project_id, owner_id, percentage, role) VALUES 
          (project_id, owner4_id, 50.0, 'co-owner');
        RAISE NOTICE 'Test 2 FAILED: Should have failed with percentages 60% + 50% = 110%';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Test 2 PASSED: Correctly rejected invalid percentages (%)', SQLERRM;
    END;
END $$;

ROLLBACK;

-- Test 3: Try to add more than 10 owners to a project (should fail)
BEGIN;

-- Create test project
INSERT INTO projects (id, name, type, address) VALUES 
  (gen_random_uuid(), 'Test Project 3', 'Colony', '789 Test Boulevard');

-- Create 11 test owners
DO $$
DECLARE
    project_id UUID;
    owner_id UUID;
    i INTEGER;
BEGIN
    -- Get the project ID
    SELECT id INTO project_id FROM projects WHERE name = 'Test Project 3';
    
    -- Create 11 owners and try to add them
    FOR i IN 1..11 LOOP
        -- Create owner
        INSERT INTO owners (id, name, email) VALUES 
          (gen_random_uuid(), 'Test Owner ' || i, 'owner' || i || '@test.com')
          RETURNING id INTO owner_id;
        
        -- Add owner to project
        BEGIN
            INSERT INTO project_owners (project_id, owner_id, percentage, role) VALUES 
              (project_id, owner_id, 100.0 / 11, 'co-owner');
            
            IF i = 11 THEN
                RAISE NOTICE 'Test 3 FAILED: Should have failed when adding 11th owner';
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                IF i = 11 THEN
                    RAISE NOTICE 'Test 3 PASSED: Correctly rejected 11th owner (%)', SQLERRM;
                ELSE
                    RAISE NOTICE 'Unexpected error adding owner %: %', i, SQLERRM;
                END IF;
        END;
    END LOOP;
END $$;

ROLLBACK;

-- Test 4: Try to delete the only owner from a project (should fail)
BEGIN;

-- Create test owner and project
INSERT INTO owners (id, name, email) VALUES 
  (gen_random_uuid(), 'Test Owner 5', 'owner5@test.com');

INSERT INTO projects (id, name, type, address) VALUES 
  (gen_random_uuid(), 'Test Project 4', 'Colony', '321 Test Lane');

-- Add the owner to the project
DO $$
DECLARE
    project_id UUID;
    owner_id UUID;
BEGIN
    -- Get IDs
    SELECT id INTO project_id FROM projects WHERE name = 'Test Project 4';
    SELECT id INTO owner_id FROM owners WHERE name = 'Test Owner 5';
    
    -- Add owner
    INSERT INTO project_owners (project_id, owner_id, percentage, role) VALUES 
      (project_id, owner_id, 100.0, 'primary');
    
    -- Try to delete the only owner
    BEGIN
        DELETE FROM project_owners WHERE project_id = project_id AND owner_id = owner_id;
        RAISE NOTICE 'Test 4 FAILED: Should have failed when deleting the only owner';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Test 4 PASSED: Correctly rejected deletion of only owner (%)', SQLERRM;
    END;
END $$;

ROLLBACK;

-- Test 5: Test project user role limits
BEGIN;

-- Create test project
INSERT INTO projects (id, name, type, address) VALUES 
  (gen_random_uuid(), 'Test Project 5', 'Colony', '654 Test Road');

-- Try to add more than 4 admins
DO $$
DECLARE
    project_id UUID;
    i INTEGER;
BEGIN
    -- Get the project ID
    SELECT id INTO project_id FROM projects WHERE name = 'Test Project 5';
    
    -- Try to add 5 admins
    FOR i IN 1..5 LOOP
        BEGIN
            INSERT INTO project_users (id, project_id, username, email, role) VALUES 
              (gen_random_uuid(), project_id, 'admin' || i, 'admin' || i || '@test.com', 'admin');
            
            IF i = 5 THEN
                RAISE NOTICE 'Test 5 FAILED: Should have failed when adding 5th admin';
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                IF i = 5 THEN
                    RAISE NOTICE 'Test 5 PASSED: Correctly rejected 5th admin (%)', SQLERRM;
                ELSE
                    RAISE NOTICE 'Unexpected error adding admin %: %', i, SQLERRM;
                END IF;
        END;
    END LOOP;
END $$;

ROLLBACK;

-- Test 6: Test house owner validation
BEGIN;

-- Create test project, owner, and house
INSERT INTO projects (id, name, type, address) VALUES 
  (gen_random_uuid(), 'Test Project 6', 'Colony', '987 Test Way');

INSERT INTO owners (id, name, email) VALUES 
  (gen_random_uuid(), 'Test Owner 6', 'owner6@test.com');

INSERT INTO houses (id, project_id, name, category_type) VALUES 
  (gen_random_uuid(), (SELECT id FROM projects WHERE name = 'Test Project 6'), 'Test House', '2BHK');

-- Try to add house owner with invalid percentage
DO $$
DECLARE
    house_id UUID;
    owner_id UUID;
BEGIN
    -- Get IDs
    SELECT id INTO house_id FROM houses WHERE name = 'Test House';
    SELECT id INTO owner_id FROM owners WHERE name = 'Test Owner 6';
    
    -- Try to add owner with percentage != 100
    BEGIN
        INSERT INTO house_owners (house_id, owner_id, percentage, role) VALUES 
          (house_id, owner_id, 80.0, 'primary');
        RAISE NOTICE 'Test 6 FAILED: Should have failed with percentage 80% (not 100%)';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Test 6 PASSED: Correctly rejected invalid house owner percentage (%)', SQLERRM;
    END;
END $$;

ROLLBACK;

-- Test 7: Test successful house owner creation
BEGIN;

-- Create test project, owner, and house
INSERT INTO projects (id, name, type, address) VALUES 
  (gen_random_uuid(), 'Test Project 7', 'Colony', '147 Test Street');

INSERT INTO owners (id, name, email) VALUES 
  (gen_random_uuid(), 'Test Owner 7', 'owner7@test.com');

INSERT INTO houses (id, project_id, name, category_type) VALUES 
  (gen_random_uuid(), (SELECT id FROM projects WHERE name = 'Test Project 7'), 'Test House 7', '3BHK');

-- Add house owner with valid percentage
DO $$
DECLARE
    house_id UUID;
    owner_id UUID;
BEGIN
    -- Get IDs
    SELECT id INTO house_id FROM houses WHERE name = 'Test House 7';
    SELECT id INTO owner_id FROM owners WHERE name = 'Test Owner 7';
    
    -- Add owner with percentage = 100
    INSERT INTO house_owners (house_id, owner_id, percentage, role) VALUES 
      (house_id, owner_id, 100.0, 'primary');
    
    RAISE NOTICE 'Test 7 PASSED: Successfully created house owner with 100%';
END $$;

ROLLBACK;

-- Summary
SELECT 'All tests completed. Check the output above for results.' as test_summary;
