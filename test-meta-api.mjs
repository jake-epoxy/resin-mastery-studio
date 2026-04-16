// Run this to satisfy Meta's "pages_manage_metadata" API test requirement
// Usage: node test-meta-api.mjs

const PAGE_ACCESS_TOKEN = 'EAAcrMBG0j2wBRBxGa5gFDY80WezMY1nzZAbbUQOfmkgqiblbCrc38PPXr5TBqLFVMiKhQmejpeAls9maoocMY748xJeuxdyW0lYyI5vCjSDNeINmfreOY7OB3QY0aEIEQKblvuZC69ZCzSGB8l96KTqhDhEX9qkJqS9p9t7ZANCPOBWwtzwzeQwspZA9HuLPFjsKBx1kS0imPzhLuJNdA';

async function run() {
  console.log("Making pages_manage_metadata test call...\n");

  // 1. Read page info (uses pages_manage_metadata permission)
  const res = await fetch(`https://graph.facebook.com/v25.0/me?fields=id,name,about,category&access_token=${PAGE_ACCESS_TOKEN}`);
  const data = await res.json();
  console.log("Page Info:", JSON.stringify(data, null, 2));

  // 2. Subscribe app to page (also uses pages_manage_metadata)
  const subRes = await fetch(`https://graph.facebook.com/v25.0/me/subscribed_apps?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscribed_fields: ['messages'] })
  });
  const subData = await subRes.json();
  console.log("\nSubscribe Response:", JSON.stringify(subData, null, 2));

  console.log("\n✅ Done — Meta should register these calls within 24 hours.");
  console.log("Go back to App Review and check if it shows 1 of 1 API call(s) completed.");
}

run().catch(console.error);
