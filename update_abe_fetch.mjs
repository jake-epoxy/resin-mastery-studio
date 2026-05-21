import fs from 'fs';

// Manually parse .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const envLines = envFile.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of envLines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/"/g, '');
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/"/g, '');
}

async function main() {
  console.log("Fetching Abe Eadeh...");
  const res = await fetch(`${supabaseUrl}/rest/v1/clients?email=eq.Abe.eadeh@gmail.com&select=id`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const clients = await res.json();
  
  if (!clients || clients.length === 0) {
    console.log("Client not found.");
    return;
  }
  
  const clientId = clients[0].id;
  
  console.log("Fetching quotes for Abe...");
  const qRes = await fetch(`${supabaseUrl}/rest/v1/quotes?client_id=eq.${clientId}&select=*`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const quotes = await qRes.json();
  
  if (!quotes || quotes.length === 0) {
    console.log("No quotes found.");
    return;
  }
  
  const quote = quotes[0];
  
  console.log("Updating quote...");
  const updatedConfig = { ...(quote.config || {}), milestones_paid: 2 };
  
  const patchRes = await fetch(`${supabaseUrl}/rest/v1/quotes?id=eq.${quote.id}`, {
    method: 'PATCH',
    headers: { 
      'apikey': supabaseKey, 
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ status: 'Paid In Full', config: updatedConfig })
  });
  
  if (patchRes.ok) {
    console.log("Successfully marked Abe's quote as Paid In Full!");
  } else {
    const error = await patchRes.text();
    console.error("Error updating quote:", error);
  }
}

main();
