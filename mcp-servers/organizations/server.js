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

const logger = new Logger('Organizations-MCP');

class OrganizationsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'veedu-organizations-mcp',
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
            name: 'list_organizations',
            description: 'List all organizations accessible to the user',
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
            name: 'get_organization',
            description: 'Get detailed information about a specific organization',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                },
                organization_id: {
                  type: 'string',
                  description: 'Organization ID'
                }
              },
              required: ['token', 'organization_id']
            }
          },
          {
            name: 'get_user_organizations',
            description: 'Get organizations that the user belongs to with their roles',
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
            name: 'list_organization_members',
            description: 'List all members of a specific organization',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                },
                organization_id: {
                  type: 'string',
                  description: 'Organization ID'
                }
              },
              required: ['token', 'organization_id']
            }
          },
          {
            name: 'invite_user_to_organization',
            description: 'Invite a user to join an organization',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                },
                organization_id: {
                  type: 'string',
                  description: 'Organization ID'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'Email address of user to invite'
                },
                role: {
                  type: 'string',
                  enum: ['admin', 'manager', 'viewer', 'member'],
                  description: 'Role to assign to the invited user'
                }
              },
              required: ['token', 'organization_id', 'email', 'role']
            }
          },
          {
            name: 'update_member_role',
            description: 'Update the role of a member in an organization',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                },
                organization_id: {
                  type: 'string',
                  description: 'Organization ID'
                },
                user_id: {
                  type: 'string',
                  description: 'User ID of the member'
                },
                role: {
                  type: 'string',
                  enum: ['owner', 'admin', 'manager', 'viewer', 'member'],
                  description: 'New role for the member'
                }
              },
              required: ['token', 'organization_id', 'user_id', 'role']
            }
          },
          {
            name: 'remove_member_from_organization',
            description: 'Remove a member from an organization',
            inputSchema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'Authentication token'
                },
                organization_id: {
                  type: 'string',
                  description: 'Organization ID'
                },
                user_id: {
                  type: 'string',
                  description: 'User ID of the member to remove'
                }
              },
              required: ['token', 'organization_id', 'user_id']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_organizations':
            return await this.handleListOrganizations(args);
          case 'get_organization':
            return await this.handleGetOrganization(args);
          case 'get_user_organizations':
            return await this.handleGetUserOrganizations(args);
          case 'list_organization_members':
            return await this.handleListOrganizationMembers(args);
          case 'invite_user_to_organization':
            return await this.handleInviteUser(args);
          case 'update_member_role':
            return await this.handleUpdateMemberRole(args);
          case 'remove_member_from_organization':
            return await this.handleRemoveMember(args);
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

  async handleListOrganizations(args) {
    const { token } = args;
    
    logger.info('Listing organizations');
    
    const response = await this.apiClient.get('/api/organizations', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('Organizations retrieved', { count: response.length });
    
    if (response.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No organizations found.'
          }
        ]
      };
    }

    const organizationsList = response.map(org => 
      `• ${org.name} (ID: ${org.id})\n` +
      `  Description: ${org.description || 'No description'}\n` +
      `  Created: ${new Date(org.created_at).toLocaleString()}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${response.length} organization(s):\n\n${organizationsList}`
        }
      ]
    };
  }

  async handleGetOrganization(args) {
    const { token, organization_id } = args;
    
    logger.info('Getting organization details', { organization_id });
    
    const response = await this.apiClient.get(`/api/organizations/${organization_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('Organization details retrieved', { organization_id, name: response.name });
    
    return {
      content: [
        {
          type: 'text',
          text: `Organization Details:\n\n` +
                `Name: ${response.name}\n` +
                `ID: ${response.id}\n` +
                `Description: ${response.description || 'No description'}\n` +
                `Created: ${new Date(response.created_at).toLocaleString()}\n` +
                `Updated: ${new Date(response.updated_at).toLocaleString()}`
        }
      ]
    };
  }

  async handleGetUserOrganizations(args) {
    const { token } = args;
    
    logger.info('Getting user organizations');
    
    const response = await this.apiClient.get('/api/user/organizations', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('User organizations retrieved', { count: response.length });
    
    if (response.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'You are not a member of any organizations.'
          }
        ]
      };
    }

    const organizationsList = response.map(org => 
      `• ${org.name} (ID: ${org.id})\n` +
      `  Your Role: ${org.role}\n` +
      `  Description: ${org.description || 'No description'}\n` +
      `  Joined: ${new Date(org.joined_at).toLocaleString()}\n` +
      `  Member Count: ${org.member_count || 'Unknown'}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `You are a member of ${response.length} organization(s):\n\n${organizationsList}`
        }
      ]
    };
  }

  async handleListOrganizationMembers(args) {
    const { token, organization_id } = args;
    
    logger.info('Listing organization members', { organization_id });
    
    const response = await this.apiClient.get(`/api/organizations/${organization_id}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('Organization members retrieved', { organization_id, count: response.length });
    
    if (response.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No members found in this organization.'
          }
        ]
      };
    }

    const membersList = response.map(member => 
      `• ${member.username} (${member.email})\n` +
      `  Role: ${member.organization_role}\n` +
      `  System Role: ${member.system_role}\n` +
      `  Joined: ${new Date(member.joined_at).toLocaleString()}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Organization has ${response.length} member(s):\n\n${membersList}`
        }
      ]
    };
  }

  async handleInviteUser(args) {
    const { token, organization_id, email, role } = args;
    
    logger.info('Inviting user to organization', { organization_id, email, role });
    
    const response = await this.apiClient.post(`/api/organizations/${organization_id}/invite`, {
      email,
      role
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('User invited successfully', { organization_id, email, role });
    
    return {
      content: [
        {
          type: 'text',
          text: `User ${email} has been invited to the organization with the role: ${role}.\n\n` +
                `Invitation sent successfully!`
        }
      ]
    };
  }

  async handleUpdateMemberRole(args) {
    const { token, organization_id, user_id, role } = args;
    
    logger.info('Updating member role', { organization_id, user_id, role });
    
    const response = await this.apiClient.put(`/api/organizations/${organization_id}/members/${user_id}/role`, {
      role
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('Member role updated successfully', { organization_id, user_id, role });
    
    return {
      content: [
        {
          type: 'text',
          text: `Member role updated successfully to: ${role}`
        }
      ]
    };
  }

  async handleRemoveMember(args) {
    const { token, organization_id, user_id } = args;
    
    logger.info('Removing member from organization', { organization_id, user_id });
    
    await this.apiClient.delete(`/api/organizations/${organization_id}/members/${user_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('Member removed successfully', { organization_id, user_id });
    
    return {
      content: [
        {
          type: 'text',
          text: `Member has been removed from the organization successfully.`
        }
      ]
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      logger.error('MCP Server error', { error: error.message, stack: error.stack });
    };

    process.on('SIGINT', async () => {
      logger.info('Shutting down Organizations MCP Server...');
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Organizations MCP Server started successfully');
  }
}

// Start the server
const server = new OrganizationsMCPServer();
server.run().catch((error) => {
  logger.error('Failed to start Organizations MCP Server', { error: error.message });
  process.exit(1);
});
