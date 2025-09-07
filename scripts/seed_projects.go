package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"

	_ "github.com/lib/pq"
)

type Project struct {
	ID         string                 `json:"id"`
	Name       string                 `json:"name"`
	Address    string                 `json:"address"`
	City       string                 `json:"city"`
	State      string                 `json:"state"`
	PostalCode string                 `json:"postal_code"`
	OwnerName  string                 `json:"owner_name"`
	Status     string                 `json:"status"`
	Budget     float64                `json:"budget"`
	StartDate  time.Time              `json:"start_date"`
	EndDate    time.Time              `json:"end_date"`
	Metadata   map[string]interface{} `json:"metadata"`
	Documents  map[string]interface{} `json:"documents"`
	CreatedAt  time.Time              `json:"created_at"`
	UpdatedAt  time.Time              `json:"updated_at"`
}

var (
	cities     = []string{"New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle", "Denver", "Washington"}
	states     = []string{"NY", "CA", "IL", "TX", "AZ", "PA", "TX", "CA", "TX", "CA", "TX", "FL", "TX", "OH", "NC", "CA", "IN", "WA", "CO", "DC"}
	statuses   = []string{"planning", "active", "completed", "on-hold", "cancelled"}
	firstNames = []string{"John", "Jane", "Robert", "Sarah", "Michael", "Emily", "David", "Jessica", "James", "Ashley", "William", "Amanda", "Richard", "Jennifer", "Joseph", "Lisa", "Thomas", "Nancy", "Christopher", "Karen"}
	lastNames  = []string{"Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"}
)

func main() {
	// Database connection
	db, err := sql.Open("postgres", "postgres://postgres:password@localhost:5432/project_management?sslmode=disable")
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	fmt.Println("Connected to database successfully")

	// Generate and insert 100 projects
	projects := generateProjects(100)

	ctx := context.Background()
	for i, project := range projects {
		if err := insertProject(ctx, db, project); err != nil {
			log.Printf("Failed to insert project %d: %v", i+1, err)
			continue
		}
		fmt.Printf("Inserted project %d: %s\n", i+1, project.Name)
	}

	fmt.Printf("Successfully inserted %d projects\n", len(projects))
}

func generateProjects(count int) []Project {
	rand.Seed(time.Now().UnixNano())
	projects := make([]Project, count)

	for i := 0; i < count; i++ {
		cityIdx := rand.Intn(len(cities))
		statusIdx := rand.Intn(len(statuses))
		firstNameIdx := rand.Intn(len(firstNames))
		lastNameIdx := rand.Intn(len(lastNames))

		project := Project{
			ID:         fmt.Sprintf("proj-%d", i+1),
			Name:       generateProjectName(),
			Address:    fmt.Sprintf("%d %s St", rand.Intn(9999)+1, generateStreetName()),
			City:       cities[cityIdx],
			State:      states[cityIdx],
			PostalCode: fmt.Sprintf("%05d", rand.Intn(99999)),
			OwnerName:  fmt.Sprintf("%s %s", firstNames[firstNameIdx], lastNames[lastNameIdx]),
			Status:     statuses[statusIdx],
			Budget:     float64(rand.Intn(5000000) + 100000),
			StartDate:  time.Now().AddDate(0, -rand.Intn(12), -rand.Intn(30)),
			EndDate:    time.Now().AddDate(0, rand.Intn(12), rand.Intn(30)),
			Metadata:   generateMetadata(),
			Documents:  generateDocuments(),
			CreatedAt:  time.Now().AddDate(0, -rand.Intn(6), -rand.Intn(30)),
			UpdatedAt:  time.Now().AddDate(0, -rand.Intn(3), -rand.Intn(15)),
		}

		projects[i] = project
	}

	return projects
}

func generateProjectName() string {
	types := []string{"Residential", "Commercial", "Mixed-Use", "Luxury", "Affordable", "Senior", "Student", "Family"}
	descriptions := []string{"Complex", "Towers", "Plaza", "Gardens", "Heights", "Village", "Manor", "Court", "Square", "Place"}

	return fmt.Sprintf("%s %s %s",
		types[rand.Intn(len(types))],
		generateStreetName(),
		descriptions[rand.Intn(len(descriptions))])
}

func generateStreetName() string {
	streets := []string{"Oak", "Pine", "Maple", "Cedar", "Elm", "Birch", "Willow", "Ash", "Poplar", "Hickory", "Main", "First", "Second", "Third", "Park", "Garden", "Hill", "Valley", "Ridge", "Creek"}
	return streets[rand.Intn(len(streets))]
}

func generateMetadata() map[string]interface{} {
	amenities := []string{"gym", "pool", "parking", "concierge", "rooftop", "spa", "laundry", "storage"}
	selectedAmenities := make([]string, rand.Intn(4)+1)
	for i := range selectedAmenities {
		selectedAmenities[i] = amenities[rand.Intn(len(amenities))]
	}

	return map[string]interface{}{
		"floors":    rand.Intn(30) + 1,
		"units":     rand.Intn(200) + 10,
		"amenities": selectedAmenities,
		"lot_size":  fmt.Sprintf("%.1f acres", rand.Float64()*2+0.1),
		"style":     []string{"modern", "traditional", "contemporary", "colonial"}[rand.Intn(4)],
	}
}

func generateDocuments() map[string]interface{} {
	permits := []string{"building", "electrical", "plumbing", "zoning", "environmental"}
	contracts := []string{"construction", "architect", "interior", "landscaping", "security"}

	selectedPermits := make([]string, rand.Intn(3)+1)
	for i := range selectedPermits {
		selectedPermits[i] = permits[rand.Intn(len(permits))]
	}

	selectedContracts := make([]string, rand.Intn(3)+1)
	for i := range selectedContracts {
		selectedContracts[i] = contracts[rand.Intn(len(contracts))]
	}

	return map[string]interface{}{
		"permits":     selectedPermits,
		"contracts":   selectedContracts,
		"inspections": rand.Intn(5) + 1,
	}
}

func insertProject(ctx context.Context, db *sql.DB, project Project) error {
	metadataJSON, _ := json.Marshal(project.Metadata)
	documentsJSON, _ := json.Marshal(project.Documents)

	query := `
		INSERT INTO projects (
			id, name, address, city, state, postal_code, owner_name, status,
			budget, start_date, end_date, metadata, documents, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`

	_, err := db.ExecContext(ctx, query,
		project.ID, project.Name, project.Address, project.City, project.State,
		project.PostalCode, project.OwnerName, project.Status, project.Budget,
		project.StartDate, project.EndDate, metadataJSON, documentsJSON,
		project.CreatedAt, project.UpdatedAt)

	return err
}

