const OpenAI = require('openai');

(async () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("No API key provided to script.");
    return;
  }

  const openai = new OpenAI({ apiKey });
  
  try {
    const res = await openai.models.list();
    console.log("API Key works! Models count:", res.data.length);
  } catch (err) {
    console.error("API Key Test Failed:", err.message);
  }
})();
