import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabaseUrl = "https://efgveagtdpqownyjspvf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZ3ZlYWd0ZHBxb3dueWpzcHZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4Mjg1NSwiZXhwIjoyMDkxMjU4ODU1fQ.8B_S0z1K3tbxAVfZMHpleZgO8Hl6WlutEqk_yrfJpOg";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("official_partners")
    .select("*")
    .ilike("full_name", "%Nico%")
    .order("created_at", { ascending: false })
    .limit(1);

  let record = data && data[0];
  if (!record) {
    const res = await supabase.from("official_partners").select("*").ilike("full_name", "%Nikki%").order("created_at", { ascending: false }).limit(1);
    record = res.data && res.data[0];
  }
  if (!record) {
    const res = await supabase.from("official_partners").select("*").ilike("email", "%nikki%").order("created_at", { ascending: false }).limit(1);
    record = res.data && res.data[0];
  }

  if (!record) {
    console.log("Could not find Nikki/Nicole in the database.");
    return;
  }

  console.log("Found record for:", record.full_name);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Agreement_${record.full_name.replace(/\s+/g, '_')}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: auto; margin: 0mm; }
      html { background-color: #FFFFFF; margin: 0px; }
      body { padding: 40px !important; margin: 0px; }
    }
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; }
  </style>
</head>
<body class="bg-white text-slate-900 p-12 max-w-4xl mx-auto">
  <div class="text-center space-y-4 mb-12">
    <h1 class="text-4xl font-bold text-slate-900">Project Agreement</h1>
    <p class="text-slate-500 font-bold tracking-wide uppercase text-sm">Cleveland Installation</p>
  </div>

  <div class="space-y-8">
    <div>
      <h3 class="text-xl font-bold text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">Contract Terms</h3>
      <div class="space-y-6 text-slate-700">
        <div>
          <p class="uppercase tracking-wider text-xs font-bold text-slate-400 mb-1">Title</p>
          <p class="text-lg font-medium text-slate-900">Cleveland Project: Logistics & Media Support</p>
        </div>
        <div>
          <p class="uppercase tracking-wider text-xs font-bold text-slate-400 mb-1">Compensation</p>
          <p class="text-lg font-bold text-emerald-600">$400 Flat Stipend</p>
        </div>

        <div>
          <p class="uppercase tracking-wider text-xs font-bold text-slate-400 mb-3">Responsibilities</p>
          <ul class="list-disc pl-5 space-y-2">
            <li>Provide reliable transportation for the duration of the project.</li>
            <li>Assist with general job-site logistics and material handling.</li>
            <li>Act as the dedicated media personnel to capture high-quality photos and video of the installation process.</li>
          </ul>
        </div>

        <div class="bg-red-50 border border-red-200 rounded-xl p-5 mt-6">
          <div class="flex items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
            <p class="text-red-700 font-bold uppercase tracking-wider text-sm">Intellectual Property Clause</p>
          </div>
          <ul class="list-disc pl-5 space-y-2 text-red-800">
            <li><strong>ALL</strong> media captured on the job site remains the exclusive, proprietary property of Pour Masters LLC.</li>
            <li>The Contractor is strictly prohibited from posting, sharing, or publishing any project media to personal or business social media accounts, portfolios, or websites without explicit prior authorization and approval from Jake Flowers.</li>
          </ul>
        </div>
      </div>
      <p class="text-sm text-slate-500 italic mt-6">
        I acknowledge and agree to abide by the media, commercial rights, and compensation terms outlined above for the Cleveland Installation.
      </p>
    </div>

    <div>
      <h3 class="text-xl font-bold text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">Contractor Information</h3>
      <div class="grid grid-cols-2 gap-6">
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Full Legal Name</p>
          <p class="font-medium text-slate-900">${record.full_name || 'N/A'}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Company Name</p>
          <p class="font-medium text-slate-900">${record.company_name || 'N/A'}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Email Address</p>
          <p class="font-medium text-slate-900">${record.email || 'N/A'}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Phone Number</p>
          <p class="font-medium text-slate-900">${record.phone || 'N/A'}</p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-xl font-bold text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">Digital Signature</h3>
      <div class="bg-white rounded-xl border-2 border-slate-200 overflow-hidden relative h-48 w-full flex items-center justify-center">
        ${record.signature_data ? '<img src="' + record.signature_data + '" alt="Digital Signature" class="max-w-full max-h-full object-contain" />' : ''}
        ${record.signature_data ? '<div class="absolute bottom-2 left-4 text-xs text-slate-400 uppercase font-bold">Signed: ' + new Date(record.created_at).toLocaleDateString() + '</div>' : ''}
      </div>
    </div>
  </div>
  <script>
    window.onload = () => window.print();
  </script>
</body>
</html>
  `;

  fs.writeFileSync("Agreement_Nicole_Givens.html", html);
  console.log("Wrote Agreement_Nicole_Givens.html");
}

run();
