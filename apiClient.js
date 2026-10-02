/* ==========================================================================
   ECOPUNTOS PAMPLONA — apiClient.js
   Capa de comunicación con el Backend REST API.
   Reemplaza las funciones locales de LocalStorage con llamadas fetch() reales.
   ========================================================================== */

const API_URL = 'http://localhost:3000/api';

// Token storage
const tokenStore = {
  get() { return localStorage.getItem('ecopuntos_jwt'); },
  set(t) { localStorage.setItem('ecopuntos_jwt', t); },
  clear() { localStorage.removeItem('ecopuntos_jwt'); }
};

// Base request helper
async function apiFetch(path, options = {}) {
  const token = tokenStore.get();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API error ${res.status}`);
  }
  return data;
}

// Normalize user from backend format to frontend format
function normalizeUser(apiUser, role) {
  const initials = apiUser.name.split(' ').slice(0, 2).map(n => n[0].toUpperCase()).join('');
  // Map backend roles to frontend roles
  const roleMap = { 'Ciudadano': 'citizen', 'Gestor_de_Punto': 'worker', 'Administrador': 'admin' };
  return {
    id: apiUser.id,
    email: apiUser.email,
    name: apiUser.name,
    avatar: initials,
    city: apiUser.default_city || 'Pamplona',
    role: roleMap[apiUser.role] || 'citizen',
    points: apiUser.total_points || 0,
    co2Saved: 0,
    level: apiUser.level || 'Semilla Verde',
    doc: apiUser.email, // Use email as "doc" for compatibility
    docType: 'Email',
    phone: '',
    createdAt: apiUser.created_at ? apiUser.created_at.substring(0, 10) : ''
  };
}

// Normalize ecopoint from backend to frontend format
function normalizeEcopoint(ep) {
  return {
    id: ep.id,
    name: ep.name,
    district: ep.city,
    city: ep.city,
    address: ep.address,
    hours: 'Lun - Sáb: 8:00 AM - 5:00 PM',
    status: 'open',
    lat: parseFloat(ep.lat),
    lng: parseFloat(ep.lng),
    materials: ['Plástico', 'Cartón y Papel', 'Vidrio', 'Metal'],
    manager: 'EcoPuntos Pamplona',
    distance_meters: ep.distance_meters ? Math.round(ep.distance_meters) : null
  };
}

// ─── API CLIENT ───────────────────────────────────────────────────────────────

const apiClient = {

  auth: {
    async login(email, password) {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      tokenStore.set(data.token);
      return normalizeUser(data.user);
    },

    async register(name, email, password, role = 'Ciudadano', city = 'Pamplona') {
      // Map frontend roles to backend roles
      const roleMap = { 'citizen': 'Ciudadano', 'worker': 'Gestor_de_Punto', 'admin': 'Administrador' };
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          role: roleMap[role] || 'Ciudadano',
          defaultCity: city
        })
      });
      tokenStore.set(data.token);
      return normalizeUser(data.user);
    },

    async getProfile() {
      const data = await apiFetch('/auth/profile');
      return normalizeUser(data.user);
    },

    logout() {
      tokenStore.clear();
    }
  },

  ecopoints: {
    async getAll(city = 'Pamplona') {
      const data = await apiFetch(`/ecopoints?city=${encodeURIComponent(city)}`);
      return (data.ecopoints || []).map(normalizeEcopoint);
    },

    async getNearby(lat, lng, radiusMeters = 5000) {
      const data = await apiFetch(`/ecopoints/nearby?lat=${lat}&lng=${lng}&radius=${radiusMeters}`);
      return (data.ecopoints || []).map(normalizeEcopoint);
    }
  },

  deliveries: {
    async create(ecopointId, materialId, weightKg) {
      return await apiFetch('/deliveries', {
        method: 'POST',
        body: JSON.stringify({
          ecopointId,
          items: [{ material_id: materialId, weight_kg: weightKg }]
        })
      });
    },

    async approve(deliveryId) {
      return await apiFetch(`/deliveries/${deliveryId}/approve`, { method: 'PATCH' });
    },

    async getPending(ecopointId) {
      return await apiFetch(`/deliveries/pending?ecopointId=${ecopointId}`);
    },

    async getMy() {
      const data = await apiFetch('/deliveries/my');
      return data.deliveries || [];
    }
  },

  materials: {
    async getAll() {
      const data = await apiFetch('/materials');
      return data.materials || [];
    }
  },

  admin: {
    async getMetrics() {
      const data = await apiFetch('/admin/metrics');
      return data.metrics;
    },
    async createGestor(name, email, password, defaultCity = 'Pamplona') {
      return await apiFetch('/admin/create-gestor', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, defaultCity })
      });
    },
    async getGestores() {
      const data = await apiFetch('/admin/gestores');
      return data.gestores || [];
    }
  },

  rewards: {
    async getAll() {
      const data = await apiFetch('/rewards');
      return (data.rewards || []).map(r => ({
        id: r.id,
        title: r.name,
        category: (r.category || 'general').toLowerCase().replace(/\s+/g, '-'),
        cost: r.point_cost,
        icon: 'fa-gift',
        color: 'text-emerald',
        desc: r.description || '',
        ally: 'Aliado Pamplona'
      }));
    },

    async redeem(rewardId) {
      return await apiFetch(`/rewards/${rewardId}/redeem`, { method: 'POST' });
    },

    async getHistory() {
      const data = await apiFetch('/rewards/history');
      return data.history || [];
    }
  },

  ranking: {
    async getTop(limit = 10) {
      const data = await apiFetch(`/ranking?limit=${limit}`);
      return (data.ranking || []).map(u => {
        const initials = u.name.split(' ').slice(0, 2).map(n => n[0].toUpperCase()).join('');
        return {
          rank: u.position,
          name: u.name,
          avatar: initials,
          city: u.default_city || 'Pamplona',
          weightKg: 0,
          points: u.total_points,
          level: u.level
        };
      });
    }
  },

  qr: {
    async generate() {
      const data = await apiFetch('/qr/generate');
      return data.qr; // base64 data URL
    },

    async scan(payload) {
      const data = await apiFetch('/qr/scan', {
        method: 'POST',
        body: JSON.stringify({ payload })
      });
      return data.citizen;
    }
  }
};

// Make globally available
window.apiClient = apiClient;
