import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Find Abe Eadeh
  const { data: clients } = await supabase.from('clients').select('id').eq('email', 'Abe.eadeh@gmail.com').limit(1);
  if (!clients || clients.length === 0) {
    console.log("Client not found.");
    return;
  }
  
  const clientId = clients[0].id;
  
  // Find quotes for Abe
  const { data: quotes } = await supabase.from('quotes').select('*').eq('client_id', clientId);
  if (!quotes || quotes.length === 0) {
    console.log("No quotes found.");
    return;
  }
  
  const quote = quotes[0];
  
  // Update to Paid in Full
  const updatedConfig = { ...(quote.config || {}), milestones_paid: 2 };
  
  const { error } = await supabase
    .from('quotes')
    .update({ status: 'Paid In Full', config: updatedConfig })
    .eq('id', quote.id);
    
  if (error) {
    console.error("Error updating quote:", error);
  } else {
    console.log("Successfully marked Abe's quote as Paid In Full!");
  }
}

main();
