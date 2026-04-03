import https from 'https';
import fs from 'fs';

const key = 'AIzaSyCZBAf7mlccR1hezBRcKR5bGNx-OWUmeWg';
const data = JSON.stringify({
  contents: [{ parts: [{ text: "Hi" }] }]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${key}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    fs.writeFileSync('error_out.json', body, 'utf8');
    console.log(`STATUS: ${res.statusCode} - Wrote to error_out.json`);
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();

