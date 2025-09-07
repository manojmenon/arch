-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using Argon2id
INSERT INTO users (id, username, email, password, role, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin', 'admin@example.com', 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 'superuser', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'manager', 'manager@example.com', 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 'localadmin', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'user1', 'user1@example.com', 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 'user', NOW(), NOW());

-- Insert sample projects
INSERT INTO projects (id, name, address, city, state, postal_code, owner_name, status, budget, start_date, end_date, metadata, documents, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'Downtown Residential Complex', '123 Main St', 'New York', 'NY', '10001', 'John Smith', 'active', 2500000.00, '2024-01-01', '2024-12-31', '{"floors": 20, "units": 150, "amenities": ["gym", "pool", "parking"]}', '{"permits": ["building", "electrical"], "contracts": ["construction", "architect"]}', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440001', 'Suburban Family Homes', '456 Oak Ave', 'Los Angeles', 'CA', '90210', 'Jane Doe', 'planning', 1800000.00, '2024-03-01', '2024-11-30', '{"homes": 12, "lot_size": "0.5 acres", "style": "modern"}', '{"permits": ["zoning"], "contracts": ["architect"]}', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'Luxury Condominiums', '789 Park Blvd', 'Miami', 'FL', '33101', 'Robert Johnson', 'completed', 5000000.00, '2023-06-01', '2024-01-31', '{"floors": 35, "units": 200, "amenities": ["concierge", "spa", "rooftop"]}', '{"permits": ["building", "electrical", "plumbing"], "contracts": ["construction", "architect", "interior"]}', NOW(), NOW());

