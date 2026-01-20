const http = require('http');

// Login as peserta
function loginPeserta(callback) {
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
      
      if (!cookies || cookies.length === 0) {
        console.log('❌ Login failed - no session cookie');
        console.log('Status:', res.statusCode);
        return;
      }
      
      const sessionCookie = cookies.map(c => c.split(';')[0]).join('; ');
      console.log('✅ Login successful (status:', res.statusCode + ')');
      callback(sessionCookie);
    });
  });

  req.on('error', err => {
    console.error('❌ Login error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  });

  // Use test peserta
  req.write('email=peserta@test.com&password=password');
  req.end();
}

// Test daftar-p4 endpoint
function testDaftarP4(sessionCookie) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/peserta/daftar-p4',
    method: 'GET',
    headers: {
      'Cookie': sessionCookie
    }
  };

  const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`\n${res.statusCode === 200 ? '✅' : '❌'} GET /peserta/daftar-p4: ${res.statusCode}`);
      
      if (res.statusCode !== 200) {
        console.log('\n📄 Response Headers:');
        console.log(res.headers);
        
        if (res.statusCode === 302) {
          console.log('\n🔀 Redirect to:', res.headers.location);
        }
        
        if (data.length < 500) {
          console.log('\n📄 Response body:');
          console.log(data);
        }
      } else {
        console.log('✅ Page loaded successfully!');
        
        // Check if it's an error page
        if (data.includes('tidak ditemukan') || data.includes('404')) {
          console.log('❌ Page shows "tidak ditemukan" error');
          console.log('\nFirst 500 chars:', data.substring(0, 500));
        } else if (data.includes('Daftar Program P4') || data.includes('daftar-p4')) {
          console.log('✅ Correct page content found!');
        }
      }
      
      process.exit(0);
    });
  });

  req.on('error', err => {
    console.error('❌ Error testing daftar-p4:', err.message);
    process.exit(1);
  });

  req.end();
}

// Run tests
console.log('🔍 Testing Pendaftaran P4 page...\n');
loginPeserta(testDaftarP4);
