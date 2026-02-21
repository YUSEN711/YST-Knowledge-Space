const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY");
    process.exit(1);
}

async function testGemini() {
    const prompt = "Please summarize: Hello world.";

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    });

    console.log("Status:", geminiRes.status);
    const text = await geminiRes.text();
    console.log("Response:", text);
}

testGemini();
