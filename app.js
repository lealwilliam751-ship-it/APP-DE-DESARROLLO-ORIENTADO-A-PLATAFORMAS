/* ==========================================================================
   ECOPUNTOS COLOMBIA — APP.JS v2.0
   Sistema de Reciclaje y Puntos Ecológicos — Mobile PWA
   Adaptado al contexto colombiano: PGIRS, Decreto 596/2016, Ley 1252/2008
   ========================================================================== */

'use strict';

/* ══════════════════════════════════════════════════════════════
   BASE DE DATOS LOCAL — Simula un backend con LocalStorage
   ══════════════════════════════════════════════════════════════ */
const DB = {
  // Tabla de usuarios (simula BD real)
  defaultUsers: [
    {
      id: 'ECO-CO-1001',
      doc: '1001',
      docType: 'CC',
      password: 'eco123',
      name: 'Juan Rodríguez',
      avatar: 'JR',
      phone: '3001234567',
      city: 'Bogotá',
      role: 'citizen',
      points: 1450,
      co2Saved: 34.2,
      level: 'Reciclador Bronce',
      createdAt: '2026-01-15'
    },
    {
      id: 'ECO-CO-2002',
      doc: '2002',
      docType: 'CC',
      password: 'gestor123',
      name: 'Claudia Vargas',
      avatar: 'CV',
      phone: '3117654321',
      city: 'Medellín',
      role: 'worker',
      points: 0,
      co2Saved: 0,
      level: 'Gestor Certificado',
      createdAt: '2026-02-01'
    },
    {
      id: 'ECO-CO-9001',
      doc: '9001',
      docType: 'NIT',
      password: 'admin123',
      name: 'Admin UAESP',
      avatar: 'AU',
      phone: '6013000000',
      city: 'Bogotá',
      role: 'admin',
      points: 0,
      co2Saved: 0,
      level: 'Administrador',
      createdAt: '2026-01-01'
    }
  ],

  getUsers() {
    const stored = localStorage.getItem('ecopuntos_users');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('ecopuntos_users', JSON.stringify(this.defaultUsers));
    return this.defaultUsers;
  },

  saveUsers(users) {
    localStorage.setItem('ecopuntos_users', JSON.stringify(users));
  },

  getUserByDoc(doc) {
    return this.getUsers().find(u => u.doc === doc.trim());
  },

  addUser(user) {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  },

  updateUser(updatedUser) {
    const users = this.getUsers().map(u => u.id === updatedUser.id ? updatedUser : u);
    this.saveUsers(users);
    // Si el usuario actualizado es el sesionado, sincronizar STATE y localStorage
    if (STATE.currentUser && STATE.currentUser.id === updatedUser.id) {
      STATE.currentUser = { ...updatedUser };
      localStorage.setItem('ecopuntos_session', JSON.stringify(STATE.currentUser));
    }
  },

  getDeliveries(defaultDeliveries) {
    const stored = localStorage.getItem('ecopuntos_deliveries');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('ecopuntos_deliveries', JSON.stringify(defaultDeliveries));
    return defaultDeliveries;
  },

  saveDeliveries(deliveries) {
    localStorage.setItem('ecopuntos_deliveries', JSON.stringify(deliveries));
  },

  getVouchers() {
    const stored = localStorage.getItem('ecopuntos_vouchers');
    return stored ? JSON.parse(stored) : [];
  },

  saveVouchers(vouchers) {
    localStorage.setItem('ecopuntos_vouchers', JSON.stringify(vouchers));
  },

  getEcoPoints(defaultPoints) {
    const stored = localStorage.getItem('ecopuntos_eco_points');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('ecopuntos_eco_points', JSON.stringify(defaultPoints));
    return defaultPoints;
  },

  saveEcoPoints(points) {
    localStorage.setItem('ecopuntos_eco_points', JSON.stringify(points));
  },

  getCampaigns(defaultCampaigns) {
    const stored = localStorage.getItem('ecopuntos_campaigns');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('ecopuntos_campaigns', JSON.stringify(defaultCampaigns));
    return defaultCampaigns;
  },

  saveCampaigns(campaigns) {
    localStorage.setItem('ecopuntos_campaigns', JSON.stringify(campaigns));
  }
};

/* ══════════════════════════════════════════════════════════════
   ESTADO GLOBAL DE LA APLICACIÓN
   ══════════════════════════════════════════════════════════════ */
