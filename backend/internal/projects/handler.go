package projects

import (
	"net/http"
	"strconv"

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

// @Summary Create a new project
// @Description Create a new residential project
// @Tags projects
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CreateProjectRequest true "Project data"
// @Success 201 {object} models.Project
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /projects [post]
func (h *Handler) CreateProject(c *gin.Context) {
	var req models.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid project creation request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	project, err := h.service.CreateProject(c.Request.Context(), &req)
	if err != nil {
		h.logger.Error("Failed to create project", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
		return
	}

	c.JSON(http.StatusCreated, project)
}

// @Summary Get a project
// @Description Get project details by ID
// @Tags projects
// @Produce json
// @Security BearerAuth
// @Param id path string true "Project ID"
// @Success 200 {object} models.Project
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /projects/{id} [get]
func (h *Handler) GetProject(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	project, err := h.service.GetProject(c.Request.Context(), id)
	if err != nil {
		h.logger.Error("Failed to get project", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	c.JSON(http.StatusOK, project)
}

// @Summary List projects
// @Description Get a list of all projects with pagination
// @Tags projects
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Number of projects to return" default(50)
// @Param offset query int false "Number of projects to skip" default(0)
// @Success 200 {array} models.Project
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /projects [get]
func (h *Handler) ListProjects(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 100 {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	projects, err := h.service.ListProjects(c.Request.Context(), limit, offset)
	if err != nil {
		h.logger.Error("Failed to list projects", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get projects"})
		return
	}

	c.JSON(http.StatusOK, projects)
}

// @Summary Update a project
// @Description Update project details
// @Tags projects
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Project ID"
// @Param request body models.UpdateProjectRequest true "Project update data"
// @Success 200 {object} models.Project
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /projects/{id} [put]
func (h *Handler) UpdateProject(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req models.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid project update request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	project, err := h.service.UpdateProject(c.Request.Context(), id, &req)
	if err != nil {
		h.logger.Error("Failed to update project", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	c.JSON(http.StatusOK, project)
}

// @Summary Delete a project
// @Description Delete a project by ID
// @Tags projects
// @Produce json
// @Security BearerAuth
// @Param id path string true "Project ID"
// @Success 204
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /projects/{id} [delete]
func (h *Handler) DeleteProject(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	err = h.service.DeleteProject(c.Request.Context(), id)
	if err != nil {
		h.logger.Error("Failed to delete project", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	c.Status(http.StatusNoContent)
}

// @Summary Get project statistics
// @Description Get project count and statistics
// @Tags projects
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Router /projects/stats [get]
func (h *Handler) GetProjectStats(c *gin.Context) {
	count, err := h.service.GetProjectCount(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get project count", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get statistics"})
		return
	}

	stats := map[string]interface{}{
		"total_projects": count,
	}

	c.JSON(http.StatusOK, stats)
}

