const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/OPENAI_API_KEY=\"(.*?)\"/);
if (match) {
  const key = match[1];
  console.log('Key length:', key.length);
  console.log('First chars hex:', Buffer.from(key.substring(0, 5)).toString('hex'));
  console.log('Key starts with:', key.substring(0, 5));
}
