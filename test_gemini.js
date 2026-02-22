import fs from 'fs';

// Simple .env parser to avoid external dependencies
const envContent = fs.readFileSync('.env', 'utf8');
const envRules = envContent.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));
const env = {};
envRules.forEach(rule => {
    const [key, ...values] = rule.split('=');
    env[key] = values.join('=').trim();
});

const GEMINI_API_KEY = env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY in .env file. Please add it to test locally.");
    process.exit(1);
}

async function testGemini() {
    const prompt = "Please summarize: Hello world. Output exactly in JSON format: { \"summary\": \"...\" }";

    // Let's test the v1beta endpoint with gemini-1.5-flash and snake_case generation_config
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    console.log("Testing URL:", url);

    const geminiRes = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                response_mime_type: "application/json"
            }
        })
    });

    console.log("Status:", geminiRes.status);
    const text = await geminiRes.text();
    console.log("Response:", text);
}

testGemini();
