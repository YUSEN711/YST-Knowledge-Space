import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, type } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let textContent = '';

    // Step 1: Fetch raw content based on type
    if (type === 'YOUTUBE') {
      const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
      if (!YOUTUBE_API_KEY) throw new Error("Missing YOUTUBE_API_KEY");

      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const videoId = (match && match[2].length === 11) ? match[2] : null;

      if (!videoId) throw new Error("Invalid YouTube URL");

      const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`);
      const ytData = await ytRes.json();

      const item = ytData.items?.[0];
      if (!item) throw new Error("Video not found");

      textContent = `Title: ${item.snippet.title}\n\nDescription: ${item.snippet.description}`;

    } else {
      // ARTICLE or BOOK -> use Jina Reader for general scraping
      const jinaRes = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
        headers: {
          'Accept': 'text/plain',
          // 'Authorization': `Bearer ${JINA_API_KEY}` // optional if you have one, but free tier works
        }
      });
      if (!jinaRes.ok) throw new Error("Failed to fetch article content");
      textContent = await jinaRes.text();
      // Cap the text to avoid hitting OpenAI token limits too hard (e.g. 15,000 chars)
      textContent = textContent.slice(0, 15000);
    }

    if (!textContent || textContent.trim() === '') {
      throw new Error("No content retrieved");
    }

    // Step 2: Use Gemini to summarize
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");

    const prompt = `
      Please analyze the following content and provide:
      1. A detailed summary or description (content) - write in Traditional Chinese (繁體中文).
      2. Key points (keyPoints) - bullet points in Traditional Chinese (繁體中文).
      
      Output exactly in JSON format:
      {
        "content": "詳細摘要...",
        "keyPoints": "- 重點一\n- 重點二\n- 重點三"
      }
      
      Here is the content:
      ${textContent}
    `;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
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

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini Error:", errorText);
      throw new Error("Failed to generate summary");
    }

    const geminiData = await geminiRes.json();
    const resultObj = JSON.parse(geminiData.candidates[0].content.parts[0].text);

    return new Response(JSON.stringify(resultObj), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error("Function error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
