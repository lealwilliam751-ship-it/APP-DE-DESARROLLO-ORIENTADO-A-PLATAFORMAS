require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ecopuntos',
});

async function seedRanking() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('1. Limpiando usuarios de prueba antiguos y duplicados...');

    // Eliminar entregas y datos huérfanos de tests antiguos
    await client.query(`
      DELETE FROM users 
      WHERE name LIKE '%Test%' 
         OR name LIKE '%Ciudadano Test%'
         OR email LIKE '%@example.com' 
         OR email LIKE '%_test%' 
         OR email LIKE '%carlos_%@eco.com'
         OR email LIKE '%pedro_%@eco.com'
         OR email LIKE 'ciudadano_%@eco.com'
         OR email IN ('ciudadano@ecopuntos.com', '1001', '2002', '3003');
    `);

    console.log('2. Creando contraseñas cifradas...');
    const passEco = await bcrypt.hash('eco123', 10);
    const passAdmin = await bcrypt.hash('admin123', 10);
    const passGestor = await bcrypt.hash('gestor123', 10);

    // Asegurar roles de gestión
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, default_city, total_points, level)
      VALUES 
        ('Administrador EcoPuntos', 'admin@ecopuntos.com', $1, 'Administrador', 'Pamplona', 0, 'Administrador'),
        ('Admin UAESP', '9001@ecopuntos.com', $1, 'Administrador', 'Pamplona', 0, 'Administrador'),
        ('Claudia Vargas', 'gestor@ecopuntos.com', $2, 'Gestor_de_Punto', 'Pamplona', 0, 'Gestor Certificado'),
        ('Claudia Vargas', '2002@ecopuntos.com', $2, 'Gestor_de_Punto', 'Pamplona', 0, 'Gestor Certificado')
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          name = EXCLUDED.name;
    `, [passAdmin, passGestor]);

    console.log('3. Creando los 10 ciudadanos para el ranking...');
    // Niveles basados en puntos:
    // >= 1200 → Héroe Ambiental
    // >= 800  → Guardián del Planeta  
    // >= 500  → Eco Guerrero
    // >= 200  → Brote Verde
    // < 200   → Semilla Verde
    const ciudadanos = [
      { name: 'Juan Rodríguez',       email: '1001@ecopuntos.com',   points: 1450, level: 'Héroe Ambiental',      kg: 38.0 },
      { name: 'Ana Lucía Pérez',      email: 'ana@ecopuntos.com',    points: 1250, level: 'Héroe Ambiental',      kg: 31.5 },
      { name: 'Juan David Torres',    email: 'juan@ecopuntos.com',   points: 980,  level: 'Guardián del Planeta', kg: 25.0 },
      { name: 'María Fernanda Ruiz',  email: 'maria@ecopuntos.com',  points: 820,  level: 'Guardián del Planeta', kg: 21.0 },
      { name: 'Carlos Andrés Mora',   email: 'carlos@ecopuntos.com', points: 640,  level: 'Eco Guerrero',         kg: 16.5 },
      { name: 'Laura Sofía Jiménez',  email: 'laura@ecopuntos.com',  points: 510,  level: 'Eco Guerrero',         kg: 13.0 },
      { name: 'Pedro Alfonso Suárez', email: 'pedro@ecopuntos.com',  points: 390,  level: 'Brote Verde',          kg: 10.0 },
      { name: 'Valentina Castro',     email: 'vale@ecopuntos.com',   points: 210,  level: 'Brote Verde',          kg: 6.5 },
      { name: 'Diego Herrera López',  email: 'diego@ecopuntos.com',  points: 145,  level: 'Semilla Verde',        kg: 4.5 },
      { name: 'Natalia Gómez Vargas', email: 'natalia@ecopuntos.com',points: 70,   level: 'Semilla Verde',        kg: 2.0 },
    ];

    // Obtener ecopunto y materiales
    const epRes = await client.query(`SELECT id FROM ecopoints LIMIT 1`);
    const epId = epRes.rows[0]?.id || 1;

    const matRes = await client.query(`SELECT id, points_per_kg, co2_kg_per_kg FROM materials ORDER BY id ASC LIMIT 2`);
    const mat1 = matRes.rows[0] || { id: 1, points_per_kg: 50, co2_kg_per_kg: 1.5 };
    const mat2 = matRes.rows[1] || { id: 2, points_per_kg: 30, co2_kg_per_kg: 0.9 };

    for (const c of ciudadanos) {
      const uRes = await client.query(`
        INSERT INTO users (name, email, password_hash, role, default_city, total_points, level)
        VALUES ($1, $2, $3, 'Ciudadano', 'Pamplona', $4, $5)
        ON CONFLICT (email) DO UPDATE
        SET name = EXCLUDED.name,
            total_points = EXCLUDED.total_points,
            level = EXCLUDED.level,
            password_hash = EXCLUDED.password_hash,
            default_city = 'Pamplona'
        RETURNING id;
      `, [c.name, c.email, passEco, c.points, c.level]);

      const userId = uRes.rows[0].id;

      // Borrar entregas anteriores de este usuario para regenerar limpias
      await client.query(`DELETE FROM deliveries WHERE user_id = $1`, [userId]);

      // Insertar entrega aprobada
      const halfKg = Math.round((c.kg / 2) * 10) / 10;
      const otherHalfKg = Math.round((c.kg - halfKg) * 10) / 10;
      const co2 = (c.kg * 1.2).toFixed(2);

      const delivRes = await client.query(`
        INSERT INTO deliveries (user_id, ecopoint_id, status, total_points, total_co2)
        VALUES ($1, $2, 'approved', $3, $4)
        RETURNING id;
      `, [userId, epId, c.points, co2]);

      const delivId = delivRes.rows[0].id;

      // Items de entrega
      await client.query(`
        INSERT INTO delivery_items (delivery_id, material_id, weight_kg, points, co2_saved)
        VALUES 
          ($1, $2, $3, $4, $5),
          ($1, $6, $7, $8, $9);
      `, [
        delivId,
        mat1.id, halfKg, Math.round(halfKg * mat1.points_per_kg), (halfKg * mat1.co2_kg_per_kg).toFixed(2),
        mat2.id, otherHalfKg, Math.round(otherHalfKg * mat2.points_per_kg), (otherHalfKg * mat2.co2_kg_per_kg).toFixed(2)
      ]);
    }

    await client.query('COMMIT');
    console.log(' Sembrado completado con éxito!');
    console.log('Se configuraron 10 ciudadanos limpios con puntos y residuos (Kg) reales.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al sembrar:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seedRanking();
