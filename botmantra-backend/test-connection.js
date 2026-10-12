// Quick Supabase Connection Test
const https = require('https');
const url = require('url');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://api.mantravat.cloud';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('Testing Supabase Connection...\n');
console.log('URL:', SUPABASE_URL);
console.log('Service Role Key Present:', !!SERVICE_ROLE_KEY);
console.log('Key Length:', SERVICE_ROLE_KEY.length);

// Test basic connectivity
const parsedUrl = new URL(SUPABASE_URL + '/rest/v1/');

const options = {
  hostname: parsedUrl.hostname,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY,
    'Content-Type': 'application/json'
  }
};

console.log('\nAttempting HTTPS connection...');
const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data.substring(0, 200));
    if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 403) {
      console.log('\n✅ Connection successful (endpoint is reachable)');
      process.exit(0);
    } else {
      console.log('\n❌ Unexpected response code');
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.log('\n❌ Connection error:', err.message);
  process.exit(1);
});

req.end();
