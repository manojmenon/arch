package middleware

import (
	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

func LoggingMiddleware(logger *zap.Logger) gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		// Get trace context if available
		span := trace.SpanFromContext(param.Request.Context())
		traceID := ""
		if span.SpanContext().IsValid() {
			traceID = span.SpanContext().TraceID().String()
		}

		logger.Info("HTTP Request",
			zap.String("method", param.Method),
			zap.String("path", param.Path),
			zap.Int("status", param.StatusCode),
			zap.Duration("latency", param.Latency),
			zap.String("client_ip", param.ClientIP),
			zap.String("user_agent", param.Request.UserAgent()),
			zap.String("trace_id", traceID),
		)

		return ""
	})
}

func RecoveryMiddleware(logger *zap.Logger) gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		span := trace.SpanFromContext(c.Request.Context())
		traceID := ""
		if span.SpanContext().IsValid() {
			traceID = span.SpanContext().TraceID().String()
		}

		logger.Error("Panic recovered",
			zap.Any("error", recovered),
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.String("trace_id", traceID),
		)

		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
	})
}

