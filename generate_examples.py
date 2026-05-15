#!/usr/bin/env python3
"""
ThinkDelta — Example Generator
==============================
This script generates real MiniMax API responses for the curated examples
used in the ThinkDelta demo.

Usage:
    export MINIMAX_API_KEY="your-key-here"
    python3 generate_examples.py

Or:
    python3 generate_examples.py --key YOUR_KEY

The output is written to examples.json, which the frontend loads.

Note: This requires a valid MiniMax API key from https://api.minimax.io
"""

import json
import os
import sys
import argparse
import urllib.request
import urllib.error

# ============================================
# CONFIG
# ============================================
API_BASE = "https://api.minimax.io/v1/chat/completions"
MODEL = "MiniMax-M2.7"

SYSTEM_PROMPT = """You are a cognitive analysis engine. Your job is to analyze two versions of a person's thinking and identify what changed beneath the surface.

For any two versions of an idea, produce three insights:

1. ASSUMPTION SHIFT: What underlying beliefs or frameworks changed between Version A and Version B? What did the person stop believing and start believing? Be specific and analytical.

2. HIDDEN BLIND SPOT: What critical angle, constraint, or question does NEITHER version address? What's the thing both drafts are missing because they're focused on their own argument?

3. THE SYNTHESIS: A higher-order insight that transcends both versions. Not a compromise — a genuinely new frame that makes both versions partial truths. Should feel like a genuine intellectual contribution.

Respond in JSON format with keys: assumptionShift, blindSpot, synthesis.
Keep each field to 3-5 sentences. Be sharp, specific, and avoid generic advice."""

# ============================================
# EXAMPLE DATA
# ============================================
EXAMPLES = [
    {
        "id": "essay-revision",
        "label": "Essay Revision",
        "icon": "📝",
        "titleA": "Messy First Draft",
        "titleB": "Final Polished Essay",
        "textA": """AI is going to change everything. Like, literally everything. Jobs will be gone, people will be sad, and the world will be different. We need to be careful but also excited. I think it's a big deal and everyone should pay attention. The future is unknown but AI is the key to it all. Companies are investing billions. It's scary but also cool.""",
        "textB": """AI represents the most significant labor-market disruption since the Industrial Revolution. Unlike previous technological shifts, AI targets cognitive work — the very domain that defined 20th-century economic growth. The transition won't be binary (jobs lost vs. jobs created); it'll be a reconfiguration of task boundaries within roles. The real question isn't whether AI will change work — it will — but whether we'll build social infrastructure (retraining, safety nets, labor mobility) at the speed that technology demands."""
    },
    {
        "id": "argument-evolution",
        "label": "Argument Evolution",
        "icon": "⚔️",
        "titleA": "Weak Take",
        "titleB": "Strong Counter-Argument",
        "textA": """Remote work is bad for companies. People are less productive at home. They get distracted. The office has better collaboration and everyone should just come back. Culture suffers when people aren't together. It's just common sense.""",
        "textB": """The return-to-office debate is a category error. It's not about remote vs. office — it's about which *types* of work benefit from co-location and which don't. Deep individual work (writing, coding, analysis) thrives in quiet, controlled environments. Coordination-heavy work (brainstorming, negotiation, rapid iteration) benefits from proximity. The real failure mode isn't remote work; it's management that hasn't learned to design hybrid workflows with intentionality. Companies demanding full RTO are often outsourcing their management incompetence to geography."""
    },
    {
        "id": "product-pivot",
        "label": "Product Pivot",
        "icon": "🚀",
        "titleA": "Early Pitch",
        "titleB": "Revised Pitch",
        "textA": """Our app helps students find study groups. You create a profile, list your classes, and match with other students in the same courses. We have chat, scheduling, and file sharing. It's like Tinder but for studying. We have 500 beta users at Stanford. The market is huge — every college student needs this.""",
        "textB": """We're building the coordination layer for informal learning. Universities have optimized for formal instruction (lectures, grades, credentials) but the real learning happens in the gaps: late-night problem sets, peer explanations, accountability structures. We don't match students to other students; we match *learning intents* to *learning contexts*. A student stuck on dynamic programming doesn't need a friend — they need someone who just solved that exact problem, right now, in a format that fits their cognitive state (text, voice, screen-share, or asynchronous walkthrough)."""
    },
    {
        "id": "personal-growth",
        "label": "Personal Growth",
        "icon": "🌱",
        "titleA": "January Journal",
        "titleB": "June Reflection",
        "textA": """I need to be more productive. I'm wasting too much time on social media and not doing enough. Everyone else seems to have their life together. I should wake up at 5am, read more books, and stop procrastinating. Maybe I need a better routine or an accountability partner. I feel behind.""",
        "textB": """My struggle isn't productivity — it's avoidance of meaningful commitment. Social media isn't a time-waster; it's an emotional regulator that numbs the anxiety of not knowing what I actually want. Waking up at 5am won't help if I'm avoiding the harder question: what would I do with the extra hours? 'Behind' is a meaningless metric when you haven't defined the race. The real work isn't optimizing my schedule; it's sitting with the discomfort of wanting things I'm afraid to pursue."""
    },
    {
        "id": "code-explanation",
        "label": "Code Explanation",
        "icon": "💻",
        "titleA": "Naive Approach",
        "titleB": "Optimized Algorithm",
        "textA": """To find duplicates in a list, I loop through every element and for each one, I loop through the rest of the list to see if it appears again. If it does, I add it to a result list. Time complexity is O(n^2) which is fine for small lists. I use a nested for loop. It's simple and easy to understand.""",
        "textB": """The naive nested-loop approach treats the duplicate-detection problem as a pairwise comparison task, which is correct but inefficient. A better framing: this is a frequency-counting problem. By using a hash map (or set), we reduce time complexity to O(n) with O(n) space. But the deeper insight is recognizing that 'find duplicates' is underspecified — are we looking for any duplicate, all duplicates, or the first duplicate? Each variant changes the optimal approach. The real skill isn't knowing the hash map trick; it's learning to classify problems by their underlying structure rather than their surface description."""
    },
    {
        "id": "philosophical-debate",
        "label": "Philosophical Debate",
        "icon": "🧠",
        "titleA": "Position A",
        "titleB": "Position B",
        "textA": """Free will is an illusion. Every decision we make is determined by prior causes — genetics, environment, neurochemistry. If you could rewind the universe to the exact same state, you'd make the exact same choice. The feeling of choosing is just the brain narrating after the fact. This doesn't mean we shouldn't have moral responsibility — we should — but we should base it on consequentialist deterrence rather than retributive desert.""",
        "textB": """Determinism at the physical level doesn't imply determinism at the level of reasons. Even if every neuron firing is causally determined, the *content* of our reasoning — the logical structure of arguments, the normative force of reasons — operates at a different level of description. A chess computer's moves are physically determined, but the *correctness* of a move is evaluated by chess rules, not physics. Similarly, our choices are causally embedded but rationally assessable. Free will isn't about escaping causation; it's about acting for reasons we endorse after reflection."""
    }
]

