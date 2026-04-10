import fs from 'fs';

async function run() {
  const dummyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
  const blob = new Blob([dummyPng], { type: 'image/png' });
  const formData = new FormData();
  formData.append('model', 'gpt-image-1.5');
  formData.append('prompt', 'make it red');
  formData.append('image', blob, 'test.png');

  console.log("Sending request to OpenAI with FAKE KEY and GPT-IMAGE-1.5...");
  try {
    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer sk-proj-FAKEKEY856SEAs' },
      body: formData
    });
    
    const text = await res.json();
    console.log("Response:", res.status, text);
  } catch(e) {
    console.log("Error:", e);
  }
}
run();
