async function runTests() {
  console.log('Starting API Tests...');
  const baseUrl = 'http://localhost:3000/api';
  let citizenToken = '';
  let adminToken = '';
  
  try {
    // 1. Test EcoPoints (Public)
    console.log('--- Testing GET /ecopoints ---');
    const ecoRes = await fetch(`${baseUrl}/ecopoints`);
    const ecoData = await ecoRes.json();
    console.log(`Found ${ecoData.ecopoints?.length} ecopoints.`);
    if (ecoRes.status !== 200) throw new Error('EcoPoints GET failed');

    // 2. Test Public Registration (Always creates Ciudadano)
    console.log('\n--- Testing POST /auth/register ---');
    const email = `ciudadano_${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ciudadano Test', email, password: 'password123' })
    });
    const regData = await regRes.json();
    console.log(`Register status: ${regRes.status}`);
    if (regRes.status !== 201) throw new Error(JSON.stringify(regData));
    citizenToken = regData.token;

    // 3. Test Login with Single Admin
    console.log('\n--- Testing POST /auth/login (Admin) ---');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ecopuntos.com', password: 'admin' })
    });
    const loginData = await loginRes.json();
    console.log(`Admin Login status: ${loginRes.status}`);
    if (loginRes.status !== 200) throw new Error(JSON.stringify(loginData));
    adminToken = loginData.token;

    // 4. Test Create Delivery by Citizen
    console.log('\n--- Testing GET /materials ---');
    const matRes = await fetch(`${baseUrl}/materials`);
    const matData = await matRes.json();
    const materialId = matData.materials[0].id;
    console.log(`Using Material ID: ${materialId} (${matData.materials[0].name})`);

    console.log('\n--- Testing POST /deliveries ---');
    const ecopointId = ecoData.ecopoints[0].id;
    const delivRes = await fetch(`${baseUrl}/deliveries`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        ecopointId,
        items: [
          { material_id: materialId, weight_kg: 2.5 }
        ]
      })
    });
    const delivData = await delivRes.json();
    console.log(`Delivery Creation status: ${delivRes.status}`);
    console.log(`Generated Delivery ID: ${delivData.delivery?.deliveryId}`);
    if (delivRes.status !== 201) throw new Error(JSON.stringify(delivData));
    const deliveryId = delivData.delivery.deliveryId;

    // 5. Test Approve Delivery by Admin
    console.log('\n--- Testing PATCH /deliveries/:id/approve (Admin Auth) ---');
    const appRes = await fetch(`${baseUrl}/deliveries/${deliveryId}/approve`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const appData = await appRes.json();
    console.log(`Approve status: ${appRes.status}`);
    if (appRes.status !== 200) throw new Error(JSON.stringify(appData));
    console.log(`Approved successfully. Added ${appData.result?.addedPoints} points to citizen permanently.`);

    console.log('\n ALL API TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n TEST FAILED:', err.message);
    process.exit(1);
  }
}

runTests();
