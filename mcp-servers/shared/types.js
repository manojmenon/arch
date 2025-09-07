import { z } from 'zod';

// Base schemas
export const UUID = z.string().uuid();
export const Email = z.string().email();
export const Timestamp = z.string().datetime();

// User schemas
export const User = z.object({
  id: UUID,
  username: z.string().min(3).max(50),
  email: Email,
  system_role: z.enum(['admin', 'user']),
  created_at: Timestamp,
  updated_at: Timestamp
});

export const UserProfile = User.extend({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  organizations: z.array(z.object({
    id: UUID,
    name: z.string(),
    role: z.enum(['owner', 'admin', 'manager', 'viewer', 'member']),
    permissions: z.record(z.any()).optional(),
    joined_at: Timestamp
  }))
});

// Organization schemas
export const Organization = z.object({
  id: UUID,
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  created_at: Timestamp,
  updated_at: Timestamp
});

export const OrganizationMember = z.object({
  id: UUID,
  username: z.string(),
  email: Email,
  system_role: z.string(),
  organization_role: z.enum(['owner', 'admin', 'manager', 'viewer', 'member']),
  permissions: z.record(z.any()).optional(),
  joined_at: Timestamp,
  updated_at: Timestamp
});

// Project schemas
export const Project = z.object({
  id: UUID,
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed', 'on-hold', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  budget: z.number().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  owner_name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  organization_id: UUID.optional(),
  organization_name: z.string().optional(),
  category_id: UUID.optional(),
  category_name: z.string().optional(),
  tag_names: z.array(z.string()).optional(),
  tag_colors: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  documents: z.record(z.any()).optional(),
  created_at: Timestamp,
  updated_at: Timestamp
});

// Category schemas
export const Category = z.object({
  id: UUID,
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().optional(),
  created_at: Timestamp,
  updated_at: Timestamp
});

// Tag schemas
export const Tag = z.object({
  id: UUID,
  name: z.string().min(1).max(50),
  color: z.string().optional(),
  created_at: Timestamp,
  updated_at: Timestamp
});

// API Token schemas
export const ApiToken = z.object({
  id: UUID,
  name: z.string().min(1).max(100),
  token: z.string().optional(), // Only returned on creation
  expires_at: Timestamp,
  created_at: Timestamp,
  last_used_at: Timestamp.optional()
});

// Request schemas
export const CreateTokenRequest = z.object({
  name: z.string().min(1).max(100),
  expires_in_hours: z.number().min(1).max(8760) // Max 1 year
});

export const InviteUserRequest = z.object({
  email: Email,
  role: z.enum(['admin', 'manager', 'viewer', 'member'])
});

export const UpdateUserRoleRequest = z.object({
  role: z.enum(['owner', 'admin', 'manager', 'viewer', 'member'])
});

// Response schemas
export const ApiResponse = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional()
});

export const PaginatedResponse = ApiResponse.extend({
  data: z.object({
    items: z.array(z.any()),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number()
  })
});

// Error schemas
export const ApiError = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional()
});
