package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"project-management-backend/internal/config"
	"project-management-backend/internal/mcp"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
	"go.uber.org/zap"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize logger
	logger, err := zap.NewProduction()
	if cfg.Server.Environment == "development" {
		logger, err = zap.NewDevelopment()
	}
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	// Initialize OpenTelemetry
	if cfg.OTEL.Enabled {
		if err := initTracing(cfg, logger); err != nil {
			logger.Warn("Failed to initialize tracing", zap.Error(err))
		}
	}

	// Create MCP server
	server, err := mcp.NewServer(cfg, logger)
	if err != nil {
		logger.Fatal("Failed to create MCP server", zap.Error(err))
	}

	// Start server in goroutine
	go func() {
		if err := server.Start(); err != nil {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Stop(ctx); err != nil {
		logger.Error("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exited")
}

func initTracing(cfg *config.Config, logger *zap.Logger) error {
	// Create resource
	res, err := resource.New(context.Background(),
		resource.WithAttributes(
			semconv.ServiceName("mcp-server"),
			semconv.ServiceVersion("1.0.0"),
		),
	)
	if err != nil {
		return err
	}

	// Create OTLP exporter
	exporter, err := otlptracehttp.New(context.Background(),
		otlptracehttp.WithEndpoint(cfg.OTEL.Endpoint),
		otlptracehttp.WithInsecure(),
	)
	if err != nil {
		return err
	}

	// Create trace provider
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)

	otel.SetTracerProvider(tp)

	logger.Info("OpenTelemetry tracing initialized", zap.String("endpoint", cfg.OTEL.Endpoint))
	return nil
}

