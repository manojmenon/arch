package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Project struct {
	ID         uuid.UUID  `json:"id" db:"id"`
	Name       string     `json:"name" db:"name"`
	Address    *string    `json:"address,omitempty" db:"address"`
	City       *string    `json:"city,omitempty" db:"city"`
	State      *string    `json:"state,omitempty" db:"state"`
	PostalCode *string    `json:"postal_code,omitempty" db:"postal_code"`
	OwnerName  *string    `json:"owner_name,omitempty" db:"owner_name"`
	Status     *string    `json:"status,omitempty" db:"status"`
	Budget     *float64   `json:"budget,omitempty" db:"budget"`
	StartDate  *time.Time `json:"start_date,omitempty" db:"start_date"`
	EndDate    *time.Time `json:"end_date,omitempty" db:"end_date"`
	Metadata   JSONB      `json:"metadata,omitempty" db:"metadata"`
	Documents  JSONB      `json:"documents,omitempty" db:"documents"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at" db:"updated_at"`
}

type CreateProjectRequest struct {
	Name       string                 `json:"name" validate:"required,min=1,max=255"`
	Address    *string                `json:"address,omitempty" validate:"omitempty,max=255"`
	City       *string                `json:"city,omitempty" validate:"omitempty,max=100"`
	State      *string                `json:"state,omitempty" validate:"omitempty,max=100"`
	PostalCode *string                `json:"postal_code,omitempty" validate:"omitempty,max=20"`
	OwnerName  *string                `json:"owner_name,omitempty" validate:"omitempty,max=255"`
	Status     *string                `json:"status,omitempty" validate:"omitempty,oneof=planning active completed on-hold cancelled"`
	Budget     *float64               `json:"budget,omitempty" validate:"omitempty,min=0"`
	StartDate  *time.Time             `json:"start_date,omitempty"`
	EndDate    *time.Time             `json:"end_date,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	Documents  map[string]interface{} `json:"documents,omitempty"`
}

type UpdateProjectRequest struct {
	Name       *string                `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	Address    *string                `json:"address,omitempty" validate:"omitempty,max=255"`
	City       *string                `json:"city,omitempty" validate:"omitempty,max=100"`
	State      *string                `json:"state,omitempty" validate:"omitempty,max=100"`
	PostalCode *string                `json:"postal_code,omitempty" validate:"omitempty,max=20"`
	OwnerName  *string                `json:"owner_name,omitempty" validate:"omitempty,max=255"`
	Status     *string                `json:"status,omitempty" validate:"omitempty,oneof=planning active completed on-hold cancelled"`
	Budget     *float64               `json:"budget,omitempty" validate:"omitempty,min=0"`
	StartDate  *time.Time             `json:"start_date,omitempty"`
	EndDate    *time.Time             `json:"end_date,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	Documents  map[string]interface{} `json:"documents,omitempty"`
}

// JSONB is a custom type for PostgreSQL JSONB fields
type JSONB map[string]interface{}

// Value implements the driver.Valuer interface for database storage
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan implements the sql.Scanner interface for database retrieval
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return json.Unmarshal([]byte(value.(string)), j)
	}

	return json.Unmarshal(bytes, j)
}

