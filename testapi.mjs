import fs from 'fs';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("No API key");
    return;
  }
  
  const dummyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
  const blob = new Blob([dummyPng], { type: 'image/png' });

  const formData = new FormData();
  formData.append('model', 'dall-e-2');
  formData.append('prompt', 'make it red');
  formData.append('image', blob, 'test.png');

  console.log("Sending request to OpenAI with dall-e-2...");
  try {
    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });
    
    const text = await res.json();
    console.log("Dall-e-2 Response:", res.status, text);
  } catch(e) {
    console.log("Error:", e);
  }
}
run();
