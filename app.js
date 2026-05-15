/**
 * ThinkDelta — Cognitive Diff Tool
 * 
 * Architecture:
 * - Static frontend (vanilla JS, no build step)
 * - Curated examples loaded from examples.json (works immediately on GitHub Pages)
 * - Optional live backend proxy for real MiniMax API calls
 * 
 * To enable live API: deploy the backend in /backend/ and update BACKEND_URL below.
 */

(function() {
  'use strict';

  // ============================================
  // CONFIG: Set this to your deployed backend URL
  // ============================================
  // Example: 'https://thinkdelta-api.YOUR_SUBDOMAIN.workers.dev'
  // Leave as empty string '' to use static examples + fallback only
  const BACKEND_URL = '';

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
    actionNote: document.querySelector('.action-note'),
  };

  // State
  let examples = [];
  let activeExampleId = null;
  let backendAvailable = null; // null = not checked yet

  // ============================================
  // LOAD EXAMPLES
  // ============================================
  async function loadExamples() {
    try {
      const res = await fetch('examples.json');
      const data = await res.json();
      examples = data.examples || [];
      renderChips();
      updateModeIndicator();
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
  // UPDATE MODE INDICATOR
  // ============================================
  function updateModeIndicator() {
    if (!BACKEND_URL) {
      els.actionNote.innerHTML = `
        This is a static demo with curated examples. 
        <a href="#architecture" class="link">See architecture notes &darr;</a>
      `;
    } else {
      els.actionNote.innerHTML = `
        Live AI mode enabled. Custom inputs will call the MiniMax API. 
        <a href="#architecture" class="link">See architecture notes &darr;</a>
      `;
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

    try {
      // Priority 1: Exact match in curated examples
      const matched = findMatchingExample(textA, textB);
      if (matched) {
        displayResults(matched.analysis, 'cached');
      }
      // Priority 2: Live backend (if configured and available)
      else if (BACKEND_URL && await isBackendAvailable()) {
        const result = await callBackend(textA, textB);
        displayResults(result.analysis, 'live');
      }
      // Priority 3: Fallback template
      else {
        displayResults(generateFallbackAnalysis(textA, textB), 'fallback');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      displayResults(generateFallbackAnalysis(textA, textB), 'fallback');
    }

    // Reset button
    els.analyzeBtn.classList.remove('analyzing');
    els.analyzeBtn.disabled = false;
    els.analyzeBtn.querySelector('.btn-text').textContent = originalText;
  }

  // ============================================
  // BACKEND AVAILABILITY CHECK
  // ============================================
  async function isBackendAvailable() {
    if (backendAvailable !== null) return backendAvailable;
    if (!BACKEND_URL) {
      backendAvailable = false;
      return false;
    }
    try {
      const res = await fetch(BACKEND_URL, { method: 'OPTIONS', signal: AbortSignal.timeout(3000) });
      backendAvailable = res.ok;
    } catch {
      backendAvailable = false;
    }
    return backendAvailable;
  }

  // ============================================
  // CALL LIVE BACKEND
  // ============================================
  async function callBackend(textA, textB) {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textA, textB })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Backend error: ${res.status}`);
    }

    return await res.json();
  }

  // ============================================
  // FIND MATCHING EXAMPLE (by text similarity)
  // ============================================
  function findMatchingExample(textA, textB) {
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
  function displayResults(analysis, source) {
    els.textShift.textContent = analysis.assumptionShift;
    els.textBlind.textContent = analysis.blindSpot;
    els.textSynthesis.textContent = analysis.synthesis;

    // Update model badge based on source
    const modelBadge = document.querySelector('.results-model');
    if (modelBadge) {
      if (source === 'live') {
        modelBadge.textContent = 'Powered by MiniMax M2.7 (Live)';
        modelBadge.style.color = '#4ade80';
      } else if (source === 'cached') {
        modelBadge.textContent = 'Powered by MiniMax M2.7 (Cached)';
        modelBadge.style.color = '#8888a0';
      } else {
        modelBadge.textContent = 'Template Analysis (Backend Not Connected)';
        modelBadge.style.color = '#555566';
      }
    }

    els.resultsSection.classList.add('visible');
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
  // EVENT LISTENERS
  // ============================================
  els.analyzeBtn.addEventListener('click', analyzeThinking);

  els.inputA.addEventListener('input', () => {
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
