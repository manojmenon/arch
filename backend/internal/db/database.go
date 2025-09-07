package db

import (
	"context"
	"fmt"
	"time"

	"project-management-backend/internal/config"

	"github.com/jackc/pgxpool/v5"
	"go.uber.org/zap"
)

type Database struct {
	Pool   *pgxpool.Pool
	logger *zap.Logger
}

func NewDatabase(cfg *config.Config, logger *zap.Logger) (*Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, cfg.GetDatabaseURL())
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Configure pool settings
	pool.Config().MaxConns = cfg.Database.MaxConns
	pool.Config().MinConns = cfg.Database.MinConns
	pool.Config().MaxConnLifetime = time.Hour
	pool.Config().MaxConnIdleTime = time.Minute * 30

	// Test the connection
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info("Database connection established",
		zap.String("host", cfg.Database.Host),
		zap.String("port", cfg.Database.Port),
		zap.String("database", cfg.Database.DBName),
	)

	return &Database{
		Pool:   pool,
		logger: logger,
	}, nil
}

func (db *Database) Close() {
	db.Pool.Close()
	db.logger.Info("Database connection closed")
}

func (db *Database) Health(ctx context.Context) error {
	return db.Pool.Ping(ctx)
}

