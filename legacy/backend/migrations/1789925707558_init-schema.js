exports.up = (pgm) => {
  // Habilitar extensión PostGIS para coordenadas espaciales si está disponible
  pgm.sql(`
    DO $$ 
    BEGIN 
      CREATE EXTENSION IF NOT EXISTS "postgis"; 
    EXCEPTION WHEN OTHERS THEN 
      RAISE NOTICE 'PostGIS no disponible, utilizando cálculo Haversine nativo en lat/lng.';
    END $$;
  `);

  // Enums
  pgm.createType('user_role', ['Ciudadano', 'Gestor_de_Punto', 'Administrador']);
  pgm.createType('delivery_status', ['pending', 'approved', 'rejected']);
  pgm.createType('campaign_status', ['active', 'completed', 'cancelled']);
  
  // Tabla: Users
  pgm.createTable('users', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true },
    email: { type: 'varchar(150)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    role: { type: 'user_role', notNull: true, default: 'Ciudadano' },
    default_city: { type: 'varchar(100)', default: 'Pamplona' },
    total_points: { type: 'integer', notNull: true, default: 0 },
    level: { type: 'varchar(50)', notNull: true, default: 'Semilla Verde' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Tabla: Materials
  pgm.createTable('materials', {
    id: 'id',
    name: { type: 'varchar(50)', notNull: true, unique: true },
    points_per_kg: { type: 'integer', notNull: true },
    co2_kg_per_kg: { type: 'decimal(10,2)', notNull: true },
  });

  // Tabla: EcoPoints
  pgm.createTable('ecopoints', {
    id: 'id',
    name: { type: 'varchar(150)', notNull: true },
    address: { type: 'varchar(255)', notNull: true },
    city: { type: 'varchar(100)', notNull: true, default: 'Pamplona' },
    lat: { type: 'decimal(10,8)', notNull: true }, // Se mantienen como caché numérico para APIs front-end
    lng: { type: 'decimal(11,8)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Columna Geoespacial condicional para PostGIS
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geometry') THEN
        ALTER TABLE ecopoints ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);
        CREATE INDEX IF NOT EXISTS ecopoints_location_index ON ecopoints USING gist (location);
      END IF;
    END $$;
  `);

  // Tabla: Deliveries (Entregas)
  pgm.createTable('deliveries', {
    id: 'id',
    user_id: { type: 'integer', references: 'users(id)', onDelete: 'CASCADE', notNull: true },
    ecopoint_id: { type: 'integer', references: 'ecopoints(id)', onDelete: 'CASCADE', notNull: true },
    status: { type: 'delivery_status', notNull: true, default: 'pending' },
    total_points: { type: 'integer', default: 0 },
    total_co2: { type: 'decimal(10,2)', default: 0 },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Tabla: Delivery Items (Detalle de entrega)
  pgm.createTable('delivery_items', {
    id: 'id',
    delivery_id: { type: 'integer', references: 'deliveries(id)', onDelete: 'CASCADE', notNull: true },
    material_id: { type: 'integer', references: 'materials(id)', onDelete: 'CASCADE', notNull: true },
    weight_kg: { type: 'decimal(10,2)', notNull: true },
    points: { type: 'integer', notNull: true },
    co2_saved: { type: 'decimal(10,2)', notNull: true },
  });

  // Tabla: Rewards (Recompensas)
  pgm.createTable('rewards', {
    id: 'id',
    name: { type: 'varchar(150)', notNull: true },
    description: { type: 'text' },
    category: { type: 'varchar(100)' },
    point_cost: { type: 'integer', notNull: true },
    stock: { type: 'integer', default: -1 }, // -1 means infinite stock
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Tabla: Redeemed Rewards (Cupones Canjeados)
  pgm.createTable('redeemed_rewards', {
    id: 'id',
    user_id: { type: 'integer', references: 'users(id)', onDelete: 'CASCADE', notNull: true },
    reward_id: { type: 'integer', references: 'rewards(id)', onDelete: 'SET NULL' },
    points_spent: { type: 'integer', notNull: true },
    redemption_code: { type: 'varchar(50)', notNull: true, unique: true },
    redeemed_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Tabla: Campaigns
  pgm.createTable('campaigns', {
    id: 'id',
    name: { type: 'varchar(150)', notNull: true },
    description: { type: 'text' },
    start_date: { type: 'timestamp', notNull: true },
    end_date: { type: 'timestamp', notNull: true },
    goal_points: { type: 'integer', notNull: true },
    current_points: { type: 'integer', default: 0 },
    status: { type: 'campaign_status', notNull: true, default: 'active' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Tabla: Campaign Participants (Participaciones Campaña)
  pgm.createTable('campaign_participants', {
    id: 'id',
    campaign_id: { type: 'integer', references: 'campaigns(id)', onDelete: 'CASCADE', notNull: true },
    user_id: { type: 'integer', references: 'users(id)', onDelete: 'CASCADE', notNull: true },
    points_contributed: { type: 'integer', notNull: true, default: 0 },
    joined_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Índice para evitar participaciones duplicadas
  pgm.createIndex('campaign_participants', ['campaign_id', 'user_id'], { unique: true });

  // Tabla: Notifications
  pgm.createTable('notifications', {
    id: 'id',
    user_id: { type: 'integer', references: 'users(id)', onDelete: 'CASCADE', notNull: true },
    title: { type: 'varchar(150)', notNull: true },
    message: { type: 'text', notNull: true },
    is_read: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('notifications');
  pgm.dropTable('campaign_participants');
  pgm.dropTable('campaigns');
  pgm.dropTable('redeemed_rewards');
  pgm.dropTable('rewards');
  pgm.dropTable('delivery_items');
  pgm.dropTable('deliveries');
  pgm.dropTable('ecopoints');
  pgm.dropTable('materials');
  pgm.dropTable('users');
  
  pgm.dropType('campaign_status');
  pgm.dropType('delivery_status');
  pgm.dropType('user_role');

  pgm.dropExtension('postgis');
};
