const { spawn } = require('child_process');
const path = require('path');

const ROOT_DIR = __dirname;
const FASTAPI_DIR = path.join(ROOT_DIR, 'fastapi_backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

console.log('----------------------------------------------------');
console.log(' INICIANDO ECOPUNTOS PAMPLONA (FastAPI + Angular)');
console.log('----------------------------------------------------\n');

// 1. Iniciar FastAPI Backend (Puerto 3000)
console.log('⚡ Iniciando FastAPI Backend en http://localhost:3000...');
const backendProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '3000'], {
  cwd: FASTAPI_DIR,
  stdio: 'inherit',
  shell: true
});

// 2. Iniciar Angular Frontend (Puerto 4200)
console.log('⚡ Iniciando Angular Frontend en http://localhost:4200...\n');
const frontendProcess = spawn('npx', ['ng', 'serve', '--port', '4200'], {
  cwd: FRONTEND_DIR,
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  console.log('\n Apagando servidores...');
  backendProcess.kill();
  frontendProcess.kill();
  process.exit();
});
