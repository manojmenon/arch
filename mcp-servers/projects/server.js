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

const logger = new Logger('Projects-MCP');

class ProjectsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'veedu-projects-mcp',
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
            name: 'list_projects',
            description: 'List all projects with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                },
                organization_id: {
                  type: 'string',
                  description: 'Filter by organization ID (optional)'
                },
                status: {
                  type: 'string',
                  enum: ['planning', 'active', 'completed', 'on-hold', 'cancelled'],
                  description: 'Filter by project status (optional)'
                },
                category_id: {
                  type: 'string',
                  description: 'Filter by category ID (optional)'
                },
                search: {
                  type: 'string',
                  description: 'Search term for project name or description (optional)'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of projects to return (default: 50)',
                  minimum: 1,
                  maximum: 100
                }
              },
              required: ['token']
            }
          },
          {
            name: 'get_project',
            description: 'Get detailed information about a specific project',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                },
                project_id: {
                  type: 'string',
                  description: 'Project ID'
                }
              },
              required: ['token', 'project_id']
            }
          },
          {
            name: 'create_project',
            description: 'Create a new project',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                },
                name: {
                  type: 'string',
                  description: 'Project name'
                },
                description: {
                  type: 'string',
                  description: 'Project description (optional)'
                },
                status: {
                  type: 'string',
                  enum: ['planning', 'active', 'completed', 'on-hold', 'cancelled'],
                  description: 'Project status (default: planning)'
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'urgent'],
                  description: 'Project priority (optional)'
                },
                budget: {
                  type: 'number',
                  description: 'Project budget (optional)'
                },
                start_date: {
                  type: 'string',
                  format: 'date',
                  description: 'Project start date (optional)'
                },
                end_date: {
                  type: 'string',
                  format: 'date',
                  description: 'Project end date (optional)'
                },
                owner_name: {
                  type: 'string',
                  description: 'Project owner name (optional)'
                },
                address: {
                  type: 'string',
                  description: 'Project address (optional)'
                },
                city: {
                  type: 'string',
                  description: 'Project city (optional)'
                },
                state: {
                  type: 'string',
                  description: 'Project state (optional)'
                },
                postal_code: {
                  type: 'string',
                  description: 'Project postal code (optional)'
                },
                organization_id: {
                  type: 'string',
                  description: 'Organization ID (optional)'
                },
                category_id: {
                  type: 'string',
                  description: 'Category ID (optional)'
                }
              },
              required: ['token', 'name']
            }
          },
          {
            name: 'update_project',
            description: 'Update an existing project',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                },
                project_id: {
                  type: 'string',
                  description: 'Project ID'
                },
                name: {
                  type: 'string',
                  description: 'Project name (optional)'
                },
                description: {
                  type: 'string',
                  description: 'Project description (optional)'
                },
                status: {
                  type: 'string',
                  enum: ['planning', 'active', 'completed', 'on-hold', 'cancelled'],
                  description: 'Project status (optional)'
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'urgent'],
                  description: 'Project priority (optional)'
                },
                budget: {
                  type: 'number',
                  description: 'Project budget (optional)'
                },
                start_date: {
                  type: 'string',
                  format: 'date',
                  description: 'Project start date (optional)'
                },
                end_date: {
                  type: 'string',
                  format: 'date',
                  description: 'Project end date (optional)'
                },
                owner_name: {
                  type: 'string',
                  description: 'Project owner name (optional)'
                },
                address: {
                  type: 'string',
                  description: 'Project address (optional)'
                },
                city: {
                  type: 'string',
                  description: 'Project city (optional)'
                },
                state: {
                  type: 'string',
                  description: 'Project state (optional)'
                },
                postal_code: {
                  type: 'string',
                  description: 'Project postal code (optional)'
                },
                organization_id: {
                  type: 'string',
                  description: 'Organization ID (optional)'
                },
                category_id: {
                  type: 'string',
                  description: 'Category ID (optional)'
                }
              },
              required: ['token', 'project_id']
            }
          },
          {
            name: 'delete_project',
            description: 'Delete a project',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                },
                project_id: {
                  type: 'string',
                  description: 'Project ID'
                }
              },
              required: ['token', 'project_id']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_projects':
            return await this.handleListProjects(args);
          case 'get_project':
            return await this.handleGetProject(args);
          case 'create_project':
            return await this.handleCreateProject(args);
          case 'update_project':
            return await this.handleUpdateProject(args);
          case 'delete_project':
            return await this.handleDeleteProject(args);
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

  async handleListProjects(args) {
    const { token, ...filters } = args;
    
    logger.info('Listing projects', { filters });
    
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const url = `/api/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.apiClient.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('Projects retrieved', { count: response.length });
    
    if (response.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No projects found matching the criteria.'
          }
        ]
      };
    }

    const projectsList = response.map(project => {
      const statusEmoji = {
        'planning': '📋',
        'active': '🚧',
        'completed': '✅',
        'on-hold': '⏸️',
        'cancelled': '❌'
      }[project.status] || '❓';

      return `${statusEmoji} ${project.name} (ID: ${project.id})\n` +
             `  Status: ${project.status}\n` +
             `  Organization: ${project.organization_name || 'Not assigned'}\n` +
             `  Category: ${project.category_name || 'Not categorized'}\n` +
             `  Budget: ${project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}\n` +
             `  Location: ${project.city && project.state ? `${project.city}, ${project.state}` : 'Not specified'}\n` +
             `  Created: ${new Date(project.created_at).toLocaleDateString()}`;
    }).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${response.length} project(s):\n\n${projectsList}`
        }
      ]
    };
  }

  async handleGetProject(args) {
    const { token, project_id } = args;
    
    logger.info('Getting project details', { project_id });
    
    const response = await this.apiClient.get(`/api/projects/${project_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('Project details retrieved', { project_id, name: response.name });
    
    const statusEmoji = {
      'planning': '📋',
      'active': '🚧',
      'completed': '✅',
      'on-hold': '⏸️',
      'cancelled': '❌'
    }[response.status] || '❓';

    const priorityEmoji = {
      'low': '🟢',
      'medium': '🟡',
      'high': '🟠',
      'urgent': '🔴'
    }[response.priority] || '';

    return {
      content: [
        {
          type: 'text',
          text: `Project Details:\n\n` +
                `${statusEmoji} **${response.name}**\n` +
                `ID: ${response.id}\n` +
                `Status: ${response.status}\n` +
                `${response.priority ? `Priority: ${priorityEmoji} ${response.priority}\n` : ''}` +
                `Description: ${response.description || 'No description'}\n\n` +
                `**Organization & Category:**\n` +
                `Organization: ${response.organization_name || 'Not assigned'}\n` +
                `Category: ${response.category_name || 'Not categorized'}\n\n` +
                `**Financial Information:**\n` +
                `Budget: ${response.budget ? `$${response.budget.toLocaleString()}` : 'Not set'}\n\n` +
                `**Timeline:**\n` +
                `Start Date: ${response.start_date ? new Date(response.start_date).toLocaleDateString() : 'Not set'}\n` +
                `End Date: ${response.end_date ? new Date(response.end_date).toLocaleDateString() : 'Not set'}\n\n` +
                `**Location:**\n` +
                `Owner: ${response.owner_name || 'Not specified'}\n` +
                `Address: ${response.address || 'Not specified'}\n` +
                `City: ${response.city || 'Not specified'}\n` +
                `State: ${response.state || 'Not specified'}\n` +
                `Postal Code: ${response.postal_code || 'Not specified'}\n\n` +
                `**Metadata:**\n` +
                `Created: ${new Date(response.created_at).toLocaleString()}\n` +
                `Updated: ${new Date(response.updated_at).toLocaleString()}`
        }
      ]
    };
  }

  async handleCreateProject(args) {
    const { token, ...projectData } = args;
    
    logger.info('Creating project', { name: projectData.name });
    
    const response = await this.apiClient.post('/api/projects', projectData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('Project created successfully', { projectId: response.id, name: response.name });
    
    return {
      content: [
        {
          type: 'text',
          text: `Project created successfully!\n\n` +
                `Name: ${response.name}\n` +
                `ID: ${response.id}\n` +
                `Status: ${response.status}\n` +
                `Organization: ${response.organization_name || 'Not assigned'}\n` +
                `Created: ${new Date(response.created_at).toLocaleString()}`
        }
      ]
    };
  }

  async handleUpdateProject(args) {
    const { token, project_id, ...updateData } = args;
    
    logger.info('Updating project', { project_id, updateData });
    
    const response = await this.apiClient.put(`/api/projects/${project_id}`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('Project updated successfully', { project_id, name: response.name });
    
    return {
      content: [
        {
          type: 'text',
          text: `Project updated successfully!\n\n` +
                `Name: ${response.name}\n` +
                `ID: ${response.id}\n` +
                `Status: ${response.status}\n` +
                `Updated: ${new Date(response.updated_at).toLocaleString()}`
        }
      ]
    };
  }

  async handleDeleteProject(args) {
    const { token, project_id } = args;
    
    logger.info('Deleting project', { project_id });
    
    await this.apiClient.delete(`/api/projects/${project_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('Project deleted successfully', { project_id });
    
    return {
      content: [
        {
          type: 'text',
          text: `Project ${project_id} has been deleted successfully.`
        }
      ]
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      logger.error('MCP Server error', { error: error.message, stack: error.stack });
    };

    process.on('SIGINT', async () => {
      logger.info('Shutting down Projects MCP Server...');
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Projects MCP Server started successfully');
  }
}

// Start the server
const server = new ProjectsMCPServer();
server.run().catch((error) => {
  logger.error('Failed to start Projects MCP Server', { error: error.message });
  process.exit(1);
});
