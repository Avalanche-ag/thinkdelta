/**
 * ThinkDelta API Proxy — Cloudflare Worker
 * 
 * This worker securely proxies requests from the ThinkDelta frontend
 * to the MiniMax API, keeping the API key server-side only.
 * 
 * Deployment:
 *   1. cd backend
 *   2. npx wrangler deploy
 *   3. npx wrangler secret put MINIMAX_API_KEY
 *   4. Enter your MiniMax API key when prompted
 * 
 * The worker will be available at: https://thinkdelta-api.YOUR_SUBDOMAIN.workers.dev
 * Update the BACKEND_URL in the frontend app.js with this URL.
 */

export default {
  async fetch(request, env, ctx) {
    // CORS headers — allow the GitHub Pages frontend
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405, corsHeaders);
    }

    try {
      const { textA, textB } = await request.json();

      if (!textA || !textB) {
        return jsonResponse({ error: 'Missing textA or textB in request body.' }, 400, corsHeaders);
      }

      // Check API key
      if (!env.MINIMAX_API_KEY) {
        return jsonResponse({ error: 'MINIMAX_API_KEY not configured on worker.' }, 500, corsHeaders);
      }

      const analysis = await analyzeWithMiniMax(env.MINIMAX_API_KEY, textA, textB);
      return jsonResponse({ analysis }, 200, corsHeaders);

    } catch (err) {
      console.error('Worker error:', err);
      return jsonResponse({ error: err.message || 'Internal server error' }, 500, corsHeaders);
    }
  }
};

function jsonResponse(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...extraHeaders }
  });
}

async function analyzeWithMiniMax(apiKey, textA, textB) {
  const systemPrompt = `You are a cognitive analysis engine. Your job is to analyze two versions of a person's thinking and identify what changed beneath the surface.

For any two versions of an idea, produce three insights:

1. ASSUMPTION SHIFT: What underlying beliefs or frameworks changed between Version A and Version B? What did the person stop believing and start believing? Be specific and analytical.

2. HIDDEN BLIND SPOT: What critical angle, constraint, or question does NEITHER version address? What's the thing both drafts are missing because they're focused on their own argument?

3. THE SYNTHESIS: A higher-order insight that transcends both versions. Not a compromise — a genuinely new frame that makes both versions partial truths. Should feel like a genuine intellectual contribution.

Respond ONLY in valid JSON format with keys: assumptionShift, blindSpot, synthesis.
Keep each field to 3-5 sentences. Be sharp, specific, and avoid generic advice.`;

  const userPrompt = `Version A:\n${textA}\n\nVersion B:\n${textB}`;

  const res = await fetch('https://api.minimax.io/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.7',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`MiniMax API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;

  // Try to parse JSON from the response
  try {
    return JSON.parse(content);
  } catch (e) {
    // Fallback: try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    // Last resort: wrap the raw text
    return {
      assumptionShift: content.substring(0, 500),
      blindSpot: "Could not parse structured response from model.",
      synthesis: "Please try again with clearer inputs."
    };
  }
}
