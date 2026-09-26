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
  MAP_ENTITIES,
} from '../data/mockData';

// API Base URL from environment or default to local proxy
const configuredApiBase = import.meta.env.VITE_API_BASE_URL || '/api';
export const API_BASE_URL = configuredApiBase.replace(/\/$/, '').endsWith('/api')
  ? configuredApiBase.replace(/\/$/, '')
  : `${configuredApiBase.replace(/\/$/, '')}/api`;

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
        const detail = errorData.detail || errorData.message || errorData.error;
        throw new Error(detail || `Request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`[API] Endpoint unavailable: ${endpoint} (${error.message}).`);
      throw error;
    }
  }

  // --- Donations Endpoints ---
  async getDonations(params) {
    if (this.useMock) return mockApi.getDonations(params);
    const query = params ? `?${new URLSearchParams(params)}` : '';
    const data = await this.request(`/donations/${query}`);
    return { success: true, data, total: data.length };
  }

  async getDonationById(id) {
    if (this.useMock) return mockApi.getDonationById(id);
    return { success: true, data: await this.request(`/donations/${id}`) };
  }

  async createDonation(donationData) {
    if (this.useMock) return mockApi.createDonation(donationData);
    return { success: true, data: await this.request('/donations/', {
        method: 'POST',
        body: JSON.stringify(donationData),
      }) };
  }

  async updateDonation(id, updateData) {
    if (this.useMock) return mockApi.updateDonation(id, updateData);
    return { success: true, data: await this.request(`/donations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      }) };
  }

  async getRestaurants(params) {
    if (this.useMock) return { success: true, data: [], total: 0 };
    const query = params ? `?${new URLSearchParams(params)}` : '';
    const data = await this.request(`/restaurants/${query}`);
    return { success: true, data, total: data.length };
  }

  async getRestaurantById(id) {
    if (this.useMock) return { success: true, data: null };
    return { success: true, data: await this.request(`/restaurants/${id}`) };
  }

  async getRecipients(params) {
    if (this.useMock) return mockApi.getShelters(params);
    const query = params ? `?${new URLSearchParams(params)}` : '';
    const data = await this.request(`/shelters/${query}`);
    return { success: true, data, total: data.length };
  }

  async getRecipientById(id) {
    if (this.useMock) return mockApi.getShelterById(id);
    return { success: true, data: await this.request(`/shelters/${id}`) };
  }

  // --- Shelters Endpoints ---
  async getShelters(params) {
    return this.getRecipients(params);
  }

  async getShelterById(id) {
    return this.getRecipientById(id);
  }

  async updateShelterDemand(id, mealsNeededTonight) {
    if (this.useMock) return mockApi.updateShelterDemand(id, mealsNeededTonight);
    throw new Error('Recipient demand updates are not supported by the backend contract.');
  }

  // --- Agents Endpoints ---
  async getAgents() {
    if (this.useMock) return mockApi.getAgents();
    throw new Error('Agent status listing is not exposed by the backend contract.');
  }

  async getAgentLogs(params) {
    if (this.useMock) return mockApi.getAgents();
    const query = params ? `?${new URLSearchParams(params)}` : '';
    const data = await this.request(`/agent_logs/${query}`);
    return { success: true, data, total: data.length };
  }

  async getAgentStatus(agentId) {
    if (this.useMock) return mockApi.getAgentStatus(agentId);
    throw new Error('Agent status endpoints are not exposed by the backend contract.');
  }

  async triggerConsensusCycle() {
    if (this.useMock) return mockApi.triggerConsensusCycle();
    return this.coordinate({});
  }

  // --- Matches Endpoints ---
  async getMatches(params) {
    if (this.useMock) return mockApi.getMatches();
    const query = params ? `?${new URLSearchParams(params)}` : '';
    const data = await this.request(`/matches/${query}`);
    return { success: true, data, total: data.length };
  }

  async getMatchesForDonation(donationId) {
    if (this.useMock) return mockApi.getMatches();
    const data = await this.request(`/matches/donation/${donationId}`);
    return { success: true, data, total: data.length };
  }

  async generateMatches(donationId) {
    if (this.useMock) return mockApi.getMatches();
    const data = await this.request(`/matches/generate/${donationId}`, { method: 'POST' });
    return { success: true, data, total: data.length };
  }

  async acceptMatch(matchId) {
    if (this.useMock) return mockApi.acceptMatch(matchId);
    throw new Error('Match approval is not supported by the backend contract.');
  }

  // --- Volunteers Endpoints ---
  async getVolunteers(params) {
    if (this.useMock) return mockApi.getVolunteers();
    const query = params ? `?${new URLSearchParams(params)}` : '';
    const data = await this.request(`/volunteers/${query}`);
    return { success: true, data, total: data.length };
  }

  async getMapData() {
    if (this.useMock) {
      return {
        success: true,
        data: {
          restaurants: MAP_ENTITIES.filter((item) => item.type === 'restaurant').map((item) => ({
            id: item.id, name: item.name, latitude: item.lat, longitude: item.lng,
          })),
          recipients: MAP_ENTITIES.filter((item) => item.type === 'shelter').map((item) => ({
            id: item.id, name: item.name, latitude: item.lat, longitude: item.lng,
          })),
          volunteers: MAP_ENTITIES.filter((item) => item.type === 'volunteer').map((item) => ({
            id: item.id, name: item.name, latitude: item.lat, longitude: item.lng,
          })),
          rescues: [],
          donations: [],
        },
      };
    }
    const [restaurants, recipients, volunteers, rescues, donations] = await Promise.all([
      this.request('/map/restaurants'),
      this.request('/map/recipients'),
      this.getVolunteers(),
      this.request('/map/active-rescues'),
      this.getDonations(),
    ]);
    return {
      success: true,
      data: { restaurants, recipients, volunteers: volunteers.data, rescues, donations: donations.data },
    };
  }

  analyzeFood(payload) {
    return this.request('/agents/analyze-food', { method: 'POST', body: JSON.stringify(payload) });
  }

  findRecipients(payload) {
    return this.request('/agents/find-recipients', { method: 'POST', body: JSON.stringify(payload) });
  }

  calculateRoute(payload) {
    return this.request('/agents/calculate-route', { method: 'POST', body: JSON.stringify(payload) });
  }

  coordinate(payload) {
    return this.request('/agents/coordinate', { method: 'POST', body: JSON.stringify(payload) });
  }

  rescueDonation(donationId) {
    return this.request(`/agents/rescue/${donationId}`, { method: 'POST' });
  }

  startRescue(donationId) {
    return this.request(`/rescue/start/${donationId}`, { method: 'POST' });
  }

  getRescue(rescueId) {
    return this.request(`/rescue/${rescueId}`);
  }

  approveRescue(rescueId) {
    return this.request(`/rescue/${rescueId}/approve`, { method: 'POST' });
  }

  assignVolunteer(rescueId, volunteerId) {
    return this.request(`/rescue/${rescueId}/assign-volunteer`, {
      method: 'POST',
      body: JSON.stringify({ volunteer_id: volunteerId }),
    });
  }

  pickupRescue(rescueId) {
    return this.request(`/rescue/${rescueId}/pickup`, { method: 'POST' });
  }

  deliverRescue(rescueId) {
    return this.request(`/rescue/${rescueId}/delivery`, { method: 'POST' });
  }

  completeRescue(rescueId) {
    return this.request(`/rescue/${rescueId}/complete`, { method: 'POST' });
  }

  async updateVolunteerStatus(volunteerId, status) {
    if (this.useMock) return mockApi.updateVolunteerStatus(volunteerId, status);
    throw new Error('Volunteer status updates are not supported by the backend contract.');
  }

  // --- Analytics & Stats Endpoints ---
  async getAnalytics(timeframe = '6m') {
    if (this.useMock) return mockApi.getAnalytics(timeframe);
    return { success: true, data: await this.request(`/analytics/overview?timeframe=${timeframe}`) };
  }

  async getAnalyticsImpact() {
    if (this.useMock) return { success: true, data: {} };
    return { success: true, data: await this.request('/analytics/impact') };
  }

  async getDashboardStats() {
    if (this.useMock) return mockApi.getDashboardStats();
    throw new Error('Dashboard stats are derived from backend resources.');
  }

  // --- Auth Endpoints ---
  async login(credentials) {
    if (this.useMock) return mockApi.login(credentials);
    throw new Error('Authentication is not exposed by the backend contract.');
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
