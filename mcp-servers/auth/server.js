#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import ApiClient from '../shared/api-client.js';
import Logger from '../shared/logger.js';
import { config } from '../shared/config.js';

const logger = new Logger('Auth-MCP');

class AuthMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'veedu-auth-mcp',
        version: config.mcp.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiClient = new ApiClient();
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'login',
            description: 'Authenticate user with email and password',
            inputSchema: {
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'User email address'
                },
                password: {
                  type: 'string',
                  description: 'User password'
                }
              },
              required: ['email', 'password']
            }
          },
          {
            name: 'signup',
            description: 'Register a new user account',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'Username (3-50 characters)'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'User email address'
                },
                password: {
                  type: 'string',
                  description: 'User password'
                }
              },
              required: ['username', 'email', 'password']
            }
          },
          {
            name: 'logout',
            description: 'Logout current user and invalidate session',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                }
              },
              required: ['token']
            }
          },
          {
            name: 'create_api_token',
            description: 'Create a new API token for the authenticated user',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                },
                name: {
                  type: 'string',
                  description: 'Token name for identification'
                },
                expires_in_hours: {
                  type: 'number',
                  description: 'Token expiration in hours (1-8760)',
                  minimum: 1,
                  maximum: 8760
                }
              },
              required: ['token', 'name', 'expires_in_hours']
            }
          },
          {
            name: 'list_api_tokens',
            description: 'List all API tokens for the authenticated user',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                }
              },
              required: ['token']
            }
          },
          {
            name: 'revoke_api_token',
            description: 'Revoke an API token',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                },
                token_id: {
                  type: 'string',
                  description: 'ID of the token to revoke'
                }
              },
              required: ['token', 'token_id']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'login':
            return await this.handleLogin(args);
          case 'signup':
            return await this.handleSignup(args);
          case 'logout':
            return await this.handleLogout(args);
          case 'create_api_token':
            return await this.handleCreateApiToken(args);
          case 'list_api_tokens':
            return await this.handleListApiTokens(args);
          case 'revoke_api_token':
            return await this.handleRevokeApiToken(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Tool ${name} failed`, { error: error.message, args });
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async handleLogin(args) {
    const { email, password } = args;
    
    logger.info('User login attempt', { email });
    
    const response = await this.apiClient.post('/api/auth/login', {
      email,
      password
    });

    logger.info('User login successful', { email, userId: response.user?.id });
    
    return {
      content: [
        {
          type: 'text',
          text: `Login successful! Welcome ${response.user?.username || email}.\n\n` +
                `User ID: ${response.user?.id}\n` +
                `System Role: ${response.user?.system_role}\n` +
                `Token: ${response.token}\n\n` +
                `Use this token for authenticated API calls.`
        }
      ]
    };
  }

  async handleSignup(args) {
    const { username, email, password } = args;
    
    logger.info('User signup attempt', { username, email });
    
    const response = await this.apiClient.post('/api/auth/signup', {
      username,
      email,
      password
    });

    logger.info('User signup successful', { username, email, userId: response.user?.id });
    
    return {
      content: [
        {
          type: 'text',
          text: `Account created successfully! Welcome ${username}.\n\n` +
                `User ID: ${response.user?.id}\n` +
                `Email: ${response.user?.email}\n` +
                `System Role: ${response.user?.system_role}\n` +
                `Token: ${response.token}\n\n` +
                `You can now use this token for authenticated API calls.`
        }
      ]
    };
  }

  async handleLogout(args) {
    const { token } = args;
    
    logger.info('User logout attempt');
    
    await this.apiClient.post('/api/auth/logout', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('User logout successful');
    
    return {
      content: [
        {
          type: 'text',
          text: 'Logout successful! Your session has been invalidated.'
        }
      ]
    };
  }

  async handleCreateApiToken(args) {
    const { token, name, expires_in_hours } = args;
    
    logger.info('API token creation attempt', { name, expires_in_hours });
    
    const response = await this.apiClient.post('/api/auth/tokens', {
      name,
      expires_in_hours
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('API token created successfully', { name, tokenId: response.id });
    
    return {
      content: [
        {
          type: 'text',
          text: `API token created successfully!\n\n` +
                `Token Name: ${response.name}\n` +
                `Token ID: ${response.id}\n` +
                `Expires: ${new Date(response.expires_at).toLocaleString()}\n` +
                `Token: ${response.token}\n\n` +
                `⚠️  IMPORTANT: Save this token securely. It will not be shown again!`
        }
      ]
    };
  }

  async handleListApiTokens(args) {
    const { token } = args;
    
    logger.info('API tokens list request');
    
    const response = await this.apiClient.get('/api/auth/tokens', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('API tokens retrieved', { count: response.length });
    
    if (response.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No API tokens found. Create one using the create_api_token tool.'
          }
        ]
      };
    }

    const tokensList = response.map(t => 
      `• ${t.name} (ID: ${t.id})\n` +
      `  Created: ${new Date(t.created_at).toLocaleString()}\n` +
      `  Expires: ${new Date(t.expires_at).toLocaleString()}\n` +
      `  Last Used: ${t.last_used_at ? new Date(t.last_used_at).toLocaleString() : 'Never'}\n` +
      `  Status: ${new Date(t.expires_at) > new Date() ? 'Active' : 'Expired'}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${response.length} API token(s):\n\n${tokensList}`
        }
      ]
    };
  }

  async handleRevokeApiToken(args) {
    const { token, token_id } = args;
    
    logger.info('API token revocation attempt', { token_id });
    
    await this.apiClient.delete(`/api/auth/tokens/${token_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('API token revoked successfully', { token_id });
    
    return {
      content: [
        {
          type: 'text',
          text: `API token ${token_id} has been revoked successfully. Any applications using this token will no longer have access.`
        }
      ]
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      logger.error('MCP Server error', { error: error.message, stack: error.stack });
    };

    process.on('SIGINT', async () => {
      logger.info('Shutting down Auth MCP Server...');
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Auth MCP Server started successfully');
  }
}

// Start the server
const server = new AuthMCPServer();
server.run().catch((error) => {
  logger.error('Failed to start Auth MCP Server', { error: error.message });
  process.exit(1);
});