const STATE = {
  currentUser: null,
  selectedRewardToRedeem: null,

  // ── Tipos de Residuos Colombia (PGIRS adaptado) ──
  wasteTypes: [
    { id: 'plastico', name: 'Plástico (PET / HDPE)', pointsPerKg: 10, co2PerKg: 1.5, icon: 'fa-bottle-water', unit: 'Kg', cat: 'Plástico' },
    { id: 'vidrio', name: 'Vidrio (Botellas / Frascos)', pointsPerKg: 8, co2PerKg: 0.8, icon: 'fa-wine-bottle', unit: 'Kg', cat: 'Vidrio' },
    { id: 'papel', name: 'Papel y Cartón', pointsPerKg: 5, co2PerKg: 1.2, icon: 'fa-box-archive', unit: 'Kg', cat: 'Papel/Cartón' },
    { id: 'metal', name: 'Metal / Chatarra / Latas', pointsPerKg: 15, co2PerKg: 2.1, icon: 'fa-dumpster', unit: 'Kg', cat: 'Metal' },
    { id: 'raee', name: 'Residuos Electrónicos (RAEE)', pointsPerKg: 50, co2PerKg: 5.0, icon: 'fa-plug', unit: 'Unid', cat: 'Electrónicos' },
    { id: 'aceite', name: 'Aceite de Cocina Usado', pointsPerKg: 20, co2PerKg: 2.8, icon: 'fa-droplet', unit: 'Litros', cat: 'Aceite Usado' },
    { id: 'pilas', name: 'Pilas y Baterías Usadas', pointsPerKg: 40, co2PerKg: 3.5, icon: 'fa-battery-full', unit: 'Unid', cat: 'Pilas' },
    { id: 'llantas', name: 'Llantas Usadas (RESPEL)', pointsPerKg: 30, co2PerKg: 4.2, icon: 'fa-circle-dot', unit: 'Unid', cat: 'Llantas' },
    { id: 'organico', name: 'Residuos Orgánicos Compostables', pointsPerKg: 4, co2PerKg: 0.5, icon: 'fa-apple-whole', unit: 'Kg', cat: 'Orgánico' },
  ],

  // ── Puntos de Reciclaje Colombia ──
  ecoPoints: [
    {
      id: 1,
      name: 'Punto Limpio Chapinero — Bogotá',
      district: 'Chapinero',
      city: 'Bogotá',
      address: 'Cra 7 # 45-20, Chapinero',
      hours: 'Lun - Sáb: 8:00 AM - 5:30 PM',
      status: 'open',
      lat: 4.6504, lng: -74.0584,
      materials: ['Plástico', 'Vidrio', 'Papel/Cartón', 'Metal'],
      manager: 'UAESP Bogotá'
    },
    {
      id: 2,
      name: 'EcoEstación Poblado — Medellín',
      district: 'El Poblado',
      city: 'Medellín',
      address: 'Cra 43A # 7 Sur-110, El Poblado',
      hours: 'Lun - Dom: 8:00 AM - 6:00 PM',
      status: 'open',
      lat: 6.2086, lng: -75.5659,
      materials: ['Plástico', 'Vidrio', 'Electrónicos', 'Aceite Usado'],
      manager: 'Emvarias / EPM Medellín'
    },
    {
      id: 3,
      name: 'Centro de Acopio Cañaveralejo — Cali',
      district: 'Cañaveralejo',
      city: 'Cali',
      address: 'Av. 2N # 22-37, Cañaveralejo',
      hours: 'Mar - Sáb: 9:00 AM - 5:00 PM',
      status: 'open',
      lat: 3.4516, lng: -76.5320,
      materials: ['Plástico', 'Metal', 'Papel/Cartón', 'Llantas'],
      manager: 'DAGMA — Ciudad de Cali'
    },
    {
      id: 4,
      name: 'Punto Verde Kennedy — Bogotá',
      district: 'Kennedy',
      city: 'Bogotá',
      address: 'Cll 38 Sur # 78-42, Kennedy',
      hours: 'Lun - Sáb: 7:30 AM - 4:30 PM',
      status: 'open',
      lat: 4.6099, lng: -74.1476,
      materials: ['Plástico', 'Vidrio', 'Pilas'],
      manager: 'UAESP Bogotá — Localidad Kennedy'
    },
    {
      id: 5,
      name: 'EcoPunto Norte — Barranquilla',
      district: 'Riomar',
      city: 'Barranquilla',
      address: 'Cra 46 # 98-15, Riomar',
      hours: 'Lun - Vie: 8:00 AM - 5:00 PM',
      status: 'closed',
      lat: 10.9985, lng: -74.8184,
      materials: ['Plástico', 'Vidrio', 'Papel/Cartón'],
      manager: 'Triple A Barranquilla'
    },
    {
      id: 6,
      name: 'Punto RAEE Laureles — Medellín',
      district: 'Laureles',
      city: 'Medellín',
      address: 'Cra 80 # 33-08, Laureles',
      hours: 'Mié - Sáb: 10:00 AM - 6:00 PM',
      status: 'open',
      lat: 6.2442, lng: -75.5993,
      materials: ['Electrónicos', 'Pilas', 'Metal'],
      manager: 'Cámara de Comercio Medellín'
    }
  ],

  // ── Historial de Entregas ──
  deliveries: [
    {
      id: 'DEL-CO-9901',
      userId: 'ECO-CO-1001',
      pointName: 'Punto Limpio Chapinero — Bogotá',
      wasteName: 'Plástico (PET / HDPE)',
      amount: 3.5, unit: 'Kg',
      points: 35, co2: 5.25,
      date: '2026-09-11 14:30',
      status: 'approved',
      notes: 'Botellas PET limpias'
    },
    {
      id: 'DEL-CO-9842',
      userId: 'ECO-CO-1001',
      pointName: 'EcoEstación Poblado — Medellín',
      wasteName: 'Vidrio (Botellas / Frascos)',
      amount: 5.0, unit: 'Kg',
      points: 40, co2: 4.0,
      date: '2026-09-08 11:15',
      status: 'approved',
      notes: ''
    },
    {
      id: 'DEL-CO-9780',
      userId: 'ECO-CO-1001',
      pointName: 'Punto RAEE Laureles — Medellín',
      wasteName: 'Residuos Electrónicos (RAEE)',
      amount: 2, unit: 'Unid',
      points: 100, co2: 10.0,
      date: '2026-09-04 16:45',
      status: 'approved',
      notes: 'TV y computador obsoleto'
    },
    {
      id: 'DEL-CO-9701',
      userId: 'ECO-CO-1001',
      pointName: 'Punto Verde Kennedy — Bogotá',
      wasteName: 'Aceite de Cocina Usado',
      amount: 2.5, unit: 'Litros',
      points: 50, co2: 7.0,
      date: '2026-09-02 09:20',
      status: 'pending',
      notes: ''
    }
  ],

  // ── Catálogo de Recompensas (aliados Colombia) ──
  rewards: [
    {
      id: 1,
      title: '1 Viaje Gratis en TransMilenio',
      category: 'transporte',
      cost: 300,
      icon: 'fa-bus',
      color: 'text-amber',
      desc: 'Recarga tu tarjeta Tullave con 1 viaje gratuito en TransMilenio, SITP o Sistema Integrado de Transporte.',
      ally: 'TransMilenio S.A. — Bogotá'
    },
    {
      id: 2,
      title: '10% Dcto. en Supermercados Éxito',
      category: 'descuentos',
      cost: 400,
      icon: 'fa-store',
      color: 'text-blue',
      desc: 'Descuento en compras de productos orgánicos y ecológicos en cualquier Éxito o Carulla del país.',
      ally: 'Grupo Éxito Colombia'
    },
    {
      id: 3,
      title: 'Siembra 1 Árbol en la Amazonía',
      category: 'arboles',
      cost: 500,
      icon: 'fa-tree',
      color: 'text-emerald',
      desc: 'Certificado digital de siembra de 1 árbol nativo colombiano en zonas de restauración de la Amazonía.',
      ally: 'Fundación GreenColombia'
    },
    {
      id: 4,
      title: 'Taza Eco Juan Valdez Café',
      category: 'descuentos',
      cost: 350,
      icon: 'fa-coffee',
      color: 'text-amber',
      desc: '1 café cualquier tamaño y 20% de descuento en productos Juan Valdez a nivel nacional.',
      ally: 'Juan Valdez Café'
    },
    {
      id: 5,
      title: 'Paquete Natura Eco-Cuidado',
      category: 'ecoproductos',
      cost: 800,
      icon: 'fa-leaf',
      color: 'text-teal',
      desc: 'Kit de productos de cuidado personal Natura con envases reciclables y fórmulas biodegradables.',
      ally: 'Natura Colombia'
    },
    {
      id: 6,
      title: '$5.000 Crédito Rappi',
      category: 'descuentos',
      cost: 600,
      icon: 'fa-motorcycle',
      color: 'text-purple',
      desc: 'Crédito de $5.000 COP en tu siguiente pedido de supermercado o farmacia en Rappi Colombia.',
      ally: 'Rappi Colombia'
    },
    {
      id: 7,
      title: 'Bolsa Reutilizable Tela Colombiana',
      category: 'ecoproductos',
      cost: 250,
      icon: 'fa-bag-shopping',
      color: 'text-emerald',
      desc: 'Bolsa ecológica artesanal confeccionada por madres cabeza de hogar en Bogotá.',
      ally: 'Cooperativa EcoManos Colombia'
    },
    {
      id: 8,
      title: '10% en Metro de Medellín / MIO Cali',
      category: 'transporte',
      cost: 280,
      icon: 'fa-train-subway',
      color: 'text-blue',
      desc: 'Bono de recarga con 10% de beneficio en Metro de Medellín o MIO Cali.',
      ally: 'Metro de Medellín / Metrocali'
    }
  ],

  // ── Cupones Canjeados ──
  myVouchers: [],

  // ── Campañas Ecológicas Colombia ──
  campaigns: [
    {
      id: 1,
      title: 'Semana Verde Colombia 2026',
      desc: 'Meta nacional: recolectar 10.000 Kg de residuos durante la Semana del Medio Ambiente. Respaldada por el MADS.',
      target: 10000,
      current: 7340,
      bonusPoints: 300,
      daysLeft: 9,
      joined: true,
      region: 'Nacional'
    },
    {
      id: 2,
      title: 'Bogotá Recicla — Ley 1259',
      desc: 'Campaña Distrital de separación en la fuente. Participa y evita el comparendo ambiental. Meta: 2.000 Kg en Bogotá.',
      target: 2000,
      current: 1450,
      bonusPoints: 200,
      daysLeft: 15,
      joined: false,
      region: 'Bogotá'
    },
    {
      id: 3,
      title: 'Electrotón RAEE — Medellín Recicla',
      desc: 'Trae tus aparatos electrónicos en desuso. Respaldado por el Decreto 284/2018 del MADS.',
      target: 500,
      current: 210,
      bonusPoints: 400,
      daysLeft: 22,
      joined: false,
      region: 'Medellín'
    }
  ],

  // ── Ranking Nacional Colombia ──
  leaderboard: [
    { rank: 1, name: 'Sofía Martínez', avatar: 'SM', city: 'Bogotá', weightKg: 84.5, points: 2890, level: 'Héroe Ecológico' },
    { rank: 2, name: 'Juan Rodríguez', avatar: 'JR', city: 'Bogotá', weightKg: 58.2, points: 1450, level: 'Reciclador Bronce' },
    { rank: 3, name: 'Mateo Quispe', avatar: 'MQ', city: 'Medellín', weightKg: 49.0, points: 1320, level: 'Reciclador Plata' },
    { rank: 4, name: 'Camila Ospina', avatar: 'CO', city: 'Cali', weightKg: 41.2, points: 1100, level: 'Reciclador Plata' },
    { rank: 5, name: 'Diego Pedraza', avatar: 'DP', city: 'Bucaramanga', weightKg: 35.8, points: 950, level: 'Reciclador Bronce' },
    { rank: 6, name: 'Laura Cardona', avatar: 'LC', city: 'Manizales', weightKg: 28.3, points: 720, level: 'Semilla Verde' },
  ],

  // ── Medallas Colombia ──
  badges: [
    { id: 1, title: 'Primer Kilo Reciclado', icon: 'fa-seedling', unlocked: true, desc: 'Entregaste tu primera libra de material reciclable.' },
    { id: 2, title: 'Maestro del PET', icon: 'fa-bottle-water', unlocked: true, desc: 'Superaste 20 Kg de plástico PET recolectado.' },
    { id: 3, title: 'Defensor del Bosque', icon: 'fa-tree', unlocked: true, desc: 'Canjeaste la siembra de un árbol en la Amazonía.' },
    { id: 4, title: 'Héroe del RAEE', icon: 'fa-plug', unlocked: false, desc: 'Entregaste más de 5 aparatos electrónicos obsoletos.' },
    { id: 5, title: 'Eco Héroe del Mes', icon: 'fa-award', unlocked: false, desc: 'Alcanza el Top 3 del Ranking mensual nacional.' },
    { id: 6, title: 'Separador Responsable', icon: 'fa-recycle', unlocked: true, desc: 'Realizaste 3 entregas de diferentes materiales.' },
  ],

  // ── Notificaciones ──
  notifications: [
    { id: 1, icon: '', text: 'Campaña "Semana Verde Colombia" activa. ¡Únete!', time: 'Hace 2h', read: false },
    { id: 2, icon: '', text: 'Tu entrega DEL-CO-9901 fue aprobada. +35 EcoPuntos acreditados.', time: 'Ayer', read: false },
    { id: 3, icon: '', text: 'Subiste al puesto #2 en el Ranking Nacional.', time: 'Hace 3 días', read: true },
  ]
};

