package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Auth     AuthConfig
	OTEL     OTELConfig
	RBAC     RBACConfig
	Logging  LoggingConfig
	Security SecurityConfig
	Metrics  MetricsConfig
}

type ServerConfig struct {
	Port         string
	Host         string
	Environment  string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
	MaxConns int32
	MinConns int32
}

type AuthConfig struct {
	JWTSecret       string
	SessionDuration time.Duration
	TokenDuration   time.Duration
	RefreshDuration time.Duration
}

type OTELConfig struct {
	Endpoint string
	Enabled  bool
}

type RBACConfig struct {
	ModelPath  string
	PolicyPath string
}

type LoggingConfig struct {
	Level  string
	Format string
	Output string
}

type SecurityConfig struct {
	CORSAllowedOrigins string
	CORSAllowedMethods string
	CORSAllowedHeaders string
	RateLimitEnabled   bool
	RateLimitRequests  int
	RateLimitBurst     int
}

type MetricsConfig struct {
	Enabled bool
	Port    string
	Path    string
}

func Load() (*Config, error) {
	// Load environment file based on environment
	env := getEnv("ENVIRONMENT", "development")
	envFile := fmt.Sprintf("env.%s", env)
	
	// Try to load environment-specific file first
	if err := godotenv.Load(envFile); err != nil {
		// Fallback to .env file
		if err := godotenv.Load(); err != nil {
			// .env file is optional
		}
	}

	config := &Config{
		Server: ServerConfig{
			Port:         getEnv("SERVER_PORT", "8080"),
			Host:         getEnv("SERVER_HOST", "0.0.0.0"),
			Environment:  getEnv("ENVIRONMENT", "development"),
			ReadTimeout:  getDurationEnv("SERVER_READ_TIMEOUT", 30*time.Second),
			WriteTimeout: getDurationEnv("SERVER_WRITE_TIMEOUT", 30*time.Second),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "password"),
			DBName:   getEnv("DB_NAME", "project_management"),
			SSLMode:  getEnv("DB_SSL_MODE", "disable"),
			MaxConns: getInt32Env("DB_MAX_CONNS", 25),
			MinConns: getInt32Env("DB_MIN_CONNS", 5),
		},
		Auth: AuthConfig{
			JWTSecret:       getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
			SessionDuration: getDurationEnv("SESSION_DURATION", 24*time.Hour),
			TokenDuration:   getDurationEnv("TOKEN_DURATION", 4*time.Hour),
			RefreshDuration: getDurationEnv("REFRESH_DURATION", 7*24*time.Hour),
		},
		OTEL: OTELConfig{
			Endpoint: getEnv("OTEL_ENDPOINT", "http://localhost:4318/v1/traces"),
			Enabled:  getBoolEnv("OTEL_ENABLED", true),
		},
		RBAC: RBACConfig{
			ModelPath:  getEnv("RBAC_MODEL_PATH", "./rbac_model.conf"),
			PolicyPath: getEnv("RBAC_POLICY_PATH", "./rbac_policy.csv"),
		},
		Logging: LoggingConfig{
			Level:  getEnv("LOG_LEVEL", "info"),
			Format: getEnv("LOG_FORMAT", "json"),
			Output: getEnv("LOG_OUTPUT", "stdout"),
		},
		Security: SecurityConfig{
			CORSAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "*"),
			CORSAllowedMethods: getEnv("CORS_ALLOWED_METHODS", "GET,POST,PUT,DELETE,OPTIONS"),
			CORSAllowedHeaders: getEnv("CORS_ALLOWED_HEADERS", "Origin,Content-Type,Accept,Authorization"),
			RateLimitEnabled:   getBoolEnv("RATE_LIMIT_ENABLED", true),
			RateLimitRequests:  getIntEnv("RATE_LIMIT_REQUESTS_PER_MINUTE", 100),
			RateLimitBurst:     getIntEnv("RATE_LIMIT_BURST", 10),
		},
		Metrics: MetricsConfig{
			Enabled: getBoolEnv("METRICS_ENABLED", true),
			Port:    getEnv("METRICS_PORT", "9090"),
			Path:    getEnv("METRICS_PATH", "/metrics"),
		},
	}

	return config, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getInt32Env(key string, defaultValue int32) int32 {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.ParseInt(value, 10, 32); err == nil {
			return int32(intValue)
		}
	}
	return defaultValue
}

func getBoolEnv(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func (c *Config) GetDatabaseURL() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		c.Database.User,
		c.Database.Password,
		c.Database.Host,
		c.Database.Port,
		c.Database.DBName,
		c.Database.SSLMode,
	)
}
