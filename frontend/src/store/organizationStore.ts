import { create } from 'zustand';
import { apiClient } from '../utils/api';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  type: 'Company' | 'Government' | 'NGO' | 'Individual' | 'Partnership';
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_id?: string;
  registration_number?: string;
  metadata?: any;
  project_count?: number;
  user_count?: number;
  created_at: string;
  updated_at: string;
}

export interface UserOrganizationMembership extends Organization {
  role: string;
  permissions?: any;
  joined_at: string;
  member_count?: number;
}

export interface ProjectCategory {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectTag {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectFilters {
  organization_id?: string;
  category_id?: string;
  status?: string;
  priority?: string;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

interface OrganizationState {
  organizations: Organization[];
  selectedOrganization: Organization | null;
  userOrganizations: UserOrganizationMembership[];
  categories: ProjectCategory[];
  tags: ProjectTag[];
  filters: ProjectFilters;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchOrganizations: (search?: string, type?: string) => Promise<void>;
  fetchUserOrganizations: () => Promise<void>;
  selectOrganization: (organization: Organization | null) => void;
  switchToUserOrganization: (organizationId: string) => void;
  fetchCategories: (organizationId?: string) => Promise<void>;
  fetchTags: (organizationId?: string) => Promise<void>;
  updateFilters: (filters: Partial<ProjectFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultFilters: ProjectFilters = {
  limit: 50,
  offset: 0,
};

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  organizations: [],
  selectedOrganization: null,
  userOrganizations: [],
  categories: [],
  tags: [],
  filters: defaultFilters,
  loading: false,
  error: null,

  fetchOrganizations: async (search?: string, type?: string) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (type) params.append('type', type);
      
      const response = await apiClient.get(`/organizations?${params.toString()}`);
      set({ organizations: response as Organization[], loading: false });
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      set({ 
        error: error.response?.data?.error || 'Failed to fetch organizations',
        loading: false 
      });
    }
  },

  fetchUserOrganizations: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/api/user/organizations');
      set({ userOrganizations: response as UserOrganizationMembership[], loading: false });
    } catch (error: any) {
      console.error('Error fetching user organizations:', error);
      set({ 
        error: error.response?.data?.error || 'Failed to fetch user organizations',
        loading: false 
      });
    }
  },

  selectOrganization: (organization: Organization | null) => {
    set({ selectedOrganization: organization });
    // Update filters to include the selected organization
    const currentFilters = get().filters;
    set({ 
      filters: { 
        ...currentFilters, 
        organization_id: organization?.id,
        offset: 0 // Reset pagination when changing organization
      }
    });
    
    // Fetch categories and tags for the selected organization
    if (organization) {
      get().fetchCategories(organization.id);
      get().fetchTags(organization.id);
    } else {
      set({ categories: [], tags: [] });
    }
  },

  switchToUserOrganization: (organizationId: string) => {
    const userOrgs = get().userOrganizations;
    const organization = userOrgs.find(org => org.id === organizationId);
    if (organization) {
      // Convert UserOrganizationMembership to Organization for selection
      const orgForSelection: Organization = {
        id: organization.id,
        name: organization.name,
        description: organization.description,
        type: organization.type,
        address: organization.address,
        city: organization.city,
        state: organization.state,
        postal_code: organization.postal_code,
        country: organization.country,
        phone: organization.phone,
        email: organization.email,
        website: organization.website,
        tax_id: organization.tax_id,
        registration_number: organization.registration_number,
        metadata: organization.metadata,
        project_count: organization.project_count,
        user_count: organization.user_count,
        created_at: organization.created_at,
        updated_at: organization.updated_at,
      };
      get().selectOrganization(orgForSelection);
    }
  },

  fetchCategories: async (organizationId?: string) => {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organization_id', organizationId);
      
      const response = await apiClient.get(`/categories?${params.toString()}`);
      set({ categories: response as ProjectCategory[] });
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      set({ error: error.response?.data?.error || 'Failed to fetch categories' });
    }
  },

  fetchTags: async (organizationId?: string) => {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organization_id', organizationId);
      
      const response = await apiClient.get(`/tags?${params.toString()}`);
      set({ tags: response as ProjectTag[] });
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      set({ error: error.response?.data?.error || 'Failed to fetch tags' });
    }
  },

  updateFilters: (newFilters: Partial<ProjectFilters>) => {
    const currentFilters = get().filters;
    set({ 
      filters: { 
        ...currentFilters, 
        ...newFilters,
        offset: 0 // Reset pagination when filters change
      }
    });
  },

  clearFilters: () => {
    set({ filters: defaultFilters });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
