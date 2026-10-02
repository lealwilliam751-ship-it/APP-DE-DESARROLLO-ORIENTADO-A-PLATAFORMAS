const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');

const FRONTEND_PORT = process.env.FRONTEND_PORT || 8080;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

console.log('----------------------------------------------------');
console.log(' INICIANDO ECOPUNTOS PAMPLONA (MODO ULTRA RÁPIDO)');
console.log('----------------------------------------------------\n');

// Función para verificar si un puerto está respondiendo
function checkPort(port, host = 'localhost') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function init() {
  // 1. Iniciar Servidor Frontend (Estático HTTP ultra rápido)
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    
    const filePath = path.join(ROOT_DIR, reqPath);
    
    if (!filePath.startsWith(ROOT_DIR)) {
      res.writeHead(403);
      res.end('Acceso denegado');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Archivo no encontrado');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      
      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`ℹ El puerto ${FRONTEND_PORT} ya está en uso. La interfaz web ya se encuentra activa en: http://localhost:${FRONTEND_PORT}`);
    } else {
      console.error('Error en el servidor frontend:', err.message);
    }
  });

  server.listen(FRONTEND_PORT, () => {
    console.log(` Frontend web listo en: http://localhost:${FRONTEND_PORT}`);
  });

  // 2. Verificar estado de la base de datos PostgreSQL (puerto 5432)
  const dbActive = await checkPort(5432);
  if (!dbActive) {
    console.warn('\n ADVERTENCIA: No se detecta PostgreSQL corriendo en localhost:5432');
    console.warn(' Para solucionar el "Internal Server Error" al iniciar sesión y abrir pgAdmin (localhost:5050):');
    console.warn('   1. Abre Docker Desktop en tu equipo.');
    console.warn('   2. Ejecuta en tu terminal: npm run db:up\n');
  } else {
    console.log(' Base de datos PostgreSQL conectada (puerto 5432)');
  }

  // 3. Iniciar Servidor Backend (Node Express)
  const backendDir = path.join(ROOT_DIR, 'backend');
  const backendProcess = spawn('node', ['src/index.js'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true
  });

  console.log(' Servidor Backend activo en: http://localhost:3000\n');
  console.log(' Aplicación iniciada. Abre tu navegador en http://localhost:8080');
  console.log('   Presiona Ctrl+C para salir.\n');

  process.on('SIGINT', () => {
    console.log('\n Apagando servidores...');
    server.close();
    backendProcess.kill();
    process.exit();
  });
}

init();
