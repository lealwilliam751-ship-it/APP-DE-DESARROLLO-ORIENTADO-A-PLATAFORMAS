const { Client } = require('pg');

async function setup() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to Postgres.');

    await client.query("ALTER USER postgres WITH PASSWORD 'postgres';");
    console.log('User postgres password updated.');

    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='ecopuntos'");
    if (res.rowCount === 0) {
      await client.query('CREATE DATABASE ecopuntos');
      console.log('Database ecopuntos created.');
    } else {
      console.log('Database ecopuntos already exists.');
    }
  } catch (err) {
    console.error('Setup Error:', err.message);
  } finally {
    await client.end();
  }
}

setup();
