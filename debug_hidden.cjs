const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/OPENAI_API_KEY=\"(.*?)\"/);
if (match) {
  const key = match[1];
  console.log('Key length:', key.length);
  for(let i=0; i<key.length; i++) {
    const char = key[i];
    const code = key.charCodeAt(i);
    // If it's not a normal printable ascii char
    if (code < 32 || code > 126) {
      console.log(`HIDDEN CHAR AT INDEX ${i}: code=${code}`);
    }
  }
}
