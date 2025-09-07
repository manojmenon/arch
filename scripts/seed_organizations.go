package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
	"github.com/google/uuid"
)

const (
	host     = "localhost"
	port     = 5434
	user     = "postgres"
	password = "password"
	dbname   = "project_management"
)

func main() {
	// Connect to database
	psqlInfo := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Test connection
	if err = db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	fmt.Println("Connected to database successfully!")

	// Start transaction
	tx, err := db.Begin()
	if err != nil {
		log.Fatal("Failed to begin transaction:", err)
	}
	defer tx.Rollback()

	// Create sample organizations and update existing data
	if err := createOrganizationsAndUpdateData(tx); err != nil {
		log.Fatal("Failed to create organizations and update data:", err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		log.Fatal("Failed to commit transaction:", err)
	}

	fmt.Println("Organizations and updated data created successfully!")
}

func createOrganizationsAndUpdateData(tx *sql.Tx) error {
	// Create organizations
	acmeID := uuid.New()
	metroID := uuid.New()
	greenID := uuid.New()

	organizations := []struct {
		id          string
		name        string
		description string
		orgType     string
		address     string
		city        string
		state       string
		postalCode  string
		country     string
		phone       string
		email       string
		website     string
	}{
		{
			acmeID.String(),
			"ACME Real Estate Group",
			"Leading real estate development company specializing in residential and commercial projects",
			"Company",
			"123 Business Plaza, Suite 100",
			"Los Angeles",
			"CA",
			"90210",
			"US",
			"+1-555-0100",
			"info@acmerealestate.com",
			"https://acmerealestate.com",
		},
		{
			metroID.String(),
			"Metro Development Corp",
			"Urban development and housing solutions for growing cities",
			"Company",
			"456 Urban Center, Floor 15",
			"San Francisco",
			"CA",
			"94102",
			"US",
			"+1-555-0200",
			"contact@metrodev.com",
			"https://metrodev.com",
		},
		{
			greenID.String(),
			"Green Living Solutions",
			"Sustainable and eco-friendly housing development",
			"NGO",
			"789 Eco Park, Building A",
			"Portland",
			"OR",
			"97201",
			"US",
			"+1-555-0300",
			"hello@greenliving.org",
			"https://greenliving.org",
		},
	}

	for _, org := range organizations {
		_, err := tx.Exec(`
			INSERT INTO organizations (id, name, description, type, address, city, state, postal_code, country, phone, email, website, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		`, org.id, org.name, org.description, org.orgType, org.address, org.city, org.state, org.postalCode, org.country, org.phone, org.email, org.website, time.Now(), time.Now())
		if err != nil {
			return fmt.Errorf("failed to insert organization %s: %v", org.name, err)
		}
		fmt.Printf("Created organization: %s\n", org.name)
	}

	// Create project categories
	categories := []struct {
		id             string
		organizationID string
		name           string
		description    string
		color          string
		icon           string
	}{
		{uuid.New().String(), acmeID.String(), "Residential", "Residential housing projects", "#3B82F6", "home"},
		{uuid.New().String(), acmeID.String(), "Commercial", "Commercial and office buildings", "#10B981", "building"},
		{uuid.New().String(), metroID.String(), "Urban Development", "Urban planning and development", "#F59E0B", "city"},
		{uuid.New().String(), metroID.String(), "Infrastructure", "Infrastructure and utilities", "#8B5CF6", "wrench"},
		{uuid.New().String(), greenID.String(), "Sustainable Housing", "Eco-friendly housing solutions", "#059669", "leaf"},
		{uuid.New().String(), greenID.String(), "Green Infrastructure", "Sustainable infrastructure projects", "#0D9488", "tree"},
	}

	for _, cat := range categories {
		_, err := tx.Exec(`
			INSERT INTO project_categories (id, organization_id, name, description, color, icon, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`, cat.id, cat.organizationID, cat.name, cat.description, cat.color, cat.icon, time.Now(), time.Now())
		if err != nil {
			return fmt.Errorf("failed to insert category %s: %v", cat.name, err)
		}
		fmt.Printf("Created category: %s\n", cat.name)
	}

	// Create project tags
	tags := []struct {
		id             string
		organizationID string
		name           string
		description    string
		color          string
	}{
		{uuid.New().String(), acmeID.String(), "High-End", "Luxury and high-end projects", "#DC2626"},
		{uuid.New().String(), acmeID.String(), "Affordable", "Affordable housing projects", "#16A34A"},
		{uuid.New().String(), metroID.String(), "Mixed-Use", "Mixed-use development projects", "#7C3AED"},
		{uuid.New().String(), metroID.String(), "Transit-Oriented", "Transit-oriented development", "#EA580C"},
		{uuid.New().String(), greenID.String(), "LEED Certified", "LEED certified buildings", "#059669"},
		{uuid.New().String(), greenID.String(), "Solar Powered", "Solar energy integrated projects", "#F59E0B"},
		{uuid.New().String(), greenID.String(), "Water Efficient", "Water conservation projects", "#0EA5E9"},
	}

	for _, tag := range tags {
		_, err := tx.Exec(`
			INSERT INTO project_tags (id, organization_id, name, description, color, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, tag.id, tag.organizationID, tag.name, tag.description, tag.color, time.Now(), time.Now())
		if err != nil {
			return fmt.Errorf("failed to insert tag %s: %v", tag.name, err)
		}
		fmt.Printf("Created tag: %s\n", tag.name)
	}

	// Update existing projects with organization and category assignments
	// Get existing project IDs
	var projectIDs []string
	rows, err := tx.Query("SELECT id, name FROM projects WHERE deleted_at IS NULL")
	if err != nil {
		return fmt.Errorf("failed to query existing projects: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id, name string
		if err := rows.Scan(&id, &name); err != nil {
			return fmt.Errorf("failed to scan project: %v", err)
		}
		projectIDs = append(projectIDs, id)
	}

	// Assign organizations and categories to existing projects
	if len(projectIDs) >= 3 {
		// Green Meadows Colony -> ACME Real Estate Group, Residential category
		_, err = tx.Exec(`
			UPDATE projects 
			SET organization_id = $1, category_id = $2, status = 'active', priority = 'high'
			WHERE id = $3
		`, acmeID.String(), categories[0].id, projectIDs[0])
		if err != nil {
			return fmt.Errorf("failed to update Green Meadows project: %v", err)
		}

		// Sunset Villa -> ACME Real Estate Group, Residential category
		_, err = tx.Exec(`
			UPDATE projects 
			SET organization_id = $1, category_id = $2, status = 'active', priority = 'medium'
			WHERE id = $3
		`, acmeID.String(), categories[0].id, projectIDs[1])
		if err != nil {
			return fmt.Errorf("failed to update Sunset Villa project: %v", err)
		}

		// Oak Ridge -> Metro Development Corp, Urban Development category
		_, err = tx.Exec(`
			UPDATE projects 
			SET organization_id = $1, category_id = $2, status = 'planning', priority = 'high'
			WHERE id = $3
		`, metroID.String(), categories[2].id, projectIDs[2])
		if err != nil {
			return fmt.Errorf("failed to update Oak Ridge project: %v", err)
		}
	}

	// Assign tags to projects
	if len(projectIDs) >= 3 {
		// Green Meadows Colony -> High-End, Mixed-Use tags
		_, err = tx.Exec(`
			INSERT INTO project_tag_assignments (project_id, tag_id, created_at)
			VALUES ($1, $2, $3), ($4, $5, $6)
		`, projectIDs[0], tags[0].id, time.Now(), projectIDs[0], tags[2].id, time.Now())
		if err != nil {
			return fmt.Errorf("failed to assign tags to Green Meadows: %v", err)
		}

		// Sunset Villa -> High-End tag
		_, err = tx.Exec(`
			INSERT INTO project_tag_assignments (project_id, tag_id, created_at)
			VALUES ($1, $2, $3)
		`, projectIDs[1], tags[0].id, time.Now())
		if err != nil {
			return fmt.Errorf("failed to assign tags to Sunset Villa: %v", err)
		}

		// Oak Ridge -> Transit-Oriented, LEED Certified tags
		_, err = tx.Exec(`
			INSERT INTO project_tag_assignments (project_id, tag_id, created_at)
			VALUES ($1, $2, $3), ($4, $5, $6)
		`, projectIDs[2], tags[3].id, time.Now(), projectIDs[2], tags[4].id, time.Now())
		if err != nil {
			return fmt.Errorf("failed to assign tags to Oak Ridge: %v", err)
		}
	}

	// Create organization users (assign existing users to organizations)
	// Get existing user IDs
	var userIDs []string
	rows, err = tx.Query("SELECT id, username FROM users LIMIT 3")
	if err != nil {
		return fmt.Errorf("failed to query existing users: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id, username string
		if err := rows.Scan(&id, &username); err != nil {
			return fmt.Errorf("failed to scan user: %v", err)
		}
		userIDs = append(userIDs, id)
	}

	// Assign users to organizations
	if len(userIDs) >= 3 {
		// User 1 -> ACME Real Estate Group (admin)
		_, err = tx.Exec(`
			INSERT INTO organization_users (id, organization_id, user_id, role, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, uuid.New().String(), acmeID.String(), userIDs[0], "admin", time.Now(), time.Now())
		if err != nil {
			return fmt.Errorf("failed to assign user to ACME: %v", err)
		}

		// User 2 -> Metro Development Corp (manager)
		_, err = tx.Exec(`
			INSERT INTO organization_users (id, organization_id, user_id, role, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, uuid.New().String(), metroID.String(), userIDs[1], "manager", time.Now(), time.Now())
		if err != nil {
			return fmt.Errorf("failed to assign user to Metro: %v", err)
		}

		// User 3 -> Green Living Solutions (viewer)
		_, err = tx.Exec(`
			INSERT INTO organization_users (id, organization_id, user_id, role, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, uuid.New().String(), greenID.String(), userIDs[2], "viewer", time.Now(), time.Now())
		if err != nil {
			return fmt.Errorf("failed to assign user to Green: %v", err)
		}
	}

	// Create project phases for existing projects
	if len(projectIDs) >= 3 {
		// Green Meadows Colony phases
		phases := []struct {
			projectID string
			name      string
			order     int
			status    string
		}{
			{projectIDs[0], "Planning & Design", 1, "completed"},
			{projectIDs[0], "Construction", 2, "active"},
			{projectIDs[0], "Finishing", 3, "pending"},
			{projectIDs[0], "Handover", 4, "pending"},
		}

		for _, phase := range phases {
			_, err = tx.Exec(`
				INSERT INTO project_phases (id, project_id, name, phase_order, status, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
			`, uuid.New().String(), phase.projectID, phase.name, phase.order, phase.status, time.Now(), time.Now())
			if err != nil {
				return fmt.Errorf("failed to insert phase %s: %v", phase.name, err)
			}
		}
		fmt.Printf("Created project phases for Green Meadows Colony\n")
	}

	fmt.Printf("Successfully updated %d projects with organization assignments\n", len(projectIDs))
	return nil
}
