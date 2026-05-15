/**
 * ThinkDelta — Cognitive Diff Tool
 * 
 * Architecture:
 * - Static frontend (vanilla JS, no build step)
 * - Curated examples loaded from examples.json
 * - Live API code is present but commented out
 * - To enable live MiniMax API: uncomment the API block below
 *   and point it to your backend proxy (Cloudflare Worker, etc.)
 */

(function() {
  'use strict';

  // DOM Elements
  const els = {
    inputA: document.getElementById('inputA'),
    inputB: document.getElementById('inputB'),
    badgeA: document.getElementById('badgeA'),
    badgeB: document.getElementById('badgeB'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    exampleChips: document.getElementById('exampleChips'),
    resultsSection: document.getElementById('resultsSection'),
    textShift: document.getElementById('textShift'),
    textBlind: document.getElementById('textBlind'),
    textSynthesis: document.getElementById('textSynthesis'),
  };

  // State
  let examples = [];
  let activeExampleId = null;

  // ============================================
  // LOAD EXAMPLES
  // ============================================
  async function loadExamples() {
    try {
      const res = await fetch('examples.json');
      const data = await res.json();
      examples = data.examples || [];
      renderChips();
      // Auto-select first example
      if (examples.length > 0) {
        selectExample(examples[0].id);
      }
    } catch (err) {
      console.error('Failed to load examples:', err);
      els.exampleChips.innerHTML = '<span class="chip">Error loading examples</span>';
    }
  }

  // ============================================
  // RENDER EXAMPLE CHIPS
  // ============================================
  function renderChips() {
    els.exampleChips.innerHTML = '';
    examples.forEach(ex => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = `${ex.icon} ${ex.label}`;
      chip.dataset.id = ex.id;
      chip.addEventListener('click', () => selectExample(ex.id));
      els.exampleChips.appendChild(chip);
    });
  }

  // ============================================
  // SELECT EXAMPLE
  // ============================================
  function selectExample(id) {
    const ex = examples.find(e => e.id === id);
    if (!ex) return;

    activeExampleId = id;

    // Update chips
    document.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', c.dataset.id === id);
    });

    // Update inputs
    els.inputA.value = ex.textA;
    els.inputB.value = ex.textB;
    els.badgeA.textContent = ex.titleA;
    els.badgeB.textContent = ex.titleB;

    // Enable analyze button
    els.analyzeBtn.disabled = false;

    // Hide previous results
    els.resultsSection.classList.remove('visible');
  }

  // ============================================
  // ANALYZE THINKING
  // ============================================
  async function analyzeThinking() {
    const textA = els.inputA.value.trim();
    const textB = els.inputB.value.trim();

    if (!textA || !textB) {
      alert('Please enter text in both fields.');
      return;
    }

    // Show analyzing state
    els.analyzeBtn.classList.add('analyzing');
    els.analyzeBtn.disabled = true;
    const originalText = els.analyzeBtn.querySelector('.btn-text').textContent;
    els.analyzeBtn.querySelector('.btn-text').textContent = 'Analyzing';

    // Try to find matching example for instant response
    const matched = findMatchingExample(textA, textB);

    if (matched) {
      // Use cached response
      displayResults(matched.analysis);
    } else {
      // Fallback: show a generic thoughtful response
      // In a live setup, this would call the API
      displayResults(generateFallbackAnalysis(textA, textB));
    }

    // Reset button
    els.analyzeBtn.classList.remove('analyzing');
    els.analyzeBtn.disabled = false;
    els.analyzeBtn.querySelector('.btn-text').textContent = originalText;
  }

  // ============================================
  // FIND MATCHING EXAMPLE (by text similarity)
  // ============================================
  function findMatchingExample(textA, textB) {
    // Simple exact match for demo
    return examples.find(ex => {
      const aMatch = normalize(ex.textA) === normalize(textA);
      const bMatch = normalize(ex.textB) === normalize(textB);
      return aMatch && bMatch;
    });
  }

  function normalize(str) {
    return str.replace(/\s+/g, ' ').trim();
  }

  // ============================================
  // DISPLAY RESULTS
  // ============================================
  function displayResults(analysis) {
    els.textShift.textContent = analysis.assumptionShift;
    els.textBlind.textContent = analysis.blindSpot;
    els.textSynthesis.textContent = analysis.synthesis;

    els.resultsSection.classList.add('visible');

    // Smooth scroll to results
    els.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ============================================
  // FALLBACK ANALYSIS (for custom inputs)
  // ============================================
  function generateFallbackAnalysis(textA, textB) {
    return {
      assumptionShift: `The shift from Version A to Version B reveals a move from surface-level framing to deeper structural analysis. Version A treats the problem as a straightforward matter of ${getTopicHint(textA)}, while Version B introduces layered reasoning about underlying mechanisms, trade-offs, and systemic factors. This suggests a maturation from reactive thinking to intentional design.`,
      blindSpot: `Neither version fully addresses the temporal dimension: what happens when the context changes? Both assume the current constraints are static, but real systems evolve. The missing question is about adaptability and how the reasoning holds under shifting conditions.`,
      synthesis: `The most productive path forward isn't choosing between Version A and Version B, but recognizing they operate at different levels of abstraction. Version A captures the immediate, intuitive understanding; Version B captures the reflective, systems-level view. The real insight is that good thinking requires both: the intuition to start, and the discipline to interrogate that intuition. The next step is asking what evidence would falsify each version — and whether such evidence exists.`
    };
  }

  function getTopicHint(text) {
    const lower = text.toLowerCase();
    if (lower.includes('ai') || lower.includes('machine')) return 'technology adoption';
    if (lower.includes('work') || lower.includes('remote')) return 'workplace dynamics';
    if (lower.includes('code') || lower.includes('algorithm')) return 'technical implementation';
    if (lower.includes('product') || lower.includes('startup')) return 'product strategy';
    if (lower.includes('will') || lower.includes('moral')) return 'philosophical reasoning';
    return 'the stated concern';
  }

  // ============================================
  // LIVE API INTEGRATION (commented out)
  // ============================================
  /*
  async function callMiniMaxAPI(textA, textB) {
    const API_URL = 'https://your-worker.your-subdomain.workers.dev/analyze';
    // Backend proxy required because MiniMax doesn't support CORS
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textA, textB })
    });
    
    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  }
  
  // Proxy implementation (Cloudflare Worker):
  // export default {
  //   async fetch(request, env) {
  //     if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  //     const { textA, textB } = await request.json();
  //     const minimaxRes = await fetch('https://api.minimax.io/v1/chat/completions', {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${env.MINIMAX_API_KEY}`,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({
  //         model: 'MiniMax-M2.7',
  //         messages: [
  //           { role: 'system', content: 'You are a cognitive analysis engine...' },
  //           { role: 'user', content: `Version A: ${textA}\n\nVersion B: ${textB}` }
  //         ],
  //         temperature: 0.7
  //       })
  //     });
  //     return new Response(minimaxRes.body, { headers: { 'Content-Type': 'application/json' } });
  //   }
  // };
  */

  // ============================================
  // EVENT LISTENERS
  // ============================================
  els.analyzeBtn.addEventListener('click', analyzeThinking);

  els.inputA.addEventListener('input', () => {
    // If user modifies text, clear active example
    const ex = examples.find(e => e.id === activeExampleId);
    if (ex && els.inputA.value !== ex.textA) {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      activeExampleId = null;
    }
    els.analyzeBtn.disabled = !(els.inputA.value.trim() && els.inputB.value.trim());
  });

  els.inputB.addEventListener('input', () => {
    const ex = examples.find(e => e.id === activeExampleId);
    if (ex && els.inputB.value !== ex.textB) {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      activeExampleId = null;
    }
    els.analyzeBtn.disabled = !(els.inputA.value.trim() && els.inputB.value.trim());
  });

  // ============================================
  // INIT
  // ============================================
  loadExamples();

})();
