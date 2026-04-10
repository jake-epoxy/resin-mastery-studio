const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/OPENAI_API_KEY=\"(.*?)\"/);
if (match) {
  const k = match[1];
  console.log('Key:', k);
  console.log('Length:', k.length);
  console.log('Last character code:', k.charCodeAt(k.length - 1));
}
