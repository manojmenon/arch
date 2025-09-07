import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:8081',
    timeout: parseInt(process.env.API_TIMEOUT) || 30000,
    retries: parseInt(process.env.API_RETRIES) || 3
  },

  // MCP Server Configuration
  mcp: {
    name: process.env.MCP_NAME || 'Veedu Project Management',
    version: process.env.MCP_VERSION || '1.0.0',
    description: process.env.MCP_DESCRIPTION || 'MCP servers for Veedu Project Management System'
  },

  // Authentication
  auth: {
    token: process.env.API_TOKEN || '',
    tokenHeader: process.env.TOKEN_HEADER || 'Authorization',
    tokenPrefix: process.env.TOKEN_PREFIX || 'Bearer '
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.SERVER_PORT) || 3001,
    host: process.env.SERVER_HOST || 'localhost'
  }
};

export default config;
