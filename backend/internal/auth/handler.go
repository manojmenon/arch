package auth

import (
	"net/http"

	"project-management-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type Handler struct {
	service *Service
	logger  *zap.Logger
}

func NewHandler(service *Service, logger *zap.Logger) *Handler {
	return &Handler{
		service: service,
		logger:  logger,
	}
}

// @Summary Sign up a new user
// @Description Create a new user account
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.CreateUserRequest true "User registration data"
// @Success 201 {object} models.AuthResponse
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Router /auth/signup [post]
func (h *Handler) Signup(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid signup request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	user, err := h.service.CreateUser(c.Request.Context(), &req)
	if err != nil {
		h.logger.Error("Failed to create user", zap.Error(err))
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	// Generate session token
	token, expiresAt, err := h.service.GenerateSessionToken(user)
	if err != nil {
		h.logger.Error("Failed to generate session token", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	response := &models.AuthResponse{
		User:         user,
		SessionToken: token,
		ExpiresAt:    expiresAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	c.JSON(http.StatusCreated, response)
}

// @Summary Sign in a user
// @Description Authenticate user and return session token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Login credentials"
// @Success 200 {object} models.AuthResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid login request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	user, err := h.service.AuthenticateUser(c.Request.Context(), &req)
	if err != nil {
		h.logger.Warn("Authentication failed", zap.String("username", req.Username), zap.Error(err))
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate session token
	token, expiresAt, err := h.service.GenerateSessionToken(user)
	if err != nil {
		h.logger.Error("Failed to generate session token", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	response := &models.AuthResponse{
		User:         user,
		SessionToken: token,
		ExpiresAt:    expiresAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Get current user
// @Description Get the current authenticated user's information
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.User
// @Failure 401 {object} map[string]string
// @Router /auth/me [get]
func (h *Handler) GetCurrentUser(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userModel, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	c.JSON(http.StatusOK, userModel)
}

// @Summary Create API token
// @Description Create a new API token for the authenticated user
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CreateTokenRequest true "Token creation data"
// @Success 201 {object} models.TokenResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /auth/tokens [post]
func (h *Handler) CreateToken(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userModel, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	var req models.CreateTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid token creation request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Set default expiration if not provided
	if req.ExpiresInHours == 0 {
		req.ExpiresInHours = 4
	}

	apiToken, err := h.service.CreateAPIToken(c.Request.Context(), userModel.ID, &req)
	if err != nil {
		h.logger.Error("Failed to create API token", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create token"})
		return
	}

	response := &models.TokenResponse{
		ID:        apiToken.ID,
		Name:      apiToken.Name,
		Token:     apiToken.Token,
		ExpiresAt: apiToken.ExpiresAt,
		CreatedAt: apiToken.CreatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// @Summary Get user's API tokens
// @Description Get all API tokens for the authenticated user
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.TokenResponse
// @Failure 401 {object} map[string]string
// @Router /auth/tokens [get]
func (h *Handler) GetTokens(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userModel, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	tokens, err := h.service.GetUserTokens(c.Request.Context(), userModel.ID)
	if err != nil {
		h.logger.Error("Failed to get user tokens", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tokens"})
		return
	}

	var response []models.TokenResponse
	for _, token := range tokens {
		response = append(response, models.TokenResponse{
			ID:         token.ID,
			Name:       token.Name,
			Token:      token.Token,
			ExpiresAt:  token.ExpiresAt,
			LastUsedAt: token.LastUsedAt,
			CreatedAt:  token.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Revoke API token
// @Description Revoke a specific API token
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Param id path string true "Token ID"
// @Success 204
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /auth/tokens/{id} [delete]
func (h *Handler) RevokeToken(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userModel, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	tokenIDStr := c.Param("id")
	tokenID, err := uuid.Parse(tokenIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token ID"})
		return
	}

	err = h.service.RevokeToken(c.Request.Context(), tokenID, userModel.ID)
	if err != nil {
		h.logger.Error("Failed to revoke token", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// @Summary Logout
// @Description Logout the current user (client should discard token)
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]string
// @Router /auth/logout [post]
func (h *Handler) Logout(c *gin.Context) {
	// In a stateless JWT system, logout is handled client-side
	// The client should discard the token
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

