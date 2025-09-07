module project-management-backend

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/golang-jwt/jwt/v5 v5.2.0
	github.com/google/uuid v1.5.0
	github.com/jackc/pgx/v5 v5.5.1
	github.com/jackc/pgxpool/v5 v5.1.1
	github.com/casbin/casbin/v2 v2.82.0
	go.uber.org/zap v1.26.0
	go.opentelemetry.io/otel v1.21.0
	go.opentelemetry.io/otel/trace v1.21.0
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp v1.21.0
	go.opentelemetry.io/otel/sdk v1.21.0
	go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin v0.46.1
	golang.org/x/crypto v0.17.0
	github.com/swaggo/gin-swagger v1.6.0
	github.com/swaggo/files v1.0.1
	github.com/swaggo/swag v1.16.2
	github.com/go-playground/validator/v10 v10.16.0
	github.com/joho/godotenv v1.5.1
)