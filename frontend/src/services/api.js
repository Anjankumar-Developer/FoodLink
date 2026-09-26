/**
 * FOODLINK AI - Central API Service Layer
 * Manages requests using VITE_API_BASE_URL and provides a comprehensive
 * mock implementation returning sample data for donations, shelters, agents,
 * and logistics telemetry to support seamless development.
 */

import {
  RECENT_DONATIONS,
  SHELTERS_DATA,
  AGENT_MONITOR_DATA,
  RECOMMENDED_MATCHES,
  VOLUNTEERS_DATA,
  ANALYTICS_DATA,
  DASHBOARD_STATS,
  USER_PROFILE_DATA,
} from '../data/mockData';

// API Base URL from environment or default to local proxy
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// In-memory persistent state for mock operations during development
let mockDonations = [...RECENT_DONATIONS];
let mockShelters = [...SHELTERS_DATA];
let mockAgents = [...AGENT_MONITOR_DATA];
let mockMatches = [...RECOMMENDED_MATCHES];
let mockVolunteers = [...VOLUNTEERS_DATA];
let mockStats = { ...DASHBOARD_STATS };

// Helper to simulate asynchronous network latency for realistic development
const simulateLatency = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock API Implementation returning sample data for development
 */
export const mockApi = {
  // --- Donations Mock Endpoints ---
  async getDonations(params = {}) {
    await simulateLatency();
    let result = [...mockDonations];

    if (params.status && params.status !== 'All') {
      result = result.filter(
        (d) => d.status.toLowerCase() === params.status.toLowerCase()
      );
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (d) =>
          d.foodName.toLowerCase().includes(q) ||
          d.restaurant.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }
    return {
      success: true,
      data: result,
      total: result.length,
    };
  },

  async getDonationById(id) {
    await simulateLatency();
    const item = mockDonations.find((d) => d.id === id);
    if (!item) {
      throw new Error(`Donation with ID ${id} not found.`);
    }
    return { success: true, data: item };
  },

  async createDonation(donationData) {
    await simulateLatency(200);
    const newId = `DON-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDonation = {
      id: newId,
      restaurant: donationData.restaurant || 'The Grand Bistro & Kitchen',
      location: donationData.location || 'Downtown Metro District',
      foodName: donationData.foodName || 'Assorted Gourmet Entrees',
      category: donationData.category || 'Prepared Meals',
      quantity: donationData.quantity || '40 portions',
      dietType: donationData.dietType || 'Standard',
      preparedTime: donationData.preparedTime || 'Just now',
      expiryTime: donationData.expiryTime
        ? (donationData.expiryTime.startsWith('Expires')
          ? donationData.expiryTime
          : `Expires in ${donationData.expiryTime}`)
        : 'Expires in 2h 00m',
      expiryHours: Number(donationData.expiryHours) || 2.0,
      storageCondition: donationData.storageCondition || 'Heated Container (65°C)',
      status: 'Matching',
      matchId: null,
      matchedShelter: null,
      temperatureSafe: true,
      pickupNotes: donationData.pickupNotes || '',
      createdAt: new Date().toISOString(),
    };

    mockDonations.unshift(newDonation);
    mockStats.activeDonations += 1;

    return {
      success: true,
      message: 'Donation successfully registered and indexed for autonomous matching.',
      data: newDonation,
    };
  },

  async updateDonation(id, updateData) {
    await simulateLatency();
    const index = mockDonations.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`Donation ${id} not found.`);
    }
    mockDonations[index] = { ...mockDonations[index], ...updateData };
    return { success: true, data: mockDonations[index] };
  },

  // --- Shelters Mock Endpoints ---
  async getShelters(params = {}) {
    await simulateLatency();
    let result = [...mockShelters];

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.dietaryFocus.some((d) => d.toLowerCase().includes(q))
      );
    }
    return {
      success: true,
      data: result,
      total: result.length,
    };
  },

  async getShelterById(id) {
    await simulateLatency();
    const shelter = mockShelters.find((s) => s.id === id);
    if (!shelter) {
      throw new Error(`Shelter with ID ${id} not found.`);
    }
    return { success: true, data: shelter };
  },

  async updateShelterDemand(id, mealsNeededTonight) {
    await simulateLatency(150);
    const index = mockShelters.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Shelter ${id} not found.`);
    }
    mockShelters[index] = {
      ...mockShelters[index],
      mealsNeededTonight: Number(mealsNeededTonight),
    };
    return {
      success: true,
      message: `Shelter demand updated to ${mealsNeededTonight} meals.`,
      data: mockShelters[index],
    };
  },

  // --- Agents Mock Endpoints ---
  async getAgents() {
    await simulateLatency();
    return {
      success: true,
      data: mockAgents,
      consensusStatus: 'Synchronized',
      lastConsensusTimestamp: new Date().toISOString(),
    };
  },

  async getAgentStatus(agentId) {
    await simulateLatency();
    if (agentId) {
      const agent = mockAgents.find((a) => a.id === agentId);
      if (!agent) throw new Error(`Agent ${agentId} not found.`);
      return { success: true, data: agent };
    }
    return { success: true, data: mockAgents };
  },

  async triggerConsensusCycle() {
    await simulateLatency(300);
    mockAgents = mockAgents.map((agent) => ({
      ...agent,
      tasksCompletedToday: agent.tasksCompletedToday + 1,
      lastUpdated: 'Just now',
    }));
    return {
      success: true,
      message: 'Autonomous multi-agent consensus cycle completed successfully.',
      timestamp: new Date().toISOString(),
      activeAgents: mockAgents.length,
      consensusConfidence: 99.2,
    };
  },

  // --- Matches Mock Endpoints ---
  async getMatches() {
    await simulateLatency();
    return {
      success: true,
      data: mockMatches,
      total: mockMatches.length,
    };
  },

  async acceptMatch(matchId) {
    await simulateLatency(200);
    const index = mockMatches.findIndex((m) => m.id === matchId);
    if (index !== -1) {
      mockMatches[index] = {
        ...mockMatches[index],
        status: 'Dispatched',
      };
    }
    mockStats.successfulMatches += 1;
    return {
      success: true,
      message: `Rescue match ${matchId} dispatched to transport courier.`,
      data: index !== -1 ? mockMatches[index] : null,
    };
  },

  // --- Volunteers Mock Endpoints ---
  async getVolunteers() {
    await simulateLatency();
    return {
      success: true,
      data: mockVolunteers,
      total: mockVolunteers.length,
    };
  },

  async updateVolunteerStatus(id, status) {
    await simulateLatency();
    const index = mockVolunteers.findIndex((v) => v.id === id);
    if (index !== -1) {
      mockVolunteers[index] = { ...mockVolunteers[index], status };
    }
    return {
      success: true,
      data: index !== -1 ? mockVolunteers[index] : null,
    };
  },

  // --- Analytics & Stats Mock Endpoints ---
  async getAnalytics(timeframe = '6m') {
    await simulateLatency();
    return {
      success: true,
      timeframe,
      data: ANALYTICS_DATA,
    };
  },

  async getDashboardStats() {
    await simulateLatency();
    return {
      success: true,
      data: mockStats,
    };
  },

  // --- Auth Mock Endpoint ---
  async login(credentials) {
    await simulateLatency(200);
    return {
      success: true,
      token: 'mock-jwt-token-foodlink-2026',
      user: {
        id: 'usr-001',
        name: credentials.email?.split('@')[0] || 'Elena Rostova',
        email: credentials.email || 'elena.rostova@rescuecoalition.org',
        role: credentials.role || 'Logistics Coordinator',
        organization: 'SF Bay Area Food Recovery Coalition',
      },
    };
  },
};

