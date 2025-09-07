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

	// Create sample data
	if err := createSampleData(tx); err != nil {
		log.Fatal("Failed to create sample data:", err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		log.Fatal("Failed to commit transaction:", err)
	}

	fmt.Println("Sample data created successfully!")
}

func createSampleData(tx *sql.Tx) error {
	// Create owners
	aliceID := uuid.New()
	bobID := uuid.New()
	charlieID := uuid.New()
	davidID := uuid.New()

	owners := []struct {
		id    string
		name  string
		email string
		phone string
	}{
		{aliceID.String(), "Alice Johnson", "alice@example.com", "+1-555-0101"},
		{bobID.String(), "Bob Smith", "bob@example.com", "+1-555-0102"},
		{charlieID.String(), "Charlie Brown", "charlie@example.com", "+1-555-0103"},
		{davidID.String(), "David Wilson", "david@example.com", "+1-555-0104"},
	}

	for _, owner := range owners {
		_, err := tx.Exec(`
			INSERT INTO owners (id, name, email, phone, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, owner.id, owner.name, owner.email, owner.phone, time.Now(), time.Now())
		if err != nil {
			return fmt.Errorf("failed to insert owner %s: %v", owner.name, err)
		}
		fmt.Printf("Created owner: %s\n", owner.name)
	}

	// Create projects
	greenMeadowsID := uuid.New()
	sunsetVillaID := uuid.New()
	oakRidgeID := uuid.New()

	projects := []struct {
		id          string
		name        string
		projectType string
		address     string
		city        string
		state       string
		postalCode  string
		latitude    float64
		longitude   float64
	}{
		{
			greenMeadowsID.String(),
			"Green Meadows Colony",
			"Colony",
			"10 Meadow Lane",
			"Metropolis",
			"CA",
			"90210",
			34.0522,
			-118.2437,
		},
		{
			sunsetVillaID.String(),
			"Sunset Villa",
			"IndependentHouse",
			"123 Sunset Boulevard",
			"Los Angeles",
			"CA",
			"90211",
			34.0736,
			-118.4004,
		},
		{
			oakRidgeID.String(),
			"Oak Ridge Housing Estate",
			"HousingEstate",
			"456 Oak Street",
			"San Francisco",
			"CA",
			"94102",
			37.7749,
			-122.4194,
		},
	}

	for _, project := range projects {
		_, err := tx.Exec(`
			INSERT INTO projects (id, name, type, address, city, state, postal_code, latitude, longitude, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`, project.id, project.name, project.projectType, project.address, project.city, project.state, project.postalCode, project.latitude, project.longitude, time.Now(), time.Now())
		if err != nil {
			return fmt.Errorf("failed to insert project %s: %v", project.name, err)
		}
		fmt.Printf("Created project: %s\n", project.name)
	}

	// Create project owners (with proper percentage distribution)
	// We need to insert all owners for a project at once to satisfy the 100% constraint
	
	// Green Meadows Colony - Alice (60%) + Bob (40%)
	_, err := tx.Exec(`
		INSERT INTO project_owners (project_id, owner_id, percentage, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)
	`, 
		greenMeadowsID.String(), aliceID.String(), 60.0, "primary", time.Now(), time.Now(),
		greenMeadowsID.String(), bobID.String(), 40.0, "co-owner", time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to insert Green Meadows owners: %v", err)
	}
	fmt.Printf("Created Green Meadows owners: Alice 60%%, Bob 40%%\n")
	
	// Sunset Villa - Charlie (100%)
	_, err = tx.Exec(`
		INSERT INTO project_owners (project_id, owner_id, percentage, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, sunsetVillaID.String(), charlieID.String(), 100.0, "primary", time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to insert Sunset Villa owner: %v", err)
	}
	fmt.Printf("Created Sunset Villa owner: Charlie 100%%\n")
	
	// Oak Ridge - David (70%) + Alice (30%)
	_, err = tx.Exec(`
		INSERT INTO project_owners (project_id, owner_id, percentage, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)
	`, 
		oakRidgeID.String(), davidID.String(), 70.0, "primary", time.Now(), time.Now(),
		oakRidgeID.String(), aliceID.String(), 30.0, "co-owner", time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to insert Oak Ridge owners: %v", err)
	}
	fmt.Printf("Created Oak Ridge owners: David 70%%, Alice 30%%\n")

	// Create apartment buildings
	blockAID := uuid.New()
	blockBID := uuid.New()

	buildings := []struct {
		id        string
		projectID string
		name      string
		address   string
		floors    int
	}{
		{blockAID.String(), greenMeadowsID.String(), "Block A", "10 Meadow Lane, Block A", 5},
		{blockBID.String(), greenMeadowsID.String(), "Block B", "10 Meadow Lane, Block B", 4},
	}

	for _, building := range buildings {
		_, err := tx.Exec(`
			INSERT INTO apartment_buildings (id, project_id, name, address, floors, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, building.id, building.projectID, building.name, building.address, building.floors, time.Now(), time.Now())
		if err != nil {
			return fmt.Errorf("failed to insert building %s: %v", building.name, err)
		}
		fmt.Printf("Created building: %s\n", building.name)
	}

	// Create houses
	blockAIDStr := blockAID.String()
	blockBIDStr := blockBID.String()
	
	houses := []struct {
		id           string
		projectID    string
		buildingID   *string
		unitNumber   *string
		name         string
		categoryType string
		sizeSqm      float64
	}{
		// Houses in Block A
		{uuid.New().String(), greenMeadowsID.String(), &blockAIDStr, stringPtr("1A"), "Unit 1A", "2BHK", 75.5},
		{uuid.New().String(), greenMeadowsID.String(), &blockAIDStr, stringPtr("1B"), "Unit 1B", "1BHK", 50.0},
		{uuid.New().String(), greenMeadowsID.String(), &blockAIDStr, stringPtr("2A"), "Unit 2A", "3BHK", 95.0},
		{uuid.New().String(), greenMeadowsID.String(), &blockAIDStr, stringPtr("2B"), "Unit 2B", "2BHK", 70.0},
		
		// Houses in Block B
		{uuid.New().String(), greenMeadowsID.String(), &blockBIDStr, stringPtr("1A"), "Unit 1A", "1BHK", 45.0},
		{uuid.New().String(), greenMeadowsID.String(), &blockBIDStr, stringPtr("1B"), "Unit 1B", "Studio", 30.0},
		
		// Standalone houses
		{uuid.New().String(), sunsetVillaID.String(), nil, nil, "Main House", "4BHK", 150.0},
		{uuid.New().String(), oakRidgeID.String(), nil, nil, "Villa 1", "3BHK", 120.0},
		{uuid.New().String(), oakRidgeID.String(), nil, nil, "Villa 2", "2BHK", 85.0},
	}

	houseIDs := make([]string, len(houses))
	for i, house := range houses {
		houseIDs[i] = house.id
		_, err := tx.Exec(`
			INSERT INTO houses (id, project_id, building_id, unit_number, name, category_type, size_sqm, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`, house.id, house.projectID, house.buildingID, house.unitNumber, house.name, house.categoryType, house.sizeSqm, time.Now(), time.Now())
		if err != nil {
			return fmt.Errorf("failed to insert house %s: %v", house.name, err)
		}
		fmt.Printf("Created house: %s\n", house.name)
	}

	// Create house owners (with proper percentage distribution)
	// We need to insert all owners for a house at once to satisfy the 100% constraint
	
	// Green Meadows houses
	// Unit 1A - Alice owns 100%
	_, err = tx.Exec(`
		INSERT INTO house_owners (house_id, owner_id, percentage, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, houseIDs[0], aliceID.String(), 100.0, "primary", time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to insert house owner for Unit 1A: %v", err)
	}
	
	// Unit 1B - Bob owns 100%
	_, err = tx.Exec(`
		INSERT INTO house_owners (house_id, owner_id, percentage, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, houseIDs[1], bobID.String(), 100.0, "primary", time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to insert house owner for Unit 1B: %v", err)
	}
	
	// Unit 2A - Alice 60%, Bob 40%
	_, err = tx.Exec(`
		INSERT INTO house_owners (house_id, owner_id, percentage, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)
	`, 
		houseIDs[2], aliceID.String(), 60.0, "primary", time.Now(), time.Now(),
		houseIDs[2], bobID.String(), 40.0, "co-owner", time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to insert house owners for Unit 2A: %v", err)
	}
	
	// Unit 2B - Bob owns 100%
	_, err = tx.Exec(`
		INSERT INTO house_owners (house_id, owner_id, percentage, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, houseIDs[3], bobID.String(), 100.0, "primary", time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to insert house owner for Unit 2B: %v", err)
	}
	
	// Block B Unit 1A - Alice owns 100%
	_, err = tx.Exec(`
		INSERT INTO house_owners (house_id, owner_id, percentage, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, houseIDs[4], aliceID.String(), 100.0, "primary", time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to insert house owner for Block B Unit 1A: %v", err)
	}
	
	// Block B Unit 1B - Bob owns 100%
	_, err = tx.Exec(`
		INSERT INTO house_owners (house_id, owner_id, percentage, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, houseIDs[5], bobID.String(), 100.0, "primary", time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to insert house owner for Block B Unit 1B: %v", err)
	}
	
	// Sunset Villa - Charlie owns 100%
	_, err = tx.Exec(`
		INSERT INTO house_owners (house_id, owner_id, percentage, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, houseIDs[6], charlieID.String(), 100.0, "primary", time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to insert house owner for Main House: %v", err)
	}
	
	// Villa 1 - David 70%, Alice 30%
	_, err = tx.Exec(`
		INSERT INTO house_owners (house_id, owner_id, percentage, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)
	`, 
		houseIDs[7], davidID.String(), 70.0, "primary", time.Now(), time.Now(),
		houseIDs[7], aliceID.String(), 30.0, "co-owner", time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to insert house owners for Villa 1: %v", err)
	}
	
	// Villa 2 - David owns 100%
	_, err = tx.Exec(`
		INSERT INTO house_owners (house_id, owner_id, percentage, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, houseIDs[8], davidID.String(), 100.0, "primary", time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to insert house owner for Villa 2: %v", err)
	}
	
	fmt.Printf("Created all house owner relationships\n")

	// Create project users
	projectUsers := []struct {
		projectID string
		username  string
		email     string
		role      string
	}{
		// Green Meadows Colony users
		{greenMeadowsID.String(), "admin_green", "admin@greenmeadows.com", "admin"},
		{greenMeadowsID.String(), "subadmin1_green", "subadmin1@greenmeadows.com", "subadmin"},
		{greenMeadowsID.String(), "subadmin2_green", "subadmin2@greenmeadows.com", "subadmin"},
		{greenMeadowsID.String(), "user1_green", "user1@greenmeadows.com", "user"},
		{greenMeadowsID.String(), "user2_green", "user2@greenmeadows.com", "user"},
		
		// Sunset Villa users
		{sunsetVillaID.String(), "admin_sunset", "admin@sunsetvilla.com", "admin"},
		{sunsetVillaID.String(), "user_sunset", "user@sunsetvilla.com", "user"},
		
		// Oak Ridge users
		{oakRidgeID.String(), "admin_oak", "admin@oakridge.com", "admin"},
		{oakRidgeID.String(), "subadmin_oak", "subadmin@oakridge.com", "subadmin"},
		{oakRidgeID.String(), "user1_oak", "user1@oakridge.com", "user"},
		{oakRidgeID.String(), "user2_oak", "user2@oakridge.com", "user"},
		{oakRidgeID.String(), "user3_oak", "user3@oakridge.com", "user"},
	}

	for _, pu := range projectUsers {
		_, err := tx.Exec(`
			INSERT INTO project_users (id, project_id, username, email, role, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, uuid.New().String(), pu.projectID, pu.username, pu.email, pu.role, time.Now(), time.Now())
		if err != nil {
			return fmt.Errorf("failed to insert project user %s: %v", pu.username, err)
		}
		fmt.Printf("Created project user: %s (%s)\n", pu.username, pu.role)
	}

	return nil
}

func stringPtr(s string) *string {
	return &s
}
