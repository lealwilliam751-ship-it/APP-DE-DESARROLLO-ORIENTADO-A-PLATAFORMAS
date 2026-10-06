require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ecopuntos',
});

async function runSeeds() {
  console.log('Running seeds for EcoPuntos Pamplona...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insertar Materiales
    console.log('Inserting materials...');
    await client.query(`
      INSERT INTO materials (name, points_per_kg, co2_kg_per_kg)
      VALUES 
        ('Plástico', 50, 1.5),
        ('Cartón y Papel', 30, 0.9),
        ('Vidrio', 20, 0.3),
        ('Metal', 80, 2.1),
        ('Electrónicos', 100, 3.5)
      ON CONFLICT (name) DO NOTHING;
    `);

    // 2. Insertar Puntos Ecológicos de Pamplona
    console.log('Inserting EcoPoints...');
    const colCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='ecopoints' AND column_name='location'
    `);
    
    if (colCheck.rows.length > 0) {
      await client.query(`
        INSERT INTO ecopoints (name, address, city, lat, lng, location)
        VALUES 
          ('Punto Principal Parque Águeda', 'Parque Águeda Gallardo', 'Pamplona', 7.3765, -72.6480, ST_SetSRID(ST_MakePoint(-72.6480, 7.3765), 4326)),
          ('Acopio Universidad de Pamplona', 'Campus Principal Unipamplona', 'Pamplona', 7.3820, -72.6510, ST_SetSRID(ST_MakePoint(-72.6510, 7.3820), 4326)),
          ('Plazuela Almeida Acopio', 'Plazuela Almeida', 'Pamplona', 7.3795, -72.6455, ST_SetSRID(ST_MakePoint(-72.6455, 7.3795), 4326))
        ON CONFLICT DO NOTHING;
      `);
    } else {
      await client.query(`
        INSERT INTO ecopoints (name, address, city, lat, lng)
        VALUES 
          ('Punto Principal Parque Águeda', 'Parque Águeda Gallardo', 'Pamplona', 7.3765, -72.6480),
          ('Acopio Universidad de Pamplona', 'Campus Principal Unipamplona', 'Pamplona', 7.3820, -72.6510),
          ('Plazuela Almeida Acopio', 'Plazuela Almeida', 'Pamplona', 7.3795, -72.6455)
        ON CONFLICT DO NOTHING;
      `);
    }

    // 3. Insertar Recompensas Locales
    console.log('Inserting rewards...');
    await client.query(`
      INSERT INTO rewards (name, description, category, point_cost, stock)
      VALUES 
        ('Descuento 10% Café la Casona', 'Aplica para todas las bebidas calientes', 'Descuentos', 500, 100),
        ('Entrada Museo Casa Anzoátegui', 'Entrada válida para una persona', 'Cultura', 800, 50),
        ('Bolsa Ecológica Reutilizable', 'Bolsa de tela de algodón 100%', 'Productos', 1200, 200),
        ('Bono 10.000 COP Mercado Local', 'Válido en tiendas aliadas de la Plaza de Mercado', 'Bonos', 2000, 20)
      ON CONFLICT DO NOTHING;
    `);

    // 4. Insertar Usuarios de Prueba por Rol
    console.log('Inserting test users for each role...');
    const bcrypt = require('bcrypt');

    const passAdmin    = await bcrypt.hash('admin123', 10);
    const passGestor   = await bcrypt.hash('gestor123', 10);
    const passEco      = await bcrypt.hash('eco123', 10);

    // Administrador (doc 9001 / admin@ecopuntos.com / admin123)
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, default_city, total_points, level)
      VALUES ('Administrador EcoPuntos', 'admin@ecopuntos.com', $1, 'Administrador', 'Pamplona', 0, 'Administrador Sistema')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'Administrador', total_points = 0;
    `, [passAdmin]);

    await client.query(`
      INSERT INTO users (name, email, password_hash, role, default_city, total_points, level)
      VALUES ('Admin UAESP', '9001@ecopuntos.com', $1, 'Administrador', 'Pamplona', 0, 'Administrador Sistema')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'Administrador', total_points = 0;
    `, [passAdmin]);

    // Gestor de Punto (doc 2002 / gestor@ecopuntos.com / gestor123)
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, default_city, total_points, level)
      VALUES ('Claudia Vargas', 'gestor@ecopuntos.com', $1, 'Gestor_de_Punto', 'Pamplona', 0, 'Gestor Operativo')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'Gestor_de_Punto', total_points = 0;
    `, [passGestor]);

    await client.query(`
      INSERT INTO users (name, email, password_hash, role, default_city, total_points, level)
      VALUES ('Claudia Vargas', '2002@ecopuntos.com', $1, 'Gestor_de_Punto', 'Pamplona', 0, 'Gestor Operativo')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'Gestor_de_Punto', total_points = 0;
    `, [passGestor]);

    // Ciudadano (doc 1001 / ciudadano@ecopuntos.com / eco123)
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, default_city, total_points, level)
      VALUES ('Juan Rodríguez', 'ciudadano@ecopuntos.com', $1, 'Ciudadano', 'Pamplona', 1450, 'Reciclador Bronce')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'Ciudadano';
    `, [passEco]);

    await client.query(`
      INSERT INTO users (name, email, password_hash, role, default_city, total_points, level)
      VALUES ('Juan Rodríguez', '1001@ecopuntos.com', $1, 'Ciudadano', 'Pamplona', 1450, 'Reciclador Bronce')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'Ciudadano';
    `, [passEco]);

    await client.query('COMMIT');
    console.log('Seeds executed successfully!');
    console.log('--- Usuarios creados ---');
    console.log('  Admin:     9001 / admin@ecopuntos.com     -> admin123');
    console.log('  Gestor:    2002 / gestor@ecopuntos.com    -> gestor123');
    console.log('  Ciudadano: 1001 / ciudadano@ecopuntos.com -> eco123');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error running seeds:', error);
  } finally {
    client.release();
    pool.end();
  }
}

if (require.main === module) {
  runSeeds();
}

module.exports = { runSeeds };




