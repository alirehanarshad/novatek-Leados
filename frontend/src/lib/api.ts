const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '/api';

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('novatek_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

export interface Lead {
  id: number;
  place_id?: string;
  name: string;
  category?: string;
  categories_raw?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  linkedin_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  rating?: number;
  review_count?: number;
  scraped_title?: string;
  scraped_meta_desc?: string;
  scraped_body_snippet?: string;
  crawl_status?: string;
  icp_score?: number;
  smb_tier?: string;
  recommended_service?: string;
  google_maps_url?: string;
  ai_qualification_summary?: string;
  ai_pain_points?: string;
  ai_value_prop?: string;
  ai_provider_used?: string;
  status: string;
  campaign_id?: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  kpis: {
    total_leads: number;
    leads_with_email: number;
    qualified_leads: number;
    total_outreaches: number;
    active_campaigns: number;
    enrichment_rate: number;
    qualification_rate: number;
  };
  status_breakdown: Record<string, number>;
  category_breakdown: { category: string; count: number }[];
  recent_leads: Lead[];
}

export interface ScrapeJob {
  id: number;
  source: string;
  status: string;
  total_found: number;
  total_processed: number;
  total_enriched: number;
  error_message?: string;
  query_params: Record<string, any>;
  created_at: string;
}

export interface Campaign {
  id: number;
  name: string;
  description?: string;
  target_category?: string;
  target_location?: string;
  icp_description?: string;
  status: string;
  lead_count: number;
  created_at: string;
}

export interface TeamUser {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfiguredKeysResponse {
  geoapify: { configured: boolean; masked: string | null; description: string };
  groq: { configured: boolean; masked: string | null; description: string };
  openai: { configured: boolean; masked: string | null; description: string };
  gemini: { configured: boolean; masked: string | null; description: string };
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  register: async (email: string, password: string, full_name?: string) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user session');
    return res.json();
  },

  // Settings & Dynamic API Keys
  getConfiguredKeys: async (): Promise<ConfiguredKeysResponse> => {
    const res = await fetch(`${BASE_URL}/settings/keys`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch configured API keys');
    return res.json();
  },

  updateConfiguredKeys: async (payload: {
    geoapify_api_key?: string;
    groq_api_key?: string;
    openai_api_key?: string;
    gemini_api_key?: string;
  }) => {
    const res = await fetch(`${BASE_URL}/settings/keys`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update API keys');
    return res.json();
  },

  testApiKey: async (service: string, apiKey?: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${BASE_URL}/settings/test-key`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ service, api_key: apiKey }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Key test failed' }));
      throw new Error(err.detail || 'Key test failed');
    }
    return res.json();
  },

  // Admin Panel
  getAdminUsers: async (): Promise<TeamUser[]> => {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch team users');
    return res.json();
  },

  createAdminUser: async (data: { email: string; password: string; full_name?: string; is_superuser: boolean }) => {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create user' }));
      throw new Error(err.detail || 'Failed to create user');
    }
    return res.json();
  },

  updateAdminUser: async (userId: number, data: Partial<TeamUser> & { password?: string }) => {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  deleteAdminUser: async (userId: number) => {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  },

  getAdminStats: async () => {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },

  // Dashboard
  getStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Leads
  getLeads: async (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const res = await fetch(`${BASE_URL}/leads?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch leads');
    return res.json();
  },

  getLead: async (id: number): Promise<Lead> => {
    const res = await fetch(`${BASE_URL}/leads/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch lead');
    return res.json();
  },

  updateLead: async (id: number, data: Partial<Lead>): Promise<Lead> => {
    const res = await fetch(`${BASE_URL}/leads/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update lead');
    return res.json();
  },

  deleteLead: async (id: number) => {
    const res = await fetch(`${BASE_URL}/leads/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete lead');
    return res.json();
  },

  cleanupUnreachableLeads: async (): Promise<{ deleted_count: number; message: string }> => {
    const res = await fetch(`${BASE_URL}/leads/cleanup-unreachable`, { 
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to cleanup unreachable leads');
    return res.json();
  },

  // Scraping
  startGeoapifyScrape: async (payload: {
    categories: string[];
    city?: string;
    country_code?: string;
    radius_meters?: number;
    limit?: number;
    campaign_id?: number;
    auto_enrich_websites?: boolean;
    auto_ai_qualify?: boolean;
    ai_provider?: string;
    require_contact?: boolean;
    require_website?: boolean;
  }) => {
    const res = await fetch(`${BASE_URL}/scrape/geoapify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to start scrape');
    return res.json();
  },

  crawlLeads: async (lead_ids: number[]) => {
    const res = await fetch(`${BASE_URL}/scrape/crawl-leads`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ lead_ids }),
    });
    if (!res.ok) throw new Error('Failed to crawl leads');
    return res.json();
  },

  getScrapeJobs: async (): Promise<ScrapeJob[]> => {
    const res = await fetch(`${BASE_URL}/scrape/jobs`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  // AI & Outreach
  qualifyLeads: async (lead_ids: number[], icp_description?: string, provider = 'groq') => {
    const res = await fetch(`${BASE_URL}/ai/qualify-batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ lead_ids, icp_description, provider }),
    });
    if (!res.ok) throw new Error('Failed to qualify leads');
    return res.json();
  },

  generateColdEmail: async (payload: {
    lead_id: number;
    sender_name: string;
    sender_company: string;
    offer_summary: string;
    tone?: string;
    provider?: string;
  }) => {
    const res = await fetch(`${BASE_URL}/ai/generate-cold-email`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to generate email');
    return res.json();
  },

  sendEmail: async (payload: { lead_id: number; subject: string; body: string; recipient_email: string }) => {
    const res = await fetch(`${BASE_URL}/ai/send-email`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to send email');
    return res.json();
  },

  // Campaigns
  getCampaigns: async (): Promise<Campaign[]> => {
    const res = await fetch(`${BASE_URL}/campaigns`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch campaigns');
    return res.json();
  },

  createCampaign: async (data: Partial<Campaign>): Promise<Campaign> => {
    const res = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create campaign');
    return res.json();
  },

  // System Health
  getHealth: async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('Failed to get system health');
    return res.json();
  },
};
