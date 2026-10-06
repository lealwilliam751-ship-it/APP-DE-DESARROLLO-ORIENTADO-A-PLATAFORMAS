require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ecopuntos',
});

async function sync() {
  console.log('Syncing database users with test credentials...');
  const client = await pool.connect();

  try {
    const passAdmin = await bcrypt.hash('admin123', 10);
    const passGestor = await bcrypt.hash('gestor123', 10);
    const passEco = await bcrypt.hash('eco123', 10);

    const usersToUpsert = [
      { name: 'Administrador EcoPuntos', email: 'admin@ecopuntos.com', pass: passAdmin, role: 'Administrador', points: 0, level: 'Administrador Sistema' },
      { name: 'Admin UAESP', email: '9001@ecopuntos.com', pass: passAdmin, role: 'Administrador', points: 0, level: 'Administrador Sistema' },
      { name: 'Admin UAESP', email: '9001', pass: passAdmin, role: 'Administrador', points: 0, level: 'Administrador Sistema' },
      { name: 'Claudia Vargas', email: 'gestor@ecopuntos.com', pass: passGestor, role: 'Gestor_de_Punto', points: 0, level: 'Gestor Operativo' },
      { name: 'Claudia Vargas', email: '2002@ecopuntos.com', pass: passGestor, role: 'Gestor_de_Punto', points: 0, level: 'Gestor Operativo' },
      { name: 'Claudia Vargas', email: '2002', pass: passGestor, role: 'Gestor_de_Punto', points: 0, level: 'Gestor Operativo' },
      { name: 'Juan Rodríguez', email: 'ciudadano@ecopuntos.com', pass: passEco, role: 'Ciudadano', points: 1450, level: 'Reciclador Bronce' },
      { name: 'Juan Rodríguez', email: '1001@ecopuntos.com', pass: passEco, role: 'Ciudadano', points: 1450, level: 'Reciclador Bronce' },
      { name: 'Juan Rodríguez', email: '1001', pass: passEco, role: 'Ciudadano', points: 1450, level: 'Reciclador Bronce' },
    ];

    for (const u of usersToUpsert) {
      await client.query(`
        INSERT INTO users (name, email, password_hash, role, default_city, total_points, level)
        VALUES ($1, $2, $3, $4, 'Pamplona', $5, $6)
        ON CONFLICT (email) DO UPDATE 
        SET password_hash = EXCLUDED.password_hash, 
            role = EXCLUDED.role, 
            name = EXCLUDED.name, 
            total_points = EXCLUDED.total_points, 
            level = EXCLUDED.level;
      `, [u.name, u.email, u.pass, u.role, u.points, u.level]);
      console.log(`Synced user: ${u.email} (${u.role})`);
    }

    console.log('All users synced successfully!');
  } catch (err) {
    console.error('Error syncing users:', err);
  } finally {
    client.release();
    pool.end();
  }
}

sync();
