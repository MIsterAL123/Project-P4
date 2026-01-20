const http = require('http');

// Login and get session
function login(callback) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  };

  const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const cookies = res.headers['set-cookie'];
      
      // Login sends redirect (302), not JSON, so cookies should be set
      if (!cookies || cookies.length === 0) {
        console.log('❌ Login failed - no session cookie set');
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
        return;
      }
      
      const sessionCookie = cookies.map(c => c.split(';')[0]).join('; ');
      console.log('✅ Login successful (status:', res.statusCode + ')');
      callback(sessionCookie);
    });
  });

  req.on('error', err => {
    console.error('❌ Login error:', err.message);
  });

  req.write('email=admin@p4.com&password=admin123');
  req.end();
}

// Test endpoints
function testEndpoints(sessionCookie) {
  const endpoints = [
    '/admin/dashboard',
    '/admin/manage-admin',
    '/admin/approve-guru',
    '/admin/manage-peserta',
    '/admin/manage-kuota'
  ];

  let completed = 0;

  endpoints.forEach(path => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    };

    const req = http.request(options, res => {
      console.log(`${res.statusCode === 200 ? '✅' : '❌'} GET ${path}: ${res.statusCode}`);
      res.on('data', () => {});
      res.on('end', () => {
        completed++;
        if (completed === endpoints.length) {
          console.log('\n📊 All tests completed');
          process.exit(0);
        }
      });
    });

    req.on('error', err => {
      console.error(`❌ Error testing ${path}:`, err.message);
    });

    req.end();
  });
}

// Run tests
console.log('🔍 Testing P4 endpoints...\n');
login(testEndpoints);
