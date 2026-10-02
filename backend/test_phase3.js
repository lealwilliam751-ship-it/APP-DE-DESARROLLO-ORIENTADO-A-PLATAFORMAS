const baseUrl = 'http://localhost:3000/api';

async function runCompleteSystemTests() {
  console.log('===================================================');
  console.log('   PRUEBAS INTEGRALES DEL SISTEMA ECOPUNTOS');
  console.log('===================================================\n');

  let adminToken = '';
  let gestorToken = '';
  let citizenToken = '';
  let citizenId = '';

  try {
    // 1. Inicio de sesión como Único Administrador
    console.log('--- Test 1: Autenticación de Administrador ---');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ecopuntos.com', password: 'admin' })
    });
    const adminData = await adminLoginRes.json();
    if (adminLoginRes.status !== 200) throw new Error(`Status ${adminLoginRes.status}: ${JSON.stringify(adminData)}`);
    adminToken = adminData.token;
    console.log(' Administrador autenticado correctamente.\n');

    // 2. Registro Público (Siempre se crea como Ciudadano por seguridad)
    console.log('--- Test 2: Registro Público de Ciudadano ---');
    const citizenEmail = `ciudadano_${Date.now()}@eco.com`;
    const citizenRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Carlos Mendoza', email: citizenEmail, password: 'pass1234', defaultCity: 'Pamplona' })
    });
    const cData = await citizenRegRes.json();
    if (citizenRegRes.status !== 201) throw new Error(JSON.stringify(cData));
    citizenToken = cData.token;
    citizenId = cData.user.id;
    console.log(` Ciudadano registrado exitosamente. ID: ${citizenId}, Rol: ${cData.user.role}\n`);

    // 3. Creación de Gestor de Punto por parte del Administrador
    console.log('--- Test 3: Creación/Autorización de Gestor por Admin ---');
    const gestorEmail = `gestor_${Date.now()}@eco.com`;
    const createGestorRes = await fetch(`${baseUrl}/admin/create-gestor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: 'Pedro Páramo', email: gestorEmail, password: 'gestorpass123', defaultCity: 'Pamplona' })
    });
    const gestorCreateData = await createGestorRes.json();
    if (createGestorRes.status !== 201 && createGestorRes.status !== 200) throw new Error(JSON.stringify(gestorCreateData));
    console.log(` Gestor de Punto creado/autorizado por Admin.\n`);

    // Login con el nuevo gestor
    const gestorLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: gestorEmail, password: 'gestorpass123' })
    });
    const gLoginData = await gestorLoginRes.json();
    gestorToken = gLoginData.token;
    console.log(` Gestor de Punto autenticado. Rol: ${gLoginData.user.role}\n`);

    // 4. Generación y Escaneo de Código QR
    console.log('--- Test 4: Flujo de Código QR (Generación y Escaneo) ---');
    const qrRes = await fetch(`${baseUrl}/qr/generate`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const qrData = await qrRes.json();
    if (qrRes.status !== 200 || !qrData.qr) throw new Error('Generación de QR falló');

    const qrPayload = JSON.stringify({ id: citizenId, app: 'ecopuntos-pamplona' });
    const scanRes = await fetch(`${baseUrl}/qr/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gestorToken}` },
      body: JSON.stringify({ payload: qrPayload })
    });
    const scanData = await scanRes.json();
    if (scanRes.status !== 200) throw new Error(JSON.stringify(scanData));
    console.log(` Escáner QR de Gestor identificó al ciudadano: ${scanData.citizen.name}\n`);

    // 5. Registro y Aprobación de Entrega con Báscula
    console.log('--- Test 5: Entrega de Reciclaje y Aprobación ---');
    const ecoRes = await fetch(`${baseUrl}/ecopoints`);
    const { ecopoints } = await ecoRes.json();
    
    const delivRes = await fetch(`${baseUrl}/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citizenToken}` },
      body: JSON.stringify({
        ecopointId: ecopoints[0].id,
        items: [{ material_id: 1, weight_kg: 20 }] // 20 kg de plástico (1000 pts)
      })
    });
    const delivData = await delivRes.json();
    const deliveryId = delivData.delivery.deliveryId;
    console.log(` Entrega registrada con ID ${deliveryId}. Estado: Pendiente`);

    // Aprobar entrega por Gestor
    const appRes = await fetch(`${baseUrl}/deliveries/${deliveryId}/approve`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${gestorToken}` }
    });
    const appData = await appRes.json();
    if (appRes.status !== 200) throw new Error(JSON.stringify(appData));
    console.log(` Entrega aprobada por Gestor. Puntos sumados: +${appData.result.addedPoints} pts.\n`);

    // 6. Verificar Persistencia en BD del Perfil del Ciudadano
    console.log('--- Test 6: Verificación de Saldo Persistente en Base de Datos ---');
    const profileRes = await fetch(`${baseUrl}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const profileData = await profileRes.json();
    console.log(` Saldo permanente en PostgreSQL: ${profileData.user.total_points} pts. Nivel: "${profileData.user.level}"\n`);
    if (profileData.user.total_points < 1000) throw new Error('Persistencia de saldo falló');

    // 7. Catálogo de Recompensas y Canje de Cupón
    console.log('--- Test 7: Canje de Recompensa por Cupón ---');
    const rwRes = await fetch(`${baseUrl}/rewards`);
    const rwData = await rwRes.json();
    const rewardToRedeem = rwData.rewards[0];

    const redeemRes = await fetch(`${baseUrl}/rewards/${rewardToRedeem.id}/redeem`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const redeemData = await redeemRes.json();
    if (redeemRes.status !== 200) throw new Error(JSON.stringify(redeemData));
    console.log(` Recompensa "${rewardToRedeem.name}" canjeada. Código generado: ${redeemData.redemption.redemption_code}`);

    // Verificar nuevo saldo deducido en BD
    const profileAfterRedeem = await fetch(`${baseUrl}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const pAfterData = await profileAfterRedeem.json();
    console.log(` Nuevo saldo tras descuento en PostgreSQL: ${pAfterData.user.total_points} pts.\n`);

    // 8. Ranking y Métricas de Administrador
    console.log('--- Test 8: Ranking Público y Métricas Ejecutivas ---');
    const rkRes = await fetch(`${baseUrl}/ranking`);
    const rkData = await rkRes.json();
    console.log(` Leaderboard consultado con éxito (${rkData.ranking.length} posiciones).`);

    const metricsRes = await fetch(`${baseUrl}/admin/metrics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const metricsData = await metricsRes.json();
    console.log(` Métricas ejecutivas Admin: ${metricsData.metrics.totalUsers} usuarios, ${metricsData.metrics.totalDeliveries} entregas aprobadas, ${metricsData.metrics.totalPoints} puntos circulantes.\n`);

    console.log('===================================================');
    console.log('   ¡TODAS LAS PRUEBAS DEL SISTEMA PASARON AL 100%! ');
    console.log('===================================================');

  } catch (err) {
    console.error('\n ERROR EN LAS PRUEBAS:', err.message);
    process.exit(1);
  }
}

runCompleteSystemTests();