# ============================================
# API CALL
# ============================================
def call_minimax(api_key, text_a, text_b):
    """Call MiniMax API and return parsed JSON analysis."""
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
    
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            data = json.loads(res.read().decode('utf-8'))
            content = data['choices'][0]['message']['content']
            # Try to parse JSON from content
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # Fallback: extract fields from text
                return parse_fallback(content)
    except urllib.error.HTTPError as e:
        print(f"API Error: {e.code} - {e.read().decode()}")
        raise
    except Exception as e:
        print(f"Request failed: {e}")
        raise


def parse_fallback(text):
    """Fallback parser if MiniMax doesn't return clean JSON."""
    result = {"assumptionShift": "", "blindSpot": "", "synthesis": ""}
    
    lines = text.split('\n')
    current_key = None
    buffer = []
    
    for line in lines:
        lower = line.lower()
        if 'assumption' in lower and 'shift' in lower:
            if current_key:
                result[current_key] = '\n'.join(buffer).strip()
            current_key = 'assumptionShift'
            buffer = []
        elif 'blind' in lower and 'spot' in lower:
            if current_key:
                result[current_key] = '\n'.join(buffer).strip()
            current_key = 'blindSpot'
            buffer = []
        elif 'synthesis' in lower:
            if current_key:
                result[current_key] = '\n'.join(buffer).strip()
            current_key = 'synthesis'
            buffer = []
        elif current_key:
            buffer.append(line)
    
    if current_key:
        result[current_key] = '\n'.join(buffer).strip()
    
    return result


# ============================================
# MAIN
# ============================================
def main():
    parser = argparse.ArgumentParser(description='Generate ThinkDelta examples with MiniMax API')
    parser.add_argument('--key', help='MiniMax API key (or set MINIMAX_API_KEY env var)')
    parser.add_argument('--output', default='examples.json', help='Output file path')
    args = parser.parse_args()
    
    api_key = args.key or os.environ.get('MINIMAX_API_KEY')
    if not api_key:
        print("Error: MiniMax API key required. Use --key or set MINIMAX_API_KEY env var.")
        sys.exit(1)
    
    print(f"Generating {len(EXAMPLES)} examples with MiniMax {MODEL}...")
    print("This may take a few minutes.\n")
    
    generated = []
    for i, ex in enumerate(EXAMPLES, 1):
        print(f"[{i}/{len(EXAMPLES)}] {ex['label']}...", end=' ', flush=True)
        try:
            analysis = call_minimax(api_key, ex['textA'], ex['textB'])
            generated.append({
                "id": ex['id'],
                "label": ex['label'],
                "icon": ex['icon'],
                "titleA": ex['titleA'],
                "titleB": ex['titleB'],
                "textA": ex['textA'],
                "textB": ex['textB'],
                "analysis": analysis
            })
            print("OK")
        except Exception as e:
            print(f"FAILED: {e}")
            # Continue with other examples
    
    output = {"examples": generated}
    
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\nDone! Wrote {len(generated)} examples to {args.output}")


if __name__ == '__main__':
    main()
