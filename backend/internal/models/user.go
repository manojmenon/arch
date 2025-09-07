package models

import (
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleSuperuser  Role = "superuser"
	RoleSysadmin   Role = "sysadmin"
	RoleLocaladmin Role = "localadmin"
	RoleUser       Role = "user"
	RoleGuest      Role = "guest"
)

type User struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Username  string    `json:"username" db:"username"`
	Email     string    `json:"email" db:"email"`
	Password  string    `json:"-" db:"password"` // Never serialize password
	Role      Role      `json:"role" db:"role"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type CreateUserRequest struct {
	Username string `json:"username" validate:"required,min=3,max=50"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	User         *User  `json:"user"`
	SessionToken string `json:"session_token"`
	ExpiresAt    string `json:"expires_at"`
}

type UpdateUserRequest struct {
	Username *string `json:"username,omitempty" validate:"omitempty,min=3,max=50"`
	Email    *string `json:"email,omitempty" validate:"omitempty,email"`
	Role     *Role   `json:"role,omitempty"`
}

// HasRole checks if user has the required role or higher
func (u *User) HasRole(required Role) bool {
	roleHierarchy := map[Role]int{
		RoleGuest:      1,
		RoleUser:       2,
		RoleLocaladmin: 3,
		RoleSysadmin:   4,
		RoleSuperuser:  5,
	}

	userLevel := roleHierarchy[u.Role]
	requiredLevel := roleHierarchy[required]

	return userLevel >= requiredLevel
}

// HasAnyRole checks if user has any of the required roles
func (u *User) HasAnyRole(roles []Role) bool {
	for _, role := range roles {
		if u.HasRole(role) {
			return true
		}
	}
	return false
}

