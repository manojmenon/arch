package projects

import (
	"context"
	"fmt"

	"project-management-backend/internal/db"
	"project-management-backend/internal/models"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

type Service struct {
	db     *db.Database
	logger *zap.Logger
}

func NewService(database *db.Database, logger *zap.Logger) *Service {
	return &Service{
		db:     database,
		logger: logger,
	}
}

func (s *Service) CreateProject(ctx context.Context, req *models.CreateProjectRequest) (*models.Project, error) {
	project := &models.Project{
		ID:         uuid.New(),
		Name:       req.Name,
		Address:    req.Address,
		City:       req.City,
		State:      req.State,
		PostalCode: req.PostalCode,
		OwnerName:  req.OwnerName,
		Status:     req.Status,
		Budget:     req.Budget,
		StartDate:  req.StartDate,
		EndDate:    req.EndDate,
		Metadata:   models.JSONB(req.Metadata),
		Documents:  models.JSONB(req.Documents),
	}

	_, err := s.db.Pool.Exec(ctx, `
		INSERT INTO projects (
			id, name, address, city, state, postal_code, owner_name, status, 
			budget, start_date, end_date, metadata, documents, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		)`,
		project.ID, project.Name, project.Address, project.City, project.State,
		project.PostalCode, project.OwnerName, project.Status, project.Budget,
		project.StartDate, project.EndDate, project.Metadata, project.Documents,
		project.CreatedAt, project.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create project: %w", err)
	}

	s.logger.Info("Project created", zap.String("project_id", project.ID.String()), zap.String("name", project.Name))
	return project, nil
}

func (s *Service) GetProject(ctx context.Context, id uuid.UUID) (*models.Project, error) {
	var project models.Project
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, name, address, city, state, postal_code, owner_name, status,
		       budget, start_date, end_date, metadata, documents, created_at, updated_at
		FROM projects WHERE id = $1`,
		id).Scan(
		&project.ID, &project.Name, &project.Address, &project.City, &project.State,
		&project.PostalCode, &project.OwnerName, &project.Status, &project.Budget,
		&project.StartDate, &project.EndDate, &project.Metadata, &project.Documents,
		&project.CreatedAt, &project.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("project not found: %w", err)
	}

	return &project, nil
}

func (s *Service) ListProjects(ctx context.Context, limit, offset int) ([]*models.Project, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, name, address, city, state, postal_code, owner_name, status,
		       budget, start_date, end_date, metadata, documents, created_at, updated_at
		FROM projects 
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2`,
		limit, offset)

	if err != nil {
		return nil, fmt.Errorf("failed to list projects: %w", err)
	}
	defer rows.Close()

	var projects []*models.Project
	for rows.Next() {
		var project models.Project
		err := rows.Scan(
			&project.ID, &project.Name, &project.Address, &project.City, &project.State,
			&project.PostalCode, &project.OwnerName, &project.Status, &project.Budget,
			&project.StartDate, &project.EndDate, &project.Metadata, &project.Documents,
			&project.CreatedAt, &project.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan project: %w", err)
		}
		projects = append(projects, &project)
	}

	return projects, nil
}

func (s *Service) UpdateProject(ctx context.Context, id uuid.UUID, req *models.UpdateProjectRequest) (*models.Project, error) {
	// Get existing project
	project, err := s.GetProject(ctx, id)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.Name != nil {
		project.Name = *req.Name
	}
	if req.Address != nil {
		project.Address = req.Address
	}
	if req.City != nil {
		project.City = req.City
	}
	if req.State != nil {
		project.State = req.State
	}
	if req.PostalCode != nil {
		project.PostalCode = req.PostalCode
	}
	if req.OwnerName != nil {
		project.OwnerName = req.OwnerName
	}
	if req.Status != nil {
		project.Status = req.Status
	}
	if req.Budget != nil {
		project.Budget = req.Budget
	}
	if req.StartDate != nil {
		project.StartDate = req.StartDate
	}
	if req.EndDate != nil {
		project.EndDate = req.EndDate
	}
	if req.Metadata != nil {
		project.Metadata = models.JSONB(req.Metadata)
	}
	if req.Documents != nil {
		project.Documents = models.JSONB(req.Documents)
	}

	project.UpdatedAt = project.UpdatedAt

	_, err = s.db.Pool.Exec(ctx, `
		UPDATE projects SET 
			name = $2, address = $3, city = $4, state = $5, postal_code = $6,
			owner_name = $7, status = $8, budget = $9, start_date = $10,
			end_date = $11, metadata = $12, documents = $13, updated_at = $14
		WHERE id = $1`,
		project.ID, project.Name, project.Address, project.City, project.State,
		project.PostalCode, project.OwnerName, project.Status, project.Budget,
		project.StartDate, project.EndDate, project.Metadata, project.Documents,
		project.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to update project: %w", err)
	}

	s.logger.Info("Project updated", zap.String("project_id", project.ID.String()), zap.String("name", project.Name))
	return project, nil
}

func (s *Service) DeleteProject(ctx context.Context, id uuid.UUID) error {
	result, err := s.db.Pool.Exec(ctx, "DELETE FROM projects WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete project: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("project not found")
	}

	s.logger.Info("Project deleted", zap.String("project_id", id.String()))
	return nil
}

func (s *Service) GetProjectCount(ctx context.Context) (int64, error) {
	var count int64
	err := s.db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM projects").Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get project count: %w", err)
	}
	return count, nil
}

