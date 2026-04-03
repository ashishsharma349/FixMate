const https = require('https');
const dotenv = require('dotenv');
const fs = require('fs');

if (!fs.existsSync('.env')) {
  console.log("❌ .env file is missing!");
  process.exit(1);
}

const envCols = dotenv.parse(fs.readFileSync('.env'));
const keyId = envCols.RAZORPAY_KEY_ID?.trim();
const keySecret = envCols.RAZORPAY_KEY_SECRET?.trim();

if (!keyId || !keySecret) {
  console.log("❌ Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env!");
  console.log("Found:", { keyId, keySecret });
  process.exit(1);
}

console.log("Loaded Keys from .env:");
console.log(`KEY_ID:     ${keyId}`);
console.log(`KEY_SECRET: ${keySecret.replace(/./g, '*')} (hidden for safety)`);

console.log("\nSending direct authentication test to Razorpay Servers...");

const options = {
  hostname: 'api.razorpay.com',
  port: 443,
  path: '/v1/orders',
  method: 'GET',
  headers: {
    'Authorization': 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64')
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(`\nRazorpay Responded with HTTP Status: ${res.statusCode}`);
    try {
      const json = JSON.parse(data);
      if (res.statusCode === 401) {
        console.log("❌ RESULT: Razorpay rejected your keys!");
        console.log("Reason:", json.error.description);
        console.log("\nPlease log in to your Razorpay Dashboard and generate a NEW key pair.");
      } else if (res.statusCode === 200) {
        console.log("✅ RESULT: Your keys are actually valid and working!");
      } else {
        console.log("Response JSON:", json);
      }
    } catch(e) {
      console.log("Raw Output:", data);
    }
  });
});

req.on('error', e => {
  console.error(e);
});
req.end();
