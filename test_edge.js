const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing keys");
    process.exit(1);
}

const functionUrl = `${SUPABASE_URL}/functions/v1/fetch-summary`;

async function test() {
    console.log("Calling", functionUrl);
    const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
            url: 'https://edition.cnn.com/2026/02/21/tech/some-news.html',
            type: 'ARTICLE'
        })
    });

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
}

test();
