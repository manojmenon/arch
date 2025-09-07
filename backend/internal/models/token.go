package models

import (
	"time"

	"github.com/google/uuid"
)

type APIToken struct {
	ID         uuid.UUID  `json:"id" db:"id"`
	UserID     uuid.UUID  `json:"user_id" db:"user_id"`
	Name       string     `json:"name" db:"name"`
	Token      string     `json:"token" db:"token"`
	ExpiresAt  time.Time  `json:"expires_at" db:"expires_at"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty" db:"last_used_at"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
}

type CreateTokenRequest struct {
	Name           string `json:"name" validate:"required,min=1,max=100"`
	ExpiresInHours int    `json:"expires_in_hours,omitempty" validate:"omitempty,min=1,max=24"`
}

type TokenResponse struct {
	ID         uuid.UUID  `json:"id"`
	Name       string     `json:"name"`
	Token      string     `json:"token"`
	ExpiresAt  time.Time  `json:"expires_at"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

// IsExpired checks if the token has expired
func (t *APIToken) IsExpired() bool {
	return time.Now().After(t.ExpiresAt)
}

// UpdateLastUsed updates the last used timestamp
func (t *APIToken) UpdateLastUsed() {
	now := time.Now()
	t.LastUsedAt = &now
}

