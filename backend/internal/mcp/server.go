package mcp

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"project-management-backend/internal/auth"
	"project-management-backend/internal/config"
	"project-management-backend/internal/db"
	"project-management-backend/internal/middleware"
	"project-management-backend/internal/projects"

	"github.com/gin-gonic/gin"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.uber.org/zap"
)

type Server struct {
	config      *config.Config
	logger      *zap.Logger
	database    *db.Database
	authSvc     *auth.Service
	projectsSvc *projects.Service
	router      *gin.Engine
	server      *http.Server
}

func NewServer(cfg *config.Config, logger *zap.Logger) (*Server, error) {
	// Initialize database
	database, err := db.NewDatabase(cfg, logger)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize database: %w", err)
	}

	// Initialize services
	authSvc := auth.NewService(database, cfg, logger)
	projectsSvc := projects.NewService(database, logger)

	// Initialize router
	router := gin.New()

	// Add middleware
	router.Use(otelgin.Middleware("mcp-server"))
	router.Use(middleware.LoggingMiddleware(logger))
	router.Use(middleware.RecoveryMiddleware(logger))
	router.Use(corsMiddleware())

	// Initialize server
	srv := &Server{
		config:      cfg,
		logger:      logger,
		database:    database,
		authSvc:     authSvc,
		projectsSvc: projectsSvc,
		router:      router,
	}

	// Setup routes
	srv.setupRoutes()

	return srv, nil
}

func (s *Server) setupRoutes() {
	// Health check
	s.router.GET("/health", s.healthCheck)

	// API routes
	api := s.router.Group("/api")
	{
		// Auth routes (no auth required)
		authGroup := api.Group("/auth")
		{
			authHandler := auth.NewHandler(s.authSvc, s.logger)
			authGroup.POST("/signup", authHandler.Signup)
			authGroup.POST("/login", authHandler.Login)
		}

		// Protected routes
		authMiddleware := middleware.NewAuthMiddleware(s.config.Auth.JWTSecret, s.logger)
		protected := api.Group("/")
		protected.Use(authMiddleware.RequireAuth())
		{
			// Auth protected routes
			authGroup := protected.Group("/auth")
			{
				authHandler := auth.NewHandler(s.authSvc, s.logger)
				authGroup.GET("/me", authHandler.GetCurrentUser)
				authGroup.POST("/logout", authHandler.Logout)
				authGroup.POST("/tokens", authHandler.CreateToken)
				authGroup.GET("/tokens", authHandler.GetTokens)
				authGroup.DELETE("/tokens/:id", authHandler.RevokeToken)
			}

			// Projects routes
			projectsGroup := protected.Group("/projects")
			{
				projectsHandler := projects.NewHandler(s.projectsSvc, s.logger)

				// Public project routes (all authenticated users)
				projectsGroup.GET("", projectsHandler.ListProjects)
				projectsGroup.GET("/stats", projectsHandler.GetProjectStats)
				projectsGroup.GET("/:id", projectsHandler.GetProject)

				// Admin-only project routes
				adminProjects := projectsGroup.Group("")
				adminProjects.Use(authMiddleware.RequireRole("localadmin"))
				{
					adminProjects.POST("", projectsHandler.CreateProject)
					adminProjects.PUT("/:id", projectsHandler.UpdateProject)
					adminProjects.DELETE("/:id", projectsHandler.DeleteProject)
				}
			}
		}
	}

	// Swagger documentation
	s.router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
}

func (s *Server) healthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	// Check database health
	if err := s.database.Health(ctx); err != nil {
		s.logger.Error("Database health check failed", zap.Error(err))
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"error":  "database connection failed",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"version":   "1.0.0",
	})
}

func (s *Server) Start() error {
	s.server = &http.Server{
		Addr:         fmt.Sprintf("%s:%s", s.config.Server.Host, s.config.Server.Port),
		Handler:      s.router,
		ReadTimeout:  s.config.Server.ReadTimeout,
		WriteTimeout: s.config.Server.WriteTimeout,
	}

	s.logger.Info("Starting MCP server",
		zap.String("host", s.config.Server.Host),
		zap.String("port", s.config.Server.Port),
	)

	return s.server.ListenAndServe()
}

func (s *Server) Stop(ctx context.Context) error {
	s.logger.Info("Stopping MCP server")

	if s.server != nil {
		if err := s.server.Shutdown(ctx); err != nil {
			return fmt.Errorf("failed to shutdown server: %w", err)
		}
	}

	if s.database != nil {
		s.database.Close()
	}

	return nil
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