/* ══════════════════════════════════════════════════════════════
   MÓDULO: AUTENTICACIÓN
   ══════════════════════════════════════════════════════════════ */
const auth = {
  async login(e) {
    e.preventDefault();
    const email = document.getElementById('loginDoc').value.trim();
    const pass = document.getElementById('loginPass').value;
    const errDiv = document.getElementById('loginError');
    const btn = e.target.querySelector('button[type=submit]') || e.target.querySelector('button');

    if (btn) btn.disabled = true;
    try {
      const user = await apiClient.auth.login(email, pass);
      errDiv.style.display = 'none';
      this._startSession(user);
      // Load real ecopoints from backend
      await this._loadAppData();
    } catch (err) {
      errDiv.textContent = ` ${err.message || 'Credenciales incorrectas.'}`;
      errDiv.style.display = 'block';
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  async register(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regDoc').value.trim(); // Campo doc ahora es email
    const city = document.getElementById('regCity').value;
    const pass = document.getElementById('regPass').value;
    const role = 'citizen'; // Todo usuario registrado públicamente es Ciudadano
    const errDiv = document.getElementById('registerError');
    const btn = e.target.querySelector('button[type=submit]') || e.target.querySelector('button');

    if (!name || !email || !pass) {
      errDiv.textContent = ' Nombre, email y contraseña son requeridos.';
      errDiv.style.display = 'block';
      return;
    }

    if (btn) btn.disabled = true;
    try {
      const user = await apiClient.auth.register(name, email, pass, role, city);
      errDiv.style.display = 'none';
      this._startSession(user);
      await this._loadAppData();
      ui.showToast(` ¡Bienvenido/a a EcoPuntos Pamplona!`);
    } catch (err) {
      errDiv.textContent = ` ${err.message || 'Error en el registro.'}`;
      errDiv.style.display = 'block';
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  async _loadAppData() {
    try {
      // Sincronizar el perfil real y balance de puntos desde la base de datos PostgreSQL
      if (window.apiClient && localStorage.getItem('ecopuntos_jwt')) {
        const freshUser = await apiClient.auth.getProfile();
        if (freshUser) {
          STATE.currentUser = freshUser;
          localStorage.setItem('ecopuntos_session', JSON.stringify(freshUser));
        }
      }
      // Cargar ecopuntos reales de Pamplona
      const points = await apiClient.ecopoints.getAll('Pamplona');
      if (points && points.length) STATE.ecoPoints = points;
      // Cargar ranking real
      const ranking = await apiClient.ranking.getTop(10);
      if (ranking && ranking.length) STATE.leaderboard = ranking;
      // Cargar recompensas reales
      const rewards = await apiClient.rewards.getAll();
      if (rewards && rewards.length) STATE.rewards = rewards;
    } catch (err) {
      console.warn('Could not load live data, using defaults:', err.message);
    }
  },

  _startSession(user) {
    STATE.currentUser = user;
    localStorage.setItem('ecopuntos_session', JSON.stringify(user));
    this._applyRoleToBody(user.role);
    ui.showApp();
    ui.renderAll();
  },

  logout() {
    STATE.currentUser = null;
    apiClient.auth.logout();
    localStorage.removeItem('ecopuntos_session');
    document.body.className = '';
    document.getElementById('app').style.display = 'none';
    document.getElementById('authScreen').classList.add('active');
    const qrDiv = document.getElementById('qrcodeDisplay');
    if (qrDiv) qrDiv.innerHTML = '';
    ui.closeAllPanels();
    ui.showToast('Sesión cerrada correctamente.');
  },

  changeRole(newRole) {
    if (!STATE.currentUser) return;
    STATE.currentUser.role = newRole;
    localStorage.setItem('ecopuntos_session', JSON.stringify(STATE.currentUser));
    this._applyRoleToBody(newRole);
    const menu = document.getElementById('profileMenu');
    if (menu) menu.style.display = 'none';
    ui.renderAll();
    ui.showToast(` Rol cambiado a: ${ui.roleName(newRole)}`);
  },

  _applyRoleToBody(role) {
    document.body.className = `role-${role}`;
  },

  async checkSession() {
    const token = localStorage.getItem('ecopuntos_jwt');
    if (!token) return false;
    try {
      const user = await apiClient.auth.getProfile();
      STATE.currentUser = user;
      this._applyRoleToBody(user.role);
      return true;
    } catch {
      // Token expired or invalid
      apiClient.auth.logout();
      localStorage.removeItem('ecopuntos_session');
      return false;
    }
  }
};

/* ══════════════════════════════════════════════════════════════
   MÓDULO: MAPA LEAFLET CON GPS REAL
   ══════════════════════════════════════════════════════════════ */
const mapModule = {
  map: null,
  markers: [],
  initialized: false,

  async initMap() {
    if (this.initialized) return;
    const mapDiv = document.getElementById('leafletMap');
    if (!mapDiv || typeof L === 'undefined') return;

    // Centro en Pamplona, Norte de Santander
    this.map = L.map('leafletMap', { zoomControl: true, attributionControl: false })
      .setView([7.3782, -72.6475], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Load real ecopoints from backend
    try {
      const livePoints = await apiClient.ecopoints.getAll('Pamplona');
      if (livePoints && livePoints.length) STATE.ecoPoints = livePoints;
    } catch (err) {
      console.warn('Map using cached ecopoints:', err.message);
    }

    this.renderMarkers(STATE.ecoPoints);
    this.initialized = true;
    setTimeout(() => this.map.invalidateSize(), 200);
  },

  renderMarkers(pointsList) {
    if (!this.map || typeof L === 'undefined') return;
    // Limpiar marcadores anteriores
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    const ecoIcon = L.divIcon({
      className: '',
      html: `<div style="background:#059669;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"><i class="fa-solid fa-recycle"></i></div>`,
      iconSize: [32, 32], iconAnchor: [16, 16]
    });

    const closedIcon = L.divIcon({
      className: '',
      html: `<div style="background:#6b7280;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"><i class="fa-solid fa-recycle"></i></div>`,
      iconSize: [30, 30], iconAnchor: [15, 15]
    });

    pointsList.forEach(point => {
      const icon = point.status === 'open' ? ecoIcon : closedIcon;
      const marker = L.marker([point.lat, point.lng], { icon })
        .addTo(this.map)
        .bindPopup(`
          <div style="font-family:Outfit,sans-serif;min-width:170px;">
            <strong style="font-size:.9rem;">${point.name}</strong><br>
            <span style="font-size:.75rem;color:#6b7280;">${point.address}</span><br>
            <span style="font-size:.75rem;color:${point.status === 'open' ? '#10b981' : '#ef4444'}; font-weight:bold;">
              ${point.status === 'open' ? ' Abierto' : ' Cerrado'}
            </span><br>
            <span style="font-size:.72rem;color:#6b7280;">${point.hours}</span><br>
            <a href="https://maps.google.com/?q=${point.lat},${point.lng}" target="_blank" style="font-size:.72rem;color:#059669;text-decoration:none;font-weight:bold;"> Ver dirección en GPS</a>
          </div>
        `);
      this.markers.push(marker);
    });
  },

  centerOnUser() {
    if (!navigator.geolocation) {
      ui.showToast(' Tu dispositivo no soporta geolocalización.');
      return;
    }

    ui.showToast(' Obteniendo tu ubicación GPS...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        this.map.setView([latitude, longitude], 14);

        const userIcon = L.divIcon({
          className: '',
          html: `<div style="background:#ef4444;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px rgba(239,68,68,.6);"></div>`,
          iconSize: [16, 16], iconAnchor: [8, 8]
        });
        L.marker([latitude, longitude], { icon: userIcon })
          .addTo(this.map)
          .bindPopup('<strong> Tu ubicación actual</strong>')
          .openPopup();

        // Load nearby ecopoints via PostGIS
        try {
          const nearby = await apiClient.ecopoints.getNearby(latitude, longitude, 5000);
          if (nearby && nearby.length) {
            STATE.ecoPoints = nearby;
            this.renderMarkers(nearby);
            ui.showToast(` GPS activo. ${nearby.length} puntos ecológicos cercanos encontrados.`);
          } else {
            ui.showToast(' Ubicación GPS activada. No hay puntos en 5km.');
          }
        } catch {
          ui.showToast(' Ubicación GPS activada correctamente.');
        }
      },
      (err) => {
        ui.showToast(' No se pudo obtener la ubicación. Permiso denegado.');
      }
    );
  }
};

/* ══════════════════════════════════════════════════════════════
   MÓDULO: UI — Renderizado y Navegación
   ══════════════════════════════════════════════════════════════ */
const ui = {
  showApp() {
    document.getElementById('authScreen').classList.remove('active');
    document.getElementById('app').style.display = 'flex';
    document.getElementById('app').style.flexDirection = 'column';
  },

  initTheme() {
    const saved = localStorage.getItem('ecopuntos-theme') || 'dark';
    document.body.classList.toggle('theme-dark', saved === 'dark');
    this._updateThemeIcon(saved === 'dark');
  },

  toggleTheme() {
    const isDark = document.body.classList.toggle('theme-dark');
    localStorage.setItem('ecopuntos-theme', isDark ? 'dark' : 'light');
    this._updateThemeIcon(isDark);
  },

  _updateThemeIcon(isDark) {
    const btn = document.getElementById('btnThemeToggle');
    if (btn) btn.innerHTML = isDark
      ? '<i class="fa-solid fa-moon"></i>'
      : '<i class="fa-solid fa-sun"></i>';
  },

  showAuthTab(tab) {
    document.getElementById('loginForm').style.display = tab === 'login' ? 'flex' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'flex' : 'none';
    document.getElementById('authTabLogin').classList.toggle('active', tab === 'login');
    document.getElementById('authTabRegister').classList.toggle('active', tab === 'register');
  },

  togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
  },

  switchTab(tabId, btnElement = null) {
    const role = STATE.currentUser?.role;
    if (tabId === 'tabAdmin' && role !== 'admin') {
      this.showToast('Acceso denegado: Se requieren permisos de Administrador.');
      return;
    }
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
    if (btnElement) {
      document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('active'));
      btnElement.classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  switchSubtab(subId, btnEl) {
    document.querySelectorAll('.subtab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    document.getElementById(`subtab${subId.charAt(0).toUpperCase() + subId.slice(1)}`).classList.add('active');
  },

  renderAll() {
    this.renderUserSummary();
    this.renderWasteSelects();
    this.renderPointsSelectInModal();
    this.renderFeaturedCampaign();
    this.renderRecentDeliveries();
    this.renderPointsList();
    this.renderDeliveriesList();
    this.renderMyVouchers();
    this.renderRewardsGrid();
    this.renderLeaderboard();
    this.renderCampaignsList();
    this.renderBadges();
    this.renderNotifications();
    this.renderAdminPanel();
    this.renderRoleDock();
    this.renderRoleHome();
    this.updateEcoCalculator();
    app.updateDeliveryCalc();
    charts.initImpactChart();
    app.generateUserQrCode();
  },

  renderUserSummary() {
    const u = STATE.currentUser;
    if (!u) return;
    document.getElementById('userName').textContent = u.name;
    document.getElementById('userAvatar').textContent = u.avatar;
    document.getElementById('headerAvatar').textContent = u.avatar;
    document.getElementById('pmAvatar').textContent = u.avatar;
    document.getElementById('pmName').textContent = u.name;
    document.getElementById('pmRoleTag').textContent = this.roleName(u.role);
    document.getElementById('userPointsBalance').textContent = u.points.toLocaleString('es-CO');
    document.getElementById('userCo2Saved').textContent = u.co2Saved.toFixed(1);
    document.getElementById('userCityTag').textContent = ` ${u.city}`;
    document.getElementById('rewardsCurrentBalance').textContent = `${u.points.toLocaleString('es-CO')} pts`;

    // Nivel basado en puntos
    const level = this._getLevel(u.points);
    document.getElementById('userLevelBadge').innerHTML = `<i class="fa-solid fa-medal"></i> ${level}`;

    // Rol selector en menú de perfil
    const roleSelector = document.getElementById('roleSelectorMenu');
    if (roleSelector) roleSelector.value = u.role;
  },

  _getLevel(pts) {
    if (pts >= 5000) return 'Héroe Ecológico ';
    if (pts >= 2000) return 'Reciclador Oro ';
    if (pts >= 1000) return 'Reciclador Plata ';
    if (pts >= 500) return 'Reciclador Bronce ';
    if (pts >= 100) return 'Semilla Verde ';
    return 'Nuevo Reciclador';
  },

  roleName(role) {
    return { citizen: 'Ciudadano/a', worker: 'Gestor de Punto', admin: 'Administrador' }[role] || role;
  },

  renderWasteSelects() {
    const opts = STATE.wasteTypes.map(w => `<option value="${w.id}">${w.name} (+${w.pointsPerKg} pts/${w.unit})</option>`).join('');
    ['calcWasteType', 'delWasteSelect'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = opts;
    });
  },

  renderPointsSelectInModal() {
    const sel = document.getElementById('delPointSelect');
    if (!sel) return;
    sel.innerHTML = STATE.ecoPoints.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
  },

  renderFeaturedCampaign() {
    const c = STATE.campaigns[0];
    const el = document.getElementById('featuredCampaignCard');
    if (!c || !el) return;
    const pct = Math.min(100, Math.round((c.current / c.target) * 100));
    el.innerHTML = `
      <span class="campaign-tag"><i class="fa-solid fa-fire"></i> ${c.region}</span>
      <h4>${c.title}</h4>
      <p>${c.desc}</p>
      <div class="progress-bar-wrapper"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      <div class="campaign-meta">
        <span><strong>${c.current.toLocaleString('es-CO')}</strong> / ${c.target.toLocaleString('es-CO')} Kg</span>
        <span>Bonus: <strong class="text-amber">+${c.bonusPoints} pts</strong></span>
      </div>
    `;
  },

  updateEcoCalculator() {
    const wasteId = document.getElementById('calcWasteType')?.value || 'plastico';
    const weight = parseFloat(document.getElementById('calcWeight')?.value) || 1;
    const waste = STATE.wasteTypes.find(w => w.id === wasteId);
    if (!waste) return;
    const pts = Math.round(weight * waste.pointsPerKg);
    const co2 = (weight * waste.co2PerKg).toFixed(2);
    document.getElementById('calcPointsRes').textContent = `+${pts} pts`;
    document.getElementById('calcCo2Res').textContent = `${co2} kg`;
  },

  renderPointsList(searchQuery = '', materialFilter = 'all') {
    const list = document.getElementById('pointsCardsList');
    if (!list) return;
    let points = STATE.ecoPoints;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      points = points.filter(p => p.name.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.address.toLowerCase().includes(q));
    }
    if (materialFilter !== 'all') {
      points = points.filter(p => p.materials.some(m => m.toLowerCase().includes(materialFilter.toLowerCase())));
    }
    if (!points.length) {
      list.innerHTML = `<p class="text-muted text-center py-4">No se encontraron puntos ecológicos con ese criterio.</p>`;
      return;
    }
    list.innerHTML = points.map(p => `
      <div class="point-card">
        <div class="point-card-header">
          <div class="point-card-title">${p.name}</div>
          <span class="point-status-tag ${p.status === 'open' ? 'status-open' : 'status-closed'}">
            ${p.status === 'open' ? ' Abierto' : ' Cerrado'}
          </span>
        </div>
        <div class="point-card-info">
          <span><i class="fa-solid fa-location-dot text-emerald"></i> ${p.address} · ${p.city}</span>
          <span><i class="fa-regular fa-clock text-amber"></i> ${p.hours}</span>
          <span><i class="fa-solid fa-user text-blue"></i> ${p.manager}</span>
        </div>
        <div class="point-materials-accepted">
          ${p.materials.map(m => `<span class="material-tag">${m}</span>`).join('')}
        </div>
      </div>
    `).join('');
  },

  renderRecentDeliveries() {
    const list = document.getElementById('recentDeliveriesList');
    if (!list) return;
    const role = STATE.currentUser?.role;
    const userId = STATE.currentUser?.id;
    // Admin y Gestor ven todas las entregas; ciudadano solo las suyas
    const deliveries = (role === 'admin' || role === 'worker')
      ? STATE.deliveries.slice(0, 4)
      : STATE.deliveries.filter(d => d.userId === userId).slice(0, 4);
    list.innerHTML = deliveries.length ? deliveries.map(d => this._deliveryCardHtml(d)).join('') : `<p class="text-muted">Aún no hay entregas registradas.</p>`;
  },

  renderDeliveriesList(filterStatus = 'all') {
    const list = document.getElementById('deliveriesFullList');
    if (!list) return;
    const role = STATE.currentUser?.role;
    const userId = STATE.currentUser?.id;
    // Admin y Gestor ven todas las entregas; ciudadano solo las suyas
    let items = (role === 'admin' || role === 'worker')
      ? STATE.deliveries
      : STATE.deliveries.filter(d => d.userId === userId);
    if (filterStatus !== 'all') items = items.filter(i => i.status === filterStatus);
    list.innerHTML = items.length ? items.map(d => this._deliveryCardHtml(d, true)).join('') : `<p class="text-muted">No hay entregas con ese filtro.</p>`;
  },

  _deliveryCardHtml(d, detailed = false) {
    const role = STATE.currentUser?.role;
    const canApprove = (role === 'admin' || role === 'worker') && d.status === 'pending';
    const ownerName = DB.getUsers().find(u => u.id === d.userId)?.name || d.userId;
    return `
      <div class="delivery-item-card">
        <div class="del-item-icon"><i class="fa-solid fa-box-open text-emerald"></i></div>
        <div class="del-item-details">
          <h5>${d.wasteName} — ${d.amount} ${d.unit}</h5>
          <p>${d.pointName}</p>
          ${detailed ? `<p class="text-muted"><i class="fa-regular fa-clock"></i> ${d.date} · ID: ${d.id}</p>` : ''}
          ${(role === 'admin' || role === 'worker') ? `<p class="text-muted" style="font-size:.68rem;"> ${ownerName}</p>` : ''}
        </div>
        <div class="del-item-right">
          <div class="del-points">+${d.points} pts</div>
          <span class="del-status-text ${d.status === 'approved' ? 'text-emerald' : 'text-amber'}">
            ${d.status === 'approved' ? ' Aprobada' : '⏳ Pendiente'}
          </span>
          ${canApprove ? `
            <div style="display:flex;gap:4px;margin-top:5px;">
              <button class="btn btn-sm btn-emerald" onclick="app.approveDelivery('${d.id}')"> Aprobar</button>
              <button class="btn btn-sm btn-danger" onclick="app.rejectDelivery('${d.id}')"></button>
            </div>` : ''}
        </div>
      </div>`;
  },

  renderMyVouchers() {
    const container = document.getElementById('myVouchersSlider');
    if (!container) return;
    container.innerHTML = STATE.myVouchers.length
      ? STATE.myVouchers.map(v => `
          <div class="voucher-card">
            <div style="font-size:.78rem;font-weight:700;">${v.rewardTitle}</div>
            <div class="voucher-code">${v.code}</div>
            <div style="font-size:.68rem;color:rgba(255,255,255,.5);">${v.ally}</div>
            <div style="font-size:.65rem;color:rgba(255,255,255,.4);">Canjeado: ${v.redeemedDate}</div>
          </div>
        `).join('')
      : `<div style="font-size:.78rem;color:var(--text-muted);padding:10px 0;">Aún no has canjeado cupones.</div>`;
  },

  renderRewardsGrid(catFilter = 'all') {
    const grid = document.getElementById('rewardsGrid');
    if (!grid) return;
    let rewards = catFilter === 'all' ? STATE.rewards : STATE.rewards.filter(r => r.category === catFilter);
    grid.innerHTML = rewards.map(r => `
      <div class="reward-card">
        <div class="reward-img-icon"><i class="fa-solid ${r.icon} ${r.color}"></i></div>
        <div class="reward-title">${r.title}</div>
        <div class="reward-ally">${r.ally}</div>
        <div class="reward-cost"><i class="fa-solid fa-coins"></i> ${r.cost} pts</div>
        <button class="btn btn-sm btn-emerald" style="margin-top:auto;" onclick="app.openRewardModal(${r.id})">Canjear</button>
      </div>
    `).join('');
  },

  renderLeaderboard() {
    const podium = document.getElementById('podiumContainer');
    const listEl = document.getElementById('rankingList');
    if (!podium || !listEl) return;

    const sorted = [...STATE.leaderboard].sort((a, b) => b.points - a.points);
    sorted.forEach((it, i) => it.rank = i + 1);
    const [p1, p2, p3] = sorted;

    podium.innerHTML = `
      <div class="podium-item">
        <div class="podium-avatar" style="background:#475569;"><span class="podium-rank-badge"></span>${p2?.avatar}</div>
        <div class="podium-pillar p-silver"><span>#2</span><span style="font-size:.65rem;">${(p2?.points || 0).toLocaleString('es-CO')}</span></div>
      </div>
      <div class="podium-item">
        <div class="podium-avatar" style="background:#d97706;width:52px;height:52px;font-size:1.1rem;"><span class="podium-rank-badge"></span>${p1?.avatar}</div>
        <div class="podium-pillar p-gold"><span>#1</span><span style="font-size:.7rem;">${(p1?.points || 0).toLocaleString('es-CO')}</span></div>
      </div>
      <div class="podium-item">
        <div class="podium-avatar" style="background:#78350f;"><span class="podium-rank-badge"></span>${p3?.avatar}</div>
        <div class="podium-pillar p-bronze"><span>#3</span><span style="font-size:.65rem;">${(p3?.points || 0).toLocaleString('es-CO')}</span></div>
      </div>
    `;

    listEl.innerHTML = sorted.map(it => {
      const isMe = it.name.includes(STATE.currentUser?.name.split(' ')[0]);
      return `
        <div class="ranking-list-row ${isMe ? 'user-row' : ''}">
          <div><strong>#${it.rank}</strong></div>
          <div><div>${it.name}${isMe ? ' ' : ''}</div><div class="text-muted" style="font-size:.65rem;">${it.city}</div></div>
          <div>${it.weightKg.toFixed(1)} Kg</div>
          <div class="text-emerald"><strong>${it.points.toLocaleString('es-CO')}</strong></div>
        </div>`;
    }).join('');
  },

  renderCampaignsList() {
    const list = document.getElementById('campaignsFullList');
    if (!list) return;
    list.innerHTML = STATE.campaigns.map(c => {
      const pct = Math.min(100, Math.round((c.current / c.target) * 100));
      return `
        <div class="campaign-featured-card mb-3">
          <span class="campaign-tag">${c.region}</span>
          <h4>${c.title}</h4>
          <p>${c.desc}</p>
          <div class="progress-bar-wrapper"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
          <div class="campaign-meta" style="margin:6px 0;">
            <span>Progreso: <strong>${c.current.toLocaleString('es-CO')} / ${c.target.toLocaleString('es-CO')} Kg</strong></span>
            <span>Bonus: <strong class="text-amber">+${c.bonusPoints} pts</strong></span>
          </div>
          <button class="btn btn-sm ${c.joined ? 'btn-secondary' : 'btn-emerald'} btn-full" onclick="app.toggleJoinCampaign(${c.id})">
            ${c.joined ? ' Participando' : '+ Unirme a la campaña'}
          </button>
        </div>`;
    }).join('');
  },

  renderBadges() {
    const grid = document.getElementById('badgesGrid');
    if (!grid) return;
    grid.innerHTML = STATE.badges.map(b => `
      <div class="badge-card ${b.unlocked ? '' : 'locked'}">
        <div class="badge-icon"><i class="fa-solid ${b.icon}"></i></div>
        <div class="badge-name">${b.title}</div>
        <div class="badge-desc">${b.desc}</div>
        <span style="font-size:.65rem;color:${b.unlocked ? '#10b981' : '#94a3b8'};font-weight:700;">
          ${b.unlocked ? ' Desbloqueada' : ' Bloqueada'}
        </span>
      </div>
    `).join('');
  },

  renderNotifications() {
    const list = document.getElementById('notifList');
    if (!list) return;
    const unread = STATE.notifications.filter(n => !n.read).length;
    const dot = document.getElementById('notifDot');
    if (dot) dot.classList.toggle('active', unread > 0);

    list.innerHTML = STATE.notifications.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <div class="notif-item-icon">${n.icon}</div>
        <div class="notif-item-text">
          <div>${n.text}</div>
          <div class="notif-item-time">${n.time}</div>
        </div>
      </div>
    `).join('');
  },

  markAllNotifRead() {
    STATE.notifications.forEach(n => n.read = true);
    this.renderNotifications();
    this.toggleNotifPanel();
  },

  async renderAdminPanel() {
    const u = STATE.currentUser;
    if (!u || u.role !== 'admin') return;

    // Métricas
    try {
      if (window.apiClient) {
        const metrics = await apiClient.admin.getMetrics();
        if (metrics) {
          document.getElementById('adminTotalUsers').textContent = metrics.totalUsers || 0;
          document.getElementById('adminTotalDeliveries').textContent = metrics.totalDeliveries || 0;
          document.getElementById('adminTotalKg').textContent = (metrics.totalPoints / 10).toFixed(1);
          document.getElementById('adminTotalCo2').textContent = (metrics.totalCo2SavedKg || 0).toFixed(1);
        }
      }
    } catch (err) {
      console.warn('Using local metrics fallback');
    }

    // Entregas pendientes
    const pending = STATE.deliveries.filter(d => d.status === 'pending');
    document.getElementById('pendingCountBadge').textContent = pending.length;

    const pendingList = document.getElementById('adminPendingList');
    if (pendingList) {
      pendingList.innerHTML = pending.length ? pending.map(d => `
        <div class="admin-pending-card">
          <h5>⏳ ${d.wasteName} — ${d.amount} ${d.unit}</h5>
          <p>${d.pointName} · ${d.date} · ID: ${d.id}</p>
          <div class="admin-pending-actions">
            <button class="btn btn-sm btn-emerald" onclick="app.approveDelivery('${d.id}')"> Aprobar</button>
            <button class="btn btn-sm btn-danger" onclick="app.rejectDelivery('${d.id}')"> Rechazar</button>
          </div>
        </div>
      `).join('') : `<p class="text-muted">No hay entregas pendientes.</p>`;
    }

    // Lista de Gestores Autorizados
    const gestoresList = document.getElementById('adminGestoresList');
    if (gestoresList) {
      try {
        if (window.apiClient) {
          const gestores = await apiClient.admin.getGestores();
          gestoresList.innerHTML = gestores.length ? gestores.map(g => `
            <div class="admin-user-card" style="background:var(--bg-card);padding:10px;border-radius:var(--radius-sm);margin-bottom:8px;border:1px solid var(--border-color);display:flex;align-items:center;gap:10px;">
              <div class="admin-user-ava" style="background:#f59e0b;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;"><i class="fa-solid fa-user-shield"></i></div>
              <div class="admin-user-info" style="flex:1;">
                <h5 style="margin:0;font-size:0.9rem;">${g.name}</h5>
                <p style="margin:2px 0 0;font-size:0.75rem;color:var(--text-muted);">${g.email} · Gestor de Punto (${g.default_city})</p>
              </div>
            </div>
          `).join('') : `<p class="text-muted">No hay gestores de punto registrados aún.</p>`;
        }
      } catch (err) {
        gestoresList.innerHTML = `<p class="text-muted">Inicia sesión como administrador para ver gestores.</p>`;
      }
    }

    charts.initAdminChart();
  },

  toggleNotifPanel(e) {
    if (e) e.stopPropagation();
    const panel = document.getElementById('notifPanel');
    const profileMenu = document.getElementById('profileMenu');
    if (!panel) return;
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
    if (profileMenu) profileMenu.style.display = 'none';
  },

  toggleProfileMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('profileMenu');
    const notif = document.getElementById('notifPanel');
    if (!menu) return;
    const isOpen = menu.style.display !== 'none';
    menu.style.display = isOpen ? 'none' : 'block';
    if (notif) notif.style.display = 'none';
  },

  closeAllPanels() {
    ['notifPanel', 'profileMenu'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  },

  // ── Renderizado dinámico del Dock según rol ──
  renderRoleDock() {
    const role = STATE.currentUser?.role;
    const dock = document.getElementById('mobileDock');
    if (!dock) return;

    if (role === 'citizen') {
      dock.innerHTML = `
        <button class="dock-item active" id="dockHome" onclick="ui.switchTab('tabHome', this)">
          <i class="fa-solid fa-house"></i><span>Inicio</span>
        </button>
        <button class="dock-item" id="dockPoints" onclick="ui.switchTab('tabPoints', this); mapModule.initMap();">
          <i class="fa-solid fa-location-dot"></i><span>Puntos</span>
        </button>
        <button class="dock-item dock-center-btn" id="dockRecycle" onclick="ui.switchTab('tabDeliveries', this); app.openDeliveryModal();">
          <div class="dock-circle-icon"><i class="fa-solid fa-recycle"></i></div>
          <span>Reciclar</span>
        </button>
        <button class="dock-item" id="dockRewards" onclick="ui.switchTab('tabRewards', this)">
          <i class="fa-solid fa-gift"></i><span>Premios</span>
        </button>
        <button class="dock-item" id="dockRanking" onclick="ui.switchTab('tabCampaigns', this)">
          <i class="fa-solid fa-trophy"></i><span>Ranking</span>
        </button>`;
    } else if (role === 'worker') {
      dock.innerHTML = `
        <button class="dock-item active" id="dockHome" onclick="ui.switchTab('tabHome', this)">
          <i class="fa-solid fa-house"></i><span>Inicio</span>
        </button>
        <button class="dock-item dock-center-btn" id="dockScan" onclick="ui.switchTab('tabDeliveries', this); app.openScannerModal();">
          <div class="dock-circle-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
            <i class="fa-solid fa-camera"></i>
          </div>
          <span>Escanear</span>
        </button>
        <button class="dock-item" id="dockDeliveries" onclick="ui.switchTab('tabDeliveries', this)">
          <i class="fa-solid fa-box-open"></i><span>Entregas</span>
        </button>
        <button class="dock-item" id="dockPoints" onclick="ui.switchTab('tabPoints', this); mapModule.initMap();">
          <i class="fa-solid fa-location-dot"></i><span>Mapa</span>
        </button>`;
    } else if (role === 'admin') {
      dock.innerHTML = `
        <button class="dock-item active" id="dockHome" onclick="ui.switchTab('tabHome', this)">
          <i class="fa-solid fa-house"></i><span>Inicio</span>
        </button>
        <button class="dock-item" id="dockAdmin" onclick="ui.switchTab('tabAdmin', this)">
          <i class="fa-solid fa-gauge-high"></i><span>Panel</span>
        </button>
        <button class="dock-item dock-center-btn" id="dockScan" onclick="ui.switchTab('tabDeliveries', this); app.openScannerModal();">
          <div class="dock-circle-icon" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9)">
            <i class="fa-solid fa-camera"></i>
          </div>
          <span>Escanear</span>
        </button>
        <button class="dock-item" id="dockDeliveries" onclick="ui.switchTab('tabDeliveries', this)">
          <i class="fa-solid fa-box-open"></i><span>Entregas</span>
        </button>
        <button class="dock-item" id="dockUsers" onclick="ui.switchTab('tabCampaigns', this)">
          <i class="fa-solid fa-users"></i><span>Usuarios</span>
        </button>`;
    }
  },

  // ── Renderiza contenido de Inicio según rol ──
  renderRoleHome() {
    const role = STATE.currentUser?.role;
    const banner = document.getElementById('roleBannerSection');
    if (!banner) return;

    if (role === 'citizen') {
      banner.innerHTML = `
        <div class="role-info-banner citizen-banner">
          <div class="role-banner-icon"><i class="fa-solid fa-recycle"></i></div>
          <div>
            <div class="role-banner-title"> Hola, reciclador/a</div>
            <div class="role-banner-sub">Entrega tus residuos en puntos ecológicos certificados y acumula EcoPuntos.</div>
          </div>
        </div>`;
    } else if (role === 'worker') {
      const myPending = STATE.deliveries.filter(d => d.status === 'pending').length;
      banner.innerHTML = `
        <div class="role-info-banner worker-banner">
          <div class="role-banner-icon"><i class="fa-solid fa-hard-hat"></i></div>
          <div style="flex:1">
            <div class="role-banner-title"> Modo Gestor de Punto</div>
            <div class="role-banner-sub">Escanea códigos QR de recicladores y aprueba sus entregas.</div>
            ${myPending > 0 ? `<div style="margin-top:6px;font-size:.78rem;color:#fbbf24;font-weight:700;"><i class="fa-solid fa-clock"></i> ${myPending} entrega(s) pendientes de aprobación</div>` : ''}
          </div>
          <button class="btn btn-amber" style="flex-shrink:0" onclick="app.openScannerModal()">
            <i class="fa-solid fa-camera"></i> Escanear
          </button>
        </div>`;
    } else if (role === 'admin') {
      const totalPts = DB.getUsers().reduce((s, u) => s + u.points, 0);
      const pendingCount = STATE.deliveries.filter(d => d.status === 'pending').length;
      banner.innerHTML = `
        <div class="role-info-banner admin-banner">
          <div class="role-banner-icon"><i class="fa-solid fa-shield-halved"></i></div>
          <div style="flex:1">
            <div class="role-banner-title"> Administrador PGIRS</div>
            <div class="role-banner-sub">Gestionas el programa de reciclaje a nivel nacional.</div>
            <div style="display:flex;gap:12px;margin-top:6px;font-size:.75rem;">
              <span><strong class="text-emerald">${STATE.deliveries.length}</strong> entregas totales</span>
              <span><strong class="text-amber">${pendingCount}</strong> pendientes</span>
              <span><strong class="text-blue">${DB.getUsers().length}</strong> usuarios</span>
            </div>
          </div>
          <button class="btn btn-primary" style="flex-shrink:0" onclick="ui.switchTab('tabAdmin')">
            <i class="fa-solid fa-gauge-high"></i> Panel
          </button>
        </div>`;
    }
  },

  showToast(message) {
    const toast = document.getElementById('toastNotification');
    const msg = document.getElementById('toastMessage');
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.classList.add('active');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('active'), 3500);
  }
};

/* ══════════════════════════════════════════════════════════════
   MÓDULO: GRÁFICOS (Chart.js)
   ══════════════════════════════════════════════════════════════ */
const charts = {
  impactChart: null,
  adminChart: null,

  initImpactChart() {
    const ctx = document.getElementById('impactChart')?.getContext('2d');
    if (!ctx) return;
    if (this.impactChart) { this.impactChart.destroy(); this.impactChart = null; }
    this.impactChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Plástico', 'Vidrio', 'RAEE', 'Papel', 'Aceite Cocina'],
        datasets: [{ data: [15.5, 12.0, 8.0, 10.5, 2.5], backgroundColor: ['#10b981', '#0284c7', '#7c3aed', '#f59e0b', '#ec4899'], borderWidth: 0 }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#7d92b0', font: { size: 10, family: 'Outfit' } } } } }
    });
  },

  initAdminChart() {
    const ctx = document.getElementById('adminChart')?.getContext('2d');
    if (!ctx) return;
    if (this.adminChart) { this.adminChart.destroy(); this.adminChart = null; }
    this.adminChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Plástico', 'Vidrio', 'RAEE', 'Aceite', 'Metal'],
        datasets: [{ label: 'Kg / Unidades recolectadas', data: [15.5, 12.0, 8.0, 5.0, 3.5], backgroundColor: ['#10b981', '#0284c7', '#7c3aed', '#ec4899', '#f59e0b'] }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { color: '#7d92b0' } }, x: { ticks: { color: '#7d92b0' } } }
      }
    });
  }
};

/* ══════════════════════════════════════════════════════════════
   MÓDULO: ACCIONES DE LA APP (Entregas, Premios, Puntos, etc.)
   ══════════════════════════════════════════════════════════════ */
const app = {
  _html5QrScanner: null,

  async submitCreateGestor(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('gestorName').value.trim();
    const email = document.getElementById('gestorEmail').value.trim();
    const password = document.getElementById('gestorPass').value;

    if (!name || !email || !password) {
      ui.showToast('Todos los campos son requeridos');
      return;
    }

    try {
      const res = await apiClient.admin.createGestor(name, email, password);
      ui.showToast(res.message || 'Gestor de Punto registrado exitosamente');
      document.getElementById('createGestorForm').reset();
      ui.renderAdminPanel();
    } catch (err) {
      alert(`Error al crear gestor: ${err.message}`);
    }
  },

  // ── Modal de entrega ──
  openDeliveryModal() {
    document.getElementById('deliveryModal').classList.add('active');
    this.updateDeliveryCalc();
  },

  closeModal(id) {
    document.getElementById(id).classList.remove('active');
  },

  updateDeliveryCalc() {
    const wasteId = document.getElementById('delWasteSelect')?.value || 'plastico';
    const amount = parseFloat(document.getElementById('delAmountInput')?.value) || 1;
    const waste = STATE.wasteTypes.find(w => w.id === wasteId);
    if (!waste) return;
    document.getElementById('delUnitDisplay').value = waste.unit;
    document.getElementById('modalCalcPoints').textContent = `+${Math.round(amount * waste.pointsPerKg)} pts`;
    document.getElementById('modalCalcCo2').textContent = `${(amount * waste.co2PerKg).toFixed(1)} kg`;
  },

  async submitDelivery(e) {
    if (e) e.preventDefault();
    const pointName = document.getElementById('delPointSelect').value;
    const wasteId = document.getElementById('delWasteSelect').value;
    const amount = parseFloat(document.getElementById('delAmountInput').value);
    const notes = document.getElementById('delNotes').value;
    const waste = STATE.wasteTypes.find(w => w.id === wasteId) || { name: 'Residuo', pointsPerKg: 10, co2PerKg: 1.5, unit: 'Kg' };
    const pts = Math.round(amount * waste.pointsPerKg);
    const co2 = parseFloat((amount * waste.co2PerKg).toFixed(1));
    const user = STATE.currentUser;

    const ep = STATE.ecoPoints.find(p => p.name === pointName) || STATE.ecoPoints[0];
    const epId = ep ? ep.id : 1;
    const matIdMap = { 'plastico': 1, 'carton': 2, 'vidrio': 3, 'metal': 4 };
    const materialId = matIdMap[wasteId] || 1;

    try {
      if (window.apiClient && localStorage.getItem('ecopuntos_jwt')) {
        await apiClient.deliveries.create(epId, materialId, amount);
        const updatedUser = await apiClient.auth.getProfile();
        if (updatedUser) {
          user.points = updatedUser.points;
          user.level = updatedUser.level;
        }
      }
    } catch (err) {
      console.warn('API delivery submission error, using local fallback:', err);
    }

    const newDel = {
      id: `DEL-CO-${Date.now().toString().slice(-5)}`,
      userId: user.id,
      pointName, wasteName: waste.name, amount, unit: waste.unit,
      points: pts, co2,
      date: new Date().toLocaleString('es-CO', { hour12: false }).substring(0, 16),
      status: user.role === 'citizen' ? 'pending' : 'approved',
      notes
    };

    STATE.deliveries.unshift(newDel);
    DB.saveDeliveries(STATE.deliveries);

    // Acreditar puntos inmediatamente si el mismo trabajador aprueba
    if (user.role !== 'citizen') {
      user.points += pts;
      user.co2Saved += co2;
      DB.updateUser(user);
    }

    const leaderUser = STATE.leaderboard.find(l => l.name.includes(user.name.split(' ')[0]));
    if (leaderUser) { leaderUser.weightKg += amount; }

    this.closeModal('deliveryModal');
    ui.renderAll();
    STATE.notifications.unshift({ id: Date.now(), icon: '', text: `Entrega ${newDel.id} registrada. ${user.role !== 'citizen' ? `+${pts} pts acreditados.` : 'Pendiente de aprobación del gestor.'}`, time: 'Ahora', read: false });
    ui.renderNotifications();
    ui.showToast(user.role !== 'citizen' ? ` Entrega aprobada. +${pts} EcoPuntos acreditados.` : ` Entrega enviada. Pendiente de validación en el punto.`);
  },

  // ── Aprobación desde admin / gestor ──
  async approveDelivery(deliveryId) {
    const del = STATE.deliveries.find(d => d.id === deliveryId);
    if (del) del.status = 'approved';

    try {
      if (window.apiClient) {
        await apiClient.deliveries.approve(deliveryId);
        // Reload live ranking so the updated citizen points show up in Leaderboard right away
        const ranking = await apiClient.ranking.getTop(10);
        if (ranking && ranking.length) STATE.leaderboard = ranking;
        
        // Refresh session profile if citizen
        const updatedUser = await apiClient.auth.getProfile();
        if (updatedUser && STATE.currentUser) {
          STATE.currentUser.points = updatedUser.points;
          STATE.currentUser.level = updatedUser.level;
          localStorage.setItem('ecopuntos_session', JSON.stringify(STATE.currentUser));
        }
      }
    } catch (err) {
      console.warn('API delivery approval error:', err);
    }

    DB.saveDeliveries(STATE.deliveries);
    ui.renderAdminPanel();
    ui.renderAll();
    ui.showToast(` Entrega aprobada. Puntos acreditados permanentemente al reciclador.`);
  },

  rejectDelivery(deliveryId) {
    const idx = STATE.deliveries.findIndex(d => d.id === deliveryId);
    if (idx > -1) STATE.deliveries.splice(idx, 1);
    DB.saveDeliveries(STATE.deliveries);
    ui.renderAdminPanel();
    ui.renderAll();
    ui.showToast(` Entrega ${deliveryId} rechazada y eliminada.`);
  },

  filterDeliveries(status, btnEl) {
    document.querySelectorAll('.delivery-filter-tags .tag-filter').forEach(t => t.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    ui.renderDeliveriesList(status);
  },

  // ── Perfil de Usuario ──
  openProfileModal() {
    const u = STATE.currentUser;
    if (!u) return;
    document.getElementById('profModalAvatar').textContent = u.avatar;
    document.getElementById('profModalName').textContent = u.name;
    document.getElementById('profModalDoc').textContent = `${u.docType || 'CC'} ${u.doc}`;
    document.getElementById('profModalId').textContent = u.id;
    document.getElementById('profModalPhone').textContent = u.phone || 'No registrado';
    document.getElementById('profModalCity').textContent = u.city || 'Pamplona';
    document.getElementById('profModalRole').textContent = ui.roleName(u.role);
    document.getElementById('profModalPoints').textContent = `${u.points.toLocaleString('es-CO')} pts`;
    document.getElementById('profModalCo2').textContent = `${u.co2Saved.toFixed(1)} kg`;
    const level = ui._getLevel(u.points);
    document.getElementById('profModalLevel').innerHTML = `<i class="fa-solid fa-medal"></i> ${level}`;
    document.getElementById('profileModal').classList.add('active');
  },

  // ── QR Ciudadano ──
  openQrModal() {
    document.getElementById('qrModal').classList.add('active');
    this.generateUserQrCode();
  },

  async generateUserQrCode() {
    const qrDiv = document.getElementById('qrcodeDisplay');
    if (!qrDiv || !STATE.currentUser) return;
    qrDiv.innerHTML = '';
    
    try {
      if (window.apiClient && localStorage.getItem('ecopuntos_jwt')) {
        const qrBase64 = await apiClient.qr.generate();
        if (qrBase64) {
          qrDiv.innerHTML = `<img src="${qrBase64}" style="width:140px;height:140px;margin:0 auto;display:block;" alt="Código QR EcoPuntos">`;
          document.getElementById('qrCodeUserText').textContent = STATE.currentUser.id;
          return;
        }
      }
    } catch (err) {
      console.warn('API QR gen error, falling back to local qrcode generator:', err);
    }

    new QRCode(qrDiv, {
      text: JSON.stringify({ id: STATE.currentUser.id, app: 'ecopuntos-pamplona' }),
      width: 140, height: 140,
      colorDark: '#059669', colorLight: '#ffffff'
    });
    document.getElementById('qrCodeUserText').textContent = STATE.currentUser.id;
  },

  // ── Escáner QR Real (Trabajador / Admin) ──
  openScannerModal() {
    document.getElementById('scannerModal').classList.add('active');
    setTimeout(() => this._startQrScanner(), 300);
  },

  _startQrScanner() {
    const container = document.getElementById('html5QrCodeScanner');
    if (!container || typeof Html5QrcodeScanner === 'undefined') return;

    try {
      if (this._html5QrScanner) {
        this._html5QrScanner.clear().catch(() => { });
        this._html5QrScanner = null;
      }
      container.innerHTML = '';
      this._html5QrScanner = new Html5QrcodeScanner('html5QrCodeScanner', {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        rememberLastUsedCamera: true
      }, false);

      this._html5QrScanner.render(
        (decodedText) => {
          this.closeScannerModal();
          document.getElementById('scannerStatus').textContent = ` QR Detectado: ${decodedText}`;
          this.simulateQrScan(decodedText);
        },
        (err) => { /* Ignorar errores de frames */ }
      );
    } catch (e) {
      container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:.82rem;">
        <i class="fa-solid fa-camera" style="font-size:2rem;margin-bottom:8px;display:block;"></i>
        La cámara no está disponible en este dispositivo.<br>Usa la simulación de abajo.
      </div>`;
    }
  },

  closeScannerModal() {
    if (this._html5QrScanner) {
      this._html5QrScanner.clear().catch(() => { });
      this._html5QrScanner = null;
    }
    document.getElementById('html5QrCodeScanner').innerHTML = '';
    this.closeModal('scannerModal');
  },

  async simulateQrScan(scannedId) {
    let name = scannedId;
    try {
      if (window.apiClient && localStorage.getItem('ecopuntos_jwt')) {
        const citizen = await apiClient.qr.scan(scannedId);
        if (citizen) name = citizen.name;
      } else {
        const user = DB.getUsers().find(u => u.id === scannedId);
        if (user) name = user.name;
      }
    } catch (err) {
      const user = DB.getUsers().find(u => u.id === scannedId);
      if (user) name = user.name;
    }

    ui.showToast(` QR Escaneado: ${name} (${scannedId})`);
    document.getElementById('scannerStatus').textContent = ` Usuario encontrado: ${name}`;
    this.closeModal('scannerModal');
    this.openDeliveryModal();
  },

  // ── Recompensas ──
  openRewardModal(rewardId) {
    const reward = STATE.rewards.find(r => r.id === rewardId);
    if (!reward) return;
    STATE.selectedRewardToRedeem = reward;
    document.getElementById('rewModalTitle').textContent = reward.title;
    document.getElementById('rewModalDesc').textContent = reward.desc;
    document.getElementById('rewModalCost').textContent = `${reward.cost} pts`;
    document.getElementById('rewModalIcon').innerHTML = `<i class="fa-solid ${reward.icon} ${reward.color}"></i>`;

    const hasPoints = STATE.currentUser.points >= reward.cost;
    document.getElementById('rewModalWarning').style.display = hasPoints ? 'none' : 'block';
    const btn = document.getElementById('btnConfirmRedeem');
    btn.disabled = !hasPoints;
    btn.style.opacity = hasPoints ? '1' : '0.5';
    document.getElementById('rewardModal').classList.add('active');
  },

  async confirmRedeemReward() {
    const reward = STATE.selectedRewardToRedeem;
    const user = STATE.currentUser;
    if (!reward || user.points < reward.cost) return;

    let voucherCode = `ECO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      if (window.apiClient && localStorage.getItem('ecopuntos_jwt')) {
        const res = await apiClient.rewards.redeem(reward.id);
        if (res && res.code) voucherCode = res.code;
        const updatedUser = await apiClient.auth.getProfile();
        if (updatedUser) user.points = updatedUser.points;
      } else {
        user.points -= reward.cost;
      }
    } catch (err) {
      console.warn('API redeem reward error, falling back to local state:', err);
      user.points -= reward.cost;
    }

    DB.updateUser(user);

    STATE.myVouchers.unshift({
      rewardTitle: reward.title,
      code: voucherCode,
      ally: reward.ally,
      redeemedDate: new Date().toISOString().substring(0, 10)
    });
    DB.saveVouchers(STATE.myVouchers);

    this.closeModal('rewardModal');
    ui.renderAll();
    ui.showToast(` Canje exitoso: ${reward.title}! Revisa tus cupones.`);
  },

  // ── Puntos Ecológicos ──
  openNewPointModal() { document.getElementById('newPointModal').classList.add('active'); },

  submitNewPoint(e) {
    e.preventDefault();
    const name = document.getElementById('npName').value;
    const city = document.getElementById('npCity').value;
    const district = document.getElementById('npDistrict').value;
    const address = document.getElementById('npAddress').value;
    const hours = document.getElementById('npHours').value;
    const manager = document.getElementById('npManager').value;
    const materials = Array.from(document.querySelectorAll('input[name="npMaterials"]:checked')).map(c => c.value);

    STATE.ecoPoints.unshift({
      id: STATE.ecoPoints.length + 100,
      name, city, district, address, hours, status: 'open',
      lat: 7.3782, lng: -72.6475, // Default Pamplona
      materials: materials.length ? materials : ['Plástico'],
      manager
    });
    DB.saveEcoPoints(STATE.ecoPoints);

    this.closeModal('newPointModal');
    ui.renderPointsList();
    ui.renderPointsSelectInModal();
    if (mapModule.initialized) mapModule.renderMarkers(STATE.ecoPoints);
    ui.showToast(` Punto Ecológico "${name}" creado exitosamente.`);
  },

  // ── Campañas ──
  openNewCampaignModal() { document.getElementById('newCampaignModal').classList.add('active'); },

  submitNewCampaign(e) {
    e.preventDefault();
    const title = document.getElementById('ncTitle').value;
    const desc = document.getElementById('ncDesc').value;
    const target = parseInt(document.getElementById('ncTarget').value);
    const bonus = parseInt(document.getElementById('ncBonus').value);
    const days = parseInt(document.getElementById('ncDays').value);

    STATE.campaigns.unshift({
      id: STATE.campaigns.length + 100,
      title, desc, target, current: 0,
      bonusPoints: bonus, daysLeft: days, joined: false,
      region: STATE.currentUser?.city || 'Pamplona'
    });
    DB.saveCampaigns(STATE.campaigns);

    this.closeModal('newCampaignModal');
    ui.renderCampaignsList();
    ui.renderFeaturedCampaign();
    ui.showToast(` Campaña "${title}" publicada.`);
  },

  toggleJoinCampaign(id) {
    const c = STATE.campaigns.find(c => c.id === id);
    if (!c) return;
    c.joined = !c.joined;
    DB.saveCampaigns(STATE.campaigns);
    ui.renderCampaignsList();
    ui.showToast(c.joined ? ' ¡Te uniste a la campaña!' : 'Dejaste la campaña.');
  },

  initData() {
    STATE.deliveries = DB.getDeliveries(STATE.deliveries);
    STATE.myVouchers = DB.getVouchers();
    STATE.ecoPoints = DB.getEcoPoints(STATE.ecoPoints);
    STATE.campaigns = DB.getCampaigns(STATE.campaigns);
  }
};

/* ══════════════════════════════════════════════════════════════
   INICIALIZACIÓN DE LA APLICACIÓN
   ══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

  // Inicializar estado persistido desde LocalStorage
  app.initData();

  // Verificar sesión activa (ahora valida el JWT con el backend)
  const hasSession = await auth.checkSession();
  if (hasSession) {
    ui.showApp();
    ui.renderAll();
    // Load live data from backend
    await auth._loadAppData();
    ui.renderLeaderboard();
    ui.renderRewardsGrid();
    ui.renderPointsList();
  }

  // Calculadora de impacto en tiempo real
  ['calcWasteType', 'calcWeight'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => ui.updateEcoCalculator());
    document.getElementById(id)?.addEventListener('input', () => ui.updateEcoCalculator());
  });

  // Buscador de puntos ecológicos
  document.getElementById('searchPointInput')?.addEventListener('input', e => ui.renderPointsList(e.target.value));

  // Filtros de material en puntos
  document.querySelectorAll('#wasteFilterPills .pill-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('#wasteFilterPills .pill-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      ui.renderPointsList('', e.currentTarget.dataset.material);
    });
  });

  // Filtros de categoría de recompensas
  document.querySelectorAll('#rewardCatPills .cat-pill').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('#rewardCatPills .cat-pill').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      ui.renderRewardsGrid(e.currentTarget.dataset.cat);
    });
  });

  // Cerrar paneles al tocar fuera de ellos
  document.addEventListener('click', e => {
    if (!e.target.closest('#notifPanel') && !e.target.closest('#btnNotifications')) {
      const p = document.getElementById('notifPanel');
      if (p) p.style.display = 'none';
    }
    if (!e.target.closest('#profileMenu') && !e.target.closest('#btnProfile')) {
      const m = document.getElementById('profileMenu');
      if (m) m.style.display = 'none';
    }
  });

  // Inicializar tema (oscuro/claro) desde localStorage
  ui.initTheme();
});