/**
 * Standard ApiService Class managing HTTP requests with VITE_API_BASE_URL
 * and seamless fallback to mock sample data for development.
 */
class ApiService {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = null;
    // If VITE_USE_MOCK_API is explicitly set to true, default to mock mode
    this.useMock = import.meta.env.VITE_USE_MOCK_API === 'true';
  }

  setAuthToken(token) {
    this.token = token;
  }

  setMockMode(enabled) {
    this.useMock = Boolean(enabled);
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`[API] Endpoint unavailable: ${endpoint} (${error.message}). Falling back to mock data if available.`);
      throw error;
    }
  }

  // --- Donations Endpoints ---
  async getDonations(params) {
    if (this.useMock) return mockApi.getDonations(params);
    try {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return await this.request(`/donations${query}`);
    } catch (e) {
      return mockApi.getDonations(params);
    }
  }

  async getDonationById(id) {
    if (this.useMock) return mockApi.getDonationById(id);
    try {
      return await this.request(`/donations/${id}`);
    } catch (e) {
      return mockApi.getDonationById(id);
    }
  }

  async createDonation(donationData) {
    if (this.useMock) return mockApi.createDonation(donationData);
    try {
      return await this.request('/donations', {
        method: 'POST',
        body: JSON.stringify(donationData),
      });
    } catch (e) {
      return mockApi.createDonation(donationData);
    }
  }

  async updateDonation(id, updateData) {
    if (this.useMock) return mockApi.updateDonation(id, updateData);
    try {
      return await this.request(`/donations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
    } catch (e) {
      return mockApi.updateDonation(id, updateData);
    }
  }

  // --- Shelters Endpoints ---
  async getShelters(params) {
    if (this.useMock) return mockApi.getShelters(params);
    try {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return await this.request(`/shelters${query}`);
    } catch (e) {
      return mockApi.getShelters(params);
    }
  }

  async getShelterById(id) {
    if (this.useMock) return mockApi.getShelterById(id);
    try {
      return await this.request(`/shelters/${id}`);
    } catch (e) {
      return mockApi.getShelterById(id);
    }
  }

  async updateShelterDemand(id, mealsNeededTonight) {
    if (this.useMock) return mockApi.updateShelterDemand(id, mealsNeededTonight);
    try {
      return await this.request(`/shelters/${id}/demand`, {
        method: 'PATCH',
        body: JSON.stringify({ mealsNeededTonight }),
      });
    } catch (e) {
      return mockApi.updateShelterDemand(id, mealsNeededTonight);
    }
  }

  // --- Agents Endpoints ---
  async getAgents() {
    if (this.useMock) return mockApi.getAgents();
    try {
      return await this.request('/agents');
    } catch (e) {
      return mockApi.getAgents();
    }
  }

  async getAgentStatus(agentId) {
    if (this.useMock) return mockApi.getAgentStatus(agentId);
    try {
      const path = agentId ? `/agents/${agentId}/status` : '/agents/status';
      return await this.request(path);
    } catch (e) {
      return mockApi.getAgentStatus(agentId);
    }
  }

  async triggerConsensusCycle() {
    if (this.useMock) return mockApi.triggerConsensusCycle();
    try {
      return await this.request('/agents/consensus', { method: 'POST' });
    } catch (e) {
      return mockApi.triggerConsensusCycle();
    }
  }

  // --- Matches Endpoints ---
  async getMatches(params) {
    if (this.useMock) return mockApi.getMatches();
    try {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return await this.request(`/matches${query}`);
    } catch (e) {
      return mockApi.getMatches();
    }
  }

  async acceptMatch(matchId) {
    if (this.useMock) return mockApi.acceptMatch(matchId);
    try {
      return await this.request(`/matches/${matchId}/accept`, {
        method: 'POST',
      });
    } catch (e) {
      return mockApi.acceptMatch(matchId);
    }
  }

  // --- Volunteers Endpoints ---
  async getVolunteers(params) {
    if (this.useMock) return mockApi.getVolunteers();
    try {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return await this.request(`/volunteers${query}`);
    } catch (e) {
      return mockApi.getVolunteers();
    }
  }

  async updateVolunteerStatus(volunteerId, status) {
    if (this.useMock) return mockApi.updateVolunteerStatus(volunteerId, status);
    try {
      return await this.request(`/volunteers/${volunteerId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      return mockApi.updateVolunteerStatus(volunteerId, status);
    }
  }

  // --- Analytics & Stats Endpoints ---
  async getAnalytics(timeframe = '6m') {
    if (this.useMock) return mockApi.getAnalytics(timeframe);
    try {
      return await this.request(`/analytics?timeframe=${timeframe}`);
    } catch (e) {
      return mockApi.getAnalytics(timeframe);
    }
  }

  async getDashboardStats() {
    if (this.useMock) return mockApi.getDashboardStats();
    try {
      return await this.request('/stats');
    } catch (e) {
      return mockApi.getDashboardStats();
    }
  }

  // --- Auth Endpoints ---
  async login(credentials) {
    if (this.useMock) return mockApi.login(credentials);
    try {
      return await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    } catch (e) {
      return mockApi.login(credentials);
    }
  }

  // --- Gemini AI Live Server Endpoints ---
  async chat({ messages, model = 'gemini-3.5-flash', systemInstruction, useMaps = false, location }) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, model, systemInstruction, useMaps, location }),
    });
  }

  async mapsGrounding({ query, location }) {
    return this.request('/maps-grounding', {
      method: 'POST',
      body: JSON.stringify({ query, location }),
    });
  }

  async transcribeAudio({ audio, mimeType = 'audio/webm' }) {
    return this.request('/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audio, mimeType }),
    });
  }
}

export const api = new ApiService(API_BASE_URL);
export default api;
