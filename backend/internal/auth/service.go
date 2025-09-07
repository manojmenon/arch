package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"project-management-backend/internal/config"
	"project-management-backend/internal/db"
	"project-management-backend/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/argon2"
)

type Service struct {
	db     *db.Database
	config *config.Config
	logger *zap.Logger
}

type Claims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func NewService(database *db.Database, cfg *config.Config, logger *zap.Logger) *Service {
	return &Service{
		db:     database,
		config: cfg,
		logger: logger,
	}
}

func (s *Service) CreateUser(ctx context.Context, req *models.CreateUserRequest) (*models.User, error) {
	// Check if user already exists
	var existingUser models.User
	err := s.db.Pool.QueryRow(ctx,
		"SELECT id FROM users WHERE username = $1 OR email = $2",
		req.Username, req.Email).Scan(&existingUser.ID)

	if err == nil {
		return nil, fmt.Errorf("user with username or email already exists")
	}

	// Hash password
	hashedPassword, err := s.hashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		ID:        uuid.New(),
		Username:  req.Username,
		Email:     req.Email,
		Password:  hashedPassword,
		Role:      models.RoleUser, // Default role
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = s.db.Pool.Exec(ctx, `
		INSERT INTO users (id, username, email, password, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		user.ID, user.Username, user.Email, user.Password, user.Role, user.CreatedAt, user.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	s.logger.Info("User created", zap.String("user_id", user.ID.String()), zap.String("username", user.Username))
	return user, nil
}

func (s *Service) AuthenticateUser(ctx context.Context, req *models.LoginRequest) (*models.User, error) {
	var user models.User
	err := s.db.Pool.QueryRow(ctx,
		"SELECT id, username, email, password, role, created_at, updated_at FROM users WHERE username = $1",
		req.Username).Scan(
		&user.ID, &user.Username, &user.Email, &user.Password, &user.Role, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Verify password
	if !s.verifyPassword(req.Password, user.Password) {
		return nil, fmt.Errorf("invalid credentials")
	}

	s.logger.Info("User authenticated", zap.String("user_id", user.ID.String()), zap.String("username", user.Username))
	return &user, nil
}

func (s *Service) GenerateSessionToken(user *models.User) (string, time.Time, error) {
	claims := &Claims{
		UserID:   user.ID.String(),
		Username: user.Username,
		Role:     string(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.config.Auth.SessionDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.Auth.JWTSecret))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to generate token: %w", err)
	}

	expiresAt := time.Now().Add(s.config.Auth.SessionDuration)
	return tokenString, expiresAt, nil
}

func (s *Service) CreateAPIToken(ctx context.Context, userID uuid.UUID, req *models.CreateTokenRequest) (*models.APIToken, error) {
	// Generate random token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}
	tokenString := hex.EncodeToString(tokenBytes)

	// Calculate expiration
	expiresInHours := req.ExpiresInHours
	if expiresInHours == 0 {
		expiresInHours = 4 // Default 4 hours
	}
	expiresAt := time.Now().Add(time.Duration(expiresInHours) * time.Hour)

	// Create token record
	apiToken := &models.APIToken{
		ID:        uuid.New(),
		UserID:    userID,
		Name:      req.Name,
		Token:     tokenString,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
	}

	_, err := s.db.Pool.Exec(ctx, `
		INSERT INTO api_tokens (id, user_id, name, token, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		apiToken.ID, apiToken.UserID, apiToken.Name, apiToken.Token, apiToken.ExpiresAt, apiToken.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create API token: %w", err)
	}

	s.logger.Info("API token created",
		zap.String("user_id", userID.String()),
		zap.String("token_id", apiToken.ID.String()),
		zap.String("token_name", req.Name))

	return apiToken, nil
}

func (s *Service) GetUserTokens(ctx context.Context, userID uuid.UUID) ([]*models.APIToken, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, user_id, name, token, expires_at, last_used_at, created_at
		FROM api_tokens 
		WHERE user_id = $1 
		ORDER BY created_at DESC`,
		userID)

	if err != nil {
		return nil, fmt.Errorf("failed to get user tokens: %w", err)
	}
	defer rows.Close()

	var tokens []*models.APIToken
	for rows.Next() {
		var token models.APIToken
		err := rows.Scan(&token.ID, &token.UserID, &token.Name, &token.Token,
			&token.ExpiresAt, &token.LastUsedAt, &token.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan token: %w", err)
		}
		tokens = append(tokens, &token)
	}

	return tokens, nil
}

func (s *Service) RevokeToken(ctx context.Context, tokenID uuid.UUID, userID uuid.UUID) error {
	result, err := s.db.Pool.Exec(ctx, `
		DELETE FROM api_tokens 
		WHERE id = $1 AND user_id = $2`,
		tokenID, userID)

	if err != nil {
		return fmt.Errorf("failed to revoke token: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("token not found or access denied")
	}

	s.logger.Info("API token revoked",
		zap.String("user_id", userID.String()),
		zap.String("token_id", tokenID.String()))

	return nil
}

func (s *Service) ValidateAPIToken(ctx context.Context, tokenString string) (*models.User, error) {
	var token models.APIToken
	var user models.User

	err := s.db.Pool.QueryRow(ctx, `
		SELECT t.id, t.user_id, t.name, t.token, t.expires_at, t.last_used_at, t.created_at,
		       u.id, u.username, u.email, u.role, u.created_at, u.updated_at
		FROM api_tokens t
		JOIN users u ON t.user_id = u.id
		WHERE t.token = $1`,
		tokenString).Scan(
		&token.ID, &token.UserID, &token.Name, &token.Token,
		&token.ExpiresAt, &token.LastUsedAt, &token.CreatedAt,
		&user.ID, &user.Username, &user.Email, &user.Role, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("invalid token")
	}

	// Check if token is expired
	if token.IsExpired() {
		return nil, fmt.Errorf("token expired")
	}

	// Update last used timestamp
	_, err = s.db.Pool.Exec(ctx, `
		UPDATE api_tokens 
		SET last_used_at = $1 
		WHERE id = $2`,
		time.Now(), token.ID)

	if err != nil {
		s.logger.Warn("Failed to update token last used timestamp", zap.Error(err))
	}

	return &user, nil
}

func (s *Service) hashPassword(password string) (string, error) {
	// Generate random salt
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	// Hash password with Argon2id
	hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)

	// Combine salt and hash
	combined := make([]byte, 16+32)
	copy(combined[:16], salt)
	copy(combined[16:], hash)

	return hex.EncodeToString(combined), nil
}

func (s *Service) verifyPassword(password, hashedPassword string) bool {
	// Decode hex string
	combined, err := hex.DecodeString(hashedPassword)
	if err != nil {
		return false
	}

	if len(combined) != 48 { // 16 bytes salt + 32 bytes hash
		return false
	}

	// Extract salt and hash
	salt := combined[:16]
	hash := combined[16:]

	// Hash the provided password with the same salt
	passwordHash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)

	// Compare hashes
	return hex.EncodeToString(hash) == hex.EncodeToString(passwordHash)
}

