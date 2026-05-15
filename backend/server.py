"""
ThinkDelta — Local Development Server

This Flask server serves the static frontend AND proxies
MiniMax API calls, so you can test the full live experience locally.

Usage:
  export MINIMAX_API_KEY="your-key-here"
  python3 backend/server.py

  Open http://localhost:5000 in your browser.
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import urllib.request
import urllib.error

app = Flask(__name__, static_folder='..')
CORS(app)

API_BASE = "https://api.minimax.io/v1/chat/completions"
MODEL = "MiniMax-M2.7"

SYSTEM_PROMPT = """You are a cognitive analysis engine. Your job is to analyze two versions of a person's thinking and identify what changed beneath the surface.

For any two versions of an idea, produce three insights:

1. ASSUMPTION SHIFT: What underlying beliefs or frameworks changed between Version A and Version B? What did the person stop believing and start believing? Be specific and analytical.

2. HIDDEN BLIND SPOT: What critical angle, constraint, or question does NEITHER version address? What's the thing both drafts are missing because they're focused on their own argument?

3. THE SYNTHESIS: A higher-order insight that transcends both versions. Not a compromise — a genuinely new frame that makes both versions partial truths. Should feel like a genuine intellectual contribution.

Respond ONLY in valid JSON format with keys: assumptionShift, blindSpot, synthesis.
Keep each field to 3-5 sentences. Be sharp, specific, and avoid generic advice."""


def call_minimax(api_key, text_a, text_b):
    prompt = f"Version A:\n{text_a}\n\nVersion B:\n{text_b}"
    
    payload = json.dumps({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 1024
    }).encode('utf-8')
    
    req = urllib.request.Request(
        API_BASE,
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        method='POST'
    )
    
    with urllib.request.urlopen(req, timeout=60) as res:
        data = json.loads(res.read().decode('utf-8'))
        content = data['choices'][0]['message']['content']
        
        # Try to parse JSON
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Try extracting from markdown code block
            import re
            match = re.search(r'```(?:json)?\s*([\s\S]*?)```', content)
            if match:
                return json.loads(match.group(1))
            return {
                "assumptionShift": content[:500],
                "blindSpot": "Could not parse structured response from model.",
                "synthesis": "Please try again with clearer inputs."
            }


@app.route('/')
def index():
    return send_from_directory('..', 'index.html')


@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('..', filename)


@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == 'OPTIONS':
        return '', 204
    
    api_key = os.environ.get('MINIMAX_API_KEY')
    if not api_key:
        return jsonify({"error": "MINIMAX_API_KEY not set. Run: export MINIMAX_API_KEY='your-key'"}), 500
    
    data = request.get_json()
    text_a = data.get('textA', '').strip()
    text_b = data.get('textB', '').strip()
    
    if not text_a or not text_b:
        return jsonify({"error": "Missing textA or textB"}), 400
    
    try:
        analysis = call_minimax(api_key, text_a, text_b)
        return jsonify({"analysis": analysis})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("ThinkDelta Local Dev Server")
    print("=" * 50)
    key_status = "SET" if os.environ.get('MINIMAX_API_KEY') else "NOT SET"
    print(f"MINIMAX_API_KEY: {key_status}")
    print("\nOpen http://localhost:5000 in your browser")
    print("Press Ctrl+C to stop")
    print("=" * 50)
    app.run(host='0.0.0.0', port=8765, debug=True)
