// Shared on every page: the revision chat (bottom-right button) and the
// contact email footer. Pages don't need any markup for either.
//
// The flashcard page can give the chat the card being studied by defining
// window.dkChatCard = () => card; other pages get general grammar tips.
(function () {
  const EMAIL = 'deutschkarten2026@gmail.com';

  // ── Styles ─────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `.chat-fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #f0f0f0;
  color: #080808;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 0 2px 12px rgba(0,0,0,0.6);
  transition: opacity 0.18s, box-shadow 0.2s, transform 0.15s;
  border: none;
  outline: none;
}
.chat-fab:hover {background: #cfcfcf;}
.chat-fab:active { transform: scale(0.95); }
.chat-fab-icon { font-size: 1.2rem; line-height: 1; }

.chat-panel {
  position: fixed;
  bottom: 4.8rem;
  right: 1.5rem;
  width: 340px;
  max-height: 500px;
  background: #0f0f0f;
  border: 1px solid #303030;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  z-index: 9998;
  box-shadow: 0 12px 40px rgba(0,0,0,0.7);
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateY(10px) scale(0.97);
  transition: opacity 0.2s, transform 0.2s;
}
.chat-panel.open { opacity: 1; pointer-events: all; transform: translateY(0) scale(1); }

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid #303030;
  background: #161616;
  flex-shrink: 0;
}
.chat-header-left  { display: flex; align-items: center; gap: 0.6rem; }
.chat-header-icon  { font-size: 1.1rem; color: #ababab; }
.chat-header-title { font-size: 0.85rem; font-weight: 700; color: #f0f0f0; letter-spacing: -0.02em; }
.chat-header-sub   { font-size: 0.6rem; font-family: 'JetBrains Mono', monospace; color: #7c7c7c; margin-top: 1px; }
.chat-close {
  background: none; border: none; color: #7c7c7c; cursor: pointer;
  font-size: 0.8rem; padding: 3px 5px; border-radius: 4px;
  transition: color 0.15s;
}
.chat-close:hover { color: #f0f0f0; }

/* ── Gemini prompt section ── */
.gemini-section {
  border-top: 1px solid #303030;
  padding: 0.75rem 0.85rem;
  background: #161616;
  flex-shrink: 0;
}
.gemini-label {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7c7c7c;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.gemini-label::before {
  content: '';
  display: inline-block;
  width: 12px;
  height: 1px;
  background: #7c7c7c;
}
.gemini-prompt-box {
  background: #080808;
  border: 1px solid #303030;
  border-radius: 6px;
  padding: 0.6rem 0.75rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.62rem;
  line-height: 1.6;
  color: #ababab;
  max-height: 120px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #303030 transparent;
  white-space: pre-wrap;
  user-select: all;
  cursor: text;
  margin-bottom: 0.5rem;
}
.gemini-prompt-box::-webkit-scrollbar { width: 3px; }
.gemini-prompt-box::-webkit-scrollbar-thumb { background: #303030; border-radius: 2px; }
.gemini-actions {
  display: flex;
  gap: 0.4rem;
}
.gemini-copy-btn {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  border: 1px solid #303030;
  background: transparent;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  color: #7c7c7c;
  cursor: pointer;
  transition: color 100ms cubic-bezier(0.4, 0, 0.2, 1),
              border-color 100ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 160ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
}
.gemini-copy-btn:hover { color: #f0f0f0; border-color: #7c7c7c; box-shadow: 0 0 0 transparent; }
.gemini-open-btn {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  border: none;
  background: #f0f0f0;
  color: #080808;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  transition: opacity 100ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 160ms cubic-bezier(0.4, 0, 0.2, 1);
}
.gemini-open-btn:hover {background: #cfcfcf;}
.gemini-toggle {
  width: 100%;
  background: transparent;
  border: 1px dashed #303030;
  border-radius: 4px;
  padding: 0.35rem 0.6rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  color: #7c7c7c;
  cursor: pointer;
  transition: color 100ms cubic-bezier(0.4, 0, 0.2, 1), border-color 100ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin-top: 0.5rem;
}
.gemini-toggle:hover { color: #ababab; border-color: #7c7c7c; }
.gemini-expanded { display: none; }
.gemini-expanded.open { display: block; }

.chat-messages {
  flex: 1; overflow-y: auto; padding: 0.85rem;
  display: flex; flex-direction: column; gap: 0.65rem;
  scrollbar-width: thin; scrollbar-color: #303030 transparent;
}
.chat-msg { display: flex; }
.chat-msg-ai   { justify-content: flex-start; }
.chat-msg-user { justify-content: flex-end; }
.chat-msg-bubble {
  max-width: 85%;
  padding: 0.55rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  line-height: 1.55;
  font-family: 'Bricolage Grotesque', sans-serif;
}
.chat-msg-ai .chat-msg-bubble {
  background: #161616;
  border: 1px solid #303030;
  color: #f0f0f0;
  border-bottom-left-radius: 4px;
}
.chat-msg-user .chat-msg-bubble {
  background: #f0f0f0;
  color: #080808;
  border-bottom-right-radius: 4px;
  font-weight: 600;
}
.chat-typing .chat-msg-bubble { color: #7c7c7c; font-style: italic; }

.chat-input-row {
  display: flex; gap: 0.45rem; padding: 0.7rem 0.85rem;
  border-top: 1px solid #303030; background: #161616; flex-shrink: 0;
}
.chat-input {
  flex: 1;
  background: #080808;
  border: 1px solid #303030;
  border-radius: 6px;
  padding: 0.45rem 0.75rem;
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 0.8rem;
  color: #f0f0f0;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.chat-input:focus { border-color: #ababab; box-shadow: 0 0 12px rgba(255,255,255,0.04); }
.chat-input::placeholder { color: #7c7c7c; }
.chat-send {
  width: 32px; height: 32px;
  border-radius: 6px;
  border: none;
  background: #f0f0f0;
  color: #080808;
  font-size: 0.9rem; font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s, box-shadow 0.15s; flex-shrink: 0;
}
.chat-send:hover {background: #cfcfcf;}
.chat-send:active { transform: scale(0.92); }
.chat-send:disabled { opacity: 0.25; cursor: not-allowed; }

@media (max-width: 500px) {
  .chat-panel { width: calc(100vw - 2rem); right: 1rem; bottom: 4.5rem; }
  .chat-fab   { bottom: 1.1rem; right: 1rem; }
}

/* "When in doubt" bubble next to the robot button */
.robo-bubble {
  position: fixed; z-index: 9997; display: none; align-items: center; gap: 2px;
  max-width: min(300px, calc(100vw - 96px));
  background: #f0f0f0; color: #080808; border-radius: 12px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.5);
  animation: roboIn 220ms ease-out;
}
.robo-bubble.show { display: flex; }
.robo-bubble::after {
  content: ''; position: absolute; right: -6px; top: 50%; margin-top: -6px;
  border: 6px solid transparent; border-right: 0; border-left-color: #f0f0f0;
}
.robo-bubble.below::after {
  right: 18px; top: -6px; margin-top: 0;
  border: 6px solid transparent; border-top: 0; border-bottom-color: #f0f0f0;
}
.robo-bubble-text {
  background: none; border: none; cursor: pointer; text-align: left;
  padding: 10px 4px 10px 14px; font: 600 0.82rem/1.35 'Bricolage Grotesque', system-ui, sans-serif; color: #080808;
}
.robo-bubble-close {
  flex-shrink: 0; width: 28px; height: 28px; margin-right: 6px; border-radius: 6px;
  background: none; border: none; cursor: pointer; color: #555; font-size: 0.75rem;
}
.robo-bubble-close:hover { background: #dcdcdc; color: #080808; }
@keyframes roboIn { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .robo-bubble { animation: none; } }

/* Suggested questions and word-type tags in the chat */
.chat-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 2px 0 4px; }
.chat-chip {
  border: 1px solid #3d3d3d; background: #161616; color: #f0f0f0; border-radius: 999px;
  padding: 6px 10px; font: 0.75rem 'Bricolage Grotesque', system-ui, sans-serif; cursor: pointer; text-align: left;
}
.chat-chip:hover { border-color: #ababab; }
.chat-meta { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: #7c7c7c; margin-left: 4px; }
.chat-msg-bubble a { color: inherit; }

.dk-footer {
  position: relative; z-index: 1;
  padding: 24px 28px 28px; border-top: 1px solid #303030;
  font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #7c7c7c;
  background: #080808;
}
.dk-footer a { color: #f0f0f0; text-underline-offset: 3px; }
.dk-footer a:hover { color: #ababab; }
.chat-fab.chat-fab-docked {
  position: static; width: 40px; height: 40px; box-shadow: none;
  background: none; color: #f0f0f0; border-radius: 6px;
}
.chat-fab.chat-fab-docked:hover { background: #1e1e1e; }
.chat-fab.chat-fab-docked svg { width: 26px; height: 26px; }
.dk-footer-pinned {
  position: fixed; left: 0; right: 0; bottom: 0;
  border-top: none; background: transparent; text-align: center; padding: 16px 72px;
}
@media (max-width: 700px) {
  .dk-footer { padding: 20px 16px 84px; }
  .dk-footer-pinned { padding: 12px 72px 16px 16px; text-align: left; }
}`;
  document.head.appendChild(style);

  // ── Chat markup ────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.innerHTML = '<div class="robo-bubble" id="roboBubble" role="status">'
    + '<button type="button" class="robo-bubble-text" onclick="dkChat.open()">When in doubt, talk to Mr. RoboMax</button>'
    + '<button type="button" class="robo-bubble-close" onclick="dkChat.hideBubble()" aria-label="Hide this tip">✕</button></div>'
    + "<div class=\"chat-fab\" id=\"chatFab\" onclick=\"dkChat.toggle()\" title=\"Talk to Mr. RoboMax\" role=\"button\" tabindex=\"0\" aria-label=\"Open Mr. RoboMax, the German help chat\">\n  <svg width=\"30\" height=\"30\" viewBox=\"0 0 30 30\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <!-- German Bavarian hat (Tyrolean) -->\n    <ellipse cx=\"15\" cy=\"9\" rx=\"9\" ry=\"2.2\" fill=\"#1a1a1a\"/>\n    <path d=\"M8 9 Q8 4 15 4 Q22 4 22 9Z\" fill=\"#2d2d2d\"/>\n    <path d=\"M9 8.5 Q15 5.5 21 8.5\" stroke=\"#e8b84b\" stroke-width=\"1.2\" fill=\"none\" stroke-linecap=\"round\"/>\n    <!-- little feather -->\n    <path d=\"M20 5.5 Q22 3 21.5 6.5\" stroke=\"var(--g1)\" stroke-width=\"1\" fill=\"none\" stroke-linecap=\"round\"/>\n    <!-- Robot head -->\n    <rect x=\"8\" y=\"10\" width=\"14\" height=\"11\" rx=\"3\" fill=\"currentColor\" opacity=\"0.15\"/>\n    <rect x=\"8\" y=\"10\" width=\"14\" height=\"11\" rx=\"3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"/>\n    <!-- Eyes -->\n    <rect x=\"10.5\" y=\"13\" width=\"3.5\" height=\"2.5\" rx=\"1\" fill=\"currentColor\"/>\n    <rect x=\"16\" y=\"13\" width=\"3.5\" height=\"2.5\" rx=\"1\" fill=\"currentColor\"/>\n    <!-- Mouth -->\n    <path d=\"M11.5 18 Q15 19.5 18.5 18\" stroke=\"currentColor\" stroke-width=\"1.2\" fill=\"none\" stroke-linecap=\"round\"/>\n    <!-- Antenna -->\n    <line x1=\"15\" y1=\"10\" x2=\"15\" y2=\"8\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\"/>\n    <circle cx=\"15\" cy=\"7.5\" r=\"0.8\" fill=\"currentColor\"/>\n    <!-- Body stub -->\n    <rect x=\"11\" y=\"21\" width=\"8\" height=\"4\" rx=\"2\" fill=\"currentColor\" opacity=\"0.5\"/>\n  </svg>\n</div>\n\n<div class=\"chat-panel\" id=\"chatPanel\">\n  <div class=\"chat-header\">\n    <div class=\"chat-header-left\">\n      <div>\n        <div class=\"chat-header-title\">Mr. RoboMax</div>\n        <div class=\"chat-header-sub\">Word lookup · grammar help · speaking practice</div>\n      </div>\n    </div>\n    <div style=\"display:flex;gap:0.3rem;align-items:center;\">\n      <button class=\"chat-close\" onclick=\"dkChat.toggle()\" aria-label=\"Close chat\">✕</button>\n    </div>  </div>\n  <div class=\"chat-messages\" id=\"chatMessages\">\n    <div class=\"chat-msg chat-msg-ai\">\n      <span class=\"chat-msg-bubble\">Hallo! I'm <strong>Mr. RoboMax</strong>. I can look up any word on DeutschKarten, tell you if a noun is <strong>der, die or das</strong>, and explain grammar. Tap a question below or type your own.</span>\n    </div>\n  </div>\n  <div class=\"chat-input-row\">\n    <input class=\"chat-input\" id=\"chatInput\" type=\"text\" placeholder=\"e.g. what does Erfolg mean?\" aria-label=\"Ask Mr. RoboMax\" onkeydown=\"if(event.key==='Enter')dkChat.send()\">\n    <button class=\"chat-send\" id=\"chatSend\" onclick=\"dkChat.send()\" aria-label=\"Send\">↑</button>\n  </div>\n\n  <div class=\"gemini-section\">\n    <button class=\"gemini-toggle\" onclick=\"dkChat.toggleGemini()\">\n      <span id=\"geminiToggleIcon\">+</span>\n      <span id=\"geminiToggleLabel\">Practice speaking German with AI</span>\n    </button>\n    <div class=\"gemini-expanded\" id=\"geminiExpanded\">\n      <div class=\"gemini-label\" style=\"margin-top:.65rem\">Copy this prompt → paste into Gemini</div>\n      <div class=\"gemini-prompt-box\" id=\"geminiPromptBox\"></div>\n      <div class=\"gemini-actions\">\n        <button class=\"gemini-copy-btn\" onclick=\"dkChat.copyPrompt()\" id=\"geminiCopyBtn\">⎘ Copy prompt</button>\n        <a class=\"gemini-open-btn\" href=\"https://gemini.google.com\" target=\"_blank\" rel=\"noopener\">Open Gemini ↗</a>\n      </div>\n    </div>\n  </div>\n</div>";
  [...wrap.children].forEach(el => document.body.appendChild(el));

  // ── Contact footer, unless the page already shows the email ──
  if (!document.querySelector(`a[href="mailto:${EMAIL}"]`)) {
    const footer = document.createElement('footer');
    footer.className = 'dk-footer';
    footer.innerHTML = `contact <a href="mailto:${EMAIL}">${EMAIL}</a> for queries or recommendations`;
    // Pages laid out as one centred row (sign-in) get the line pinned to the bottom edge
    const bs = getComputedStyle(document.body);
    if (bs.display.includes('flex') && !bs.flexDirection.startsWith('column')) footer.classList.add('dk-footer-pinned');
    document.body.appendChild(footer);
  }

  // Pages with a game toolbar (Wördle) get the robot as an icon in the toolbar,
  // so it never covers the on-screen keyboard; the chat then opens downwards.
  const toolbar = document.querySelector('.game-bar-right');
  if (toolbar) {
    const fab = document.getElementById('chatFab');
    fab.classList.add('chat-fab-docked');
    toolbar.prepend(fab);
  }
  function placeFab() {
    const fab = document.getElementById('chatFab');
    const panel = document.getElementById('chatPanel');
    if (!fab || !fab.classList.contains('chat-fab-docked')) return;
    const r = fab.getBoundingClientRect();
    panel.style.top = (r.bottom + 8) + 'px';
    panel.style.bottom = 'auto';
  }
  // The bubble sits just left of the robot button, vertically centred on it
  function placeBubble() {
    const fab = document.getElementById('chatFab'), bubble = document.getElementById('roboBubble');
    if (!fab || !bubble.classList.contains('show')) return;
    const r = fab.getBoundingClientRect();
    if (fab.classList.contains('chat-fab-docked')) {
      // Robot in a toolbar: bubble hangs below it
      bubble.classList.add('below');
      bubble.style.right = Math.max(8, window.innerWidth - r.right - 4) + 'px';
      bubble.style.top = (r.bottom + 10) + 'px';
      return;
    }
    bubble.style.right = (window.innerWidth - r.left + 12) + 'px';
    bubble.style.top = (r.top + r.height / 2 - bubble.offsetHeight / 2) + 'px';
  }
  function showBubble() { document.getElementById('roboBubble').classList.add('show'); placeBubble(); }
  function hideBubble() {
    document.getElementById('roboBubble').classList.remove('show');
    try { sessionStorage.setItem('dk_robo_bubble_seen', '1'); } catch (e) {}
  }
  const reposition = () => { placeFab(); placeBubble(); };
  window.addEventListener('resize', reposition);
  window.addEventListener('load', reposition);
  placeFab();

  // ── Chat logic ─────────────────────────────────────────────
  // Offline revision assistant: rule-based grammar tips, no server needed

  let chatOpen = false;
  let chatBusy = false;

  let suggestionsShown = false;
  function toggleChat() {
    chatOpen = !chatOpen;
    document.getElementById('chatPanel').classList.toggle('open', chatOpen);
    if (chatOpen) {
      hideBubble();
      loadWords();
      if (!suggestionsShown) { addSuggestions(); suggestionsShown = true; }
      setTimeout(() => document.getElementById('chatInput').focus(), 250);
    }
  }
  function openChat() { if (!chatOpen) toggleChat(); }

  // Once per visit: show the bubble shortly after the page loads
  let bubbleSeen = false;
  try { bubbleSeen = sessionStorage.getItem('dk_robo_bubble_seen') === '1'; } catch (e) {}
  if (!bubbleSeen) setTimeout(() => { if (!chatOpen) showBubble(); }, 1200);

  document.getElementById('chatFab').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChat(); }
  });

  function chatAddMsg(role, text) {
    const messages = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-msg ' + (role === 'user' ? 'chat-msg-user' : 'chat-msg-ai');
    const bubble = document.createElement('span');
    bubble.className = 'chat-msg-bubble';
    bubble.innerHTML = text.replace(/\n/g,'<br>');
    div.appendChild(bubble);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  function chatAddTyping() {
    const messages = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg-ai chat-typing';
    div.id = 'chatTyping';
    const bubble = document.createElement('span');
    bubble.className = 'chat-msg-bubble';
    bubble.textContent = 'Thinking…';
    div.appendChild(bubble);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function chatRemoveTyping() {
    const t = document.getElementById('chatTyping');
    if (t) t.remove();
  }

  // ── Rule-based response engine ──────────────────────────────

  const TIPS = {
    der: [
      "<strong>der</strong> = masculine. Memory trick: think of strong, bold things: <em>der Mann, der Berg, der Hund</em>.",
      "Masculine nouns often end in <strong>-er, -en, -el</strong> (der Lehrer, der Wagen, der Mantel).",
      "Days, months, seasons and compass points are all <em>der</em>: <em>der Montag, der Januar, der Sommer, der Norden</em>.",
    ],
    die: [
      "<strong>die</strong> = feminine. Memory trick: think of elegant, flowing things: <em>die Frau, die Blume, die Stadt</em>.",
      "Nouns ending in <strong>-ung, -heit, -keit, -schaft, -tion, -tät</strong> are almost always <em>die</em>: <em>die Wohnung, die Freiheit, die Nation</em>.",
      "Most nouns ending in <strong>-e</strong> are feminine: <em>die Straße, die Küche, die Sprache</em>.",
    ],
    das: [
      "<strong>das</strong> = neuter. Memory trick: think of small, young, or diminutive things: <em>das Kind, das Baby, das Mädchen</em>.",
      "Diminutives ending in <strong>-chen</strong> or <strong>-lein</strong> are always <em>das</em>: <em>das Mädchen, das Büchlein</em>.",
      "Nouns ending in <strong>-ment, -um, -tum</strong> are usually neuter: <em>das Dokument, das Zentrum, das Reichtum</em>.",
    ],
    artikel: [
      "German has 3 articles: <strong>der</strong> (masc), <strong>die</strong> (fem), <strong>das</strong> (neuter). Always learn the article with the noun, and treat <em>der Tisch</em> as one word, not two!",
      "A great trick: colour-code your notes: blue for <em>der</em>, red for <em>die</em>, green for <em>das</em>. Your brain remembers colour associations well.",
      "There's no perfect rule for articles, but endings help: <em>-ung, -heit → die</em> | <em>-chen, -lein → das</em> | <em>-er (agent nouns) → der</em>.",
    ],
    akkusativ: [
      "Akkusativ = the <strong>direct object</strong> (what receives the action). Only <em>der</em> changes: <em>der → den</em>.\n<em>Ich sehe <strong>den</strong> Mann.</em>",
      "Key Akkusativ prepositions: <strong>durch, für, gegen, ohne, um</strong> always trigger Akkusativ.\n<em>Das ist ein Geschenk <strong>für</strong> meinen Vater.</em>",
      "Akkusativ verbs take a direct object: haben, sehen, hören, kaufen, nehmen, essen, trinken, lieben, kennen, finden.",
    ],
    dativ: [
      "Dativ = the <strong>indirect object</strong> (to/for whom). Changes: <em>der→dem, die→der, das→dem, die(pl)→den+n</em>.\n<em>Ich gebe <strong>dem</strong> Mann das Buch.</em>",
      "Key Dativ prepositions: <strong>mit, nach, bei, seit, von, zu, aus, gegenüber</strong> always take Dativ.\n<em>Ich fahre <strong>mit dem</strong> Bus.</em>",
      "Dativ verbs: helfen, danken, gefallen, gehören, glauben, folgen, passen, schmecken. These take Dativ, not Akkusativ.",
    ],
    genitiv: [
      "Genitiv = possession. <em>der→des+s, die→der, das→des+s</em>.\n<em>Das ist das Auto <strong>des Mannes</strong>.</em>",
      "In spoken German, <em>von + Dativ</em> often replaces Genitiv: <em>das Auto von dem Mann</em>. Genitiv is more formal/written.",
      "Key Genitiv prepositions: <strong>wegen, trotz, während, statt</strong>.\n<em><strong>Wegen des</strong> Wetters bleibe ich zuhause.</em>",
    ],
    nominativ: [
      "Nominativ = the <strong>subject</strong> of the sentence (who is doing the action).\n<em><strong>Der Mann</strong> kauft ein Buch.</em>",
      "After <em>sein</em> (to be) and <em>werden</em> (to become), use Nominativ, not Akkusativ.\n<em>Er ist <strong>ein guter Lehrer</strong>.</em>",
    ],
    perfekt: [
      "Perfekt = past tense used in spoken German. Structure: <strong>haben/sein + Partizip II</strong>.\n<em>Ich <strong>habe</strong> gegessen. / Ich <strong>bin</strong> gegangen.</em>",
      "Use <strong>sein</strong> for verbs of movement (gehen, fahren, kommen, fliegen) and change of state (aufwachen, sterben).\nEverything else uses <strong>haben</strong>.",
      "Regular Partizip II: <em>ge- + stem + -t</em> → <em>ge<strong>mach</strong>t, ge<strong>kauf</strong>t</em>.\nIrregular: <em>gegessen, getrunken, gesehen, gegangen</em>. Learn these by heart.",
    ],
    praeteritum: [
      "Präteritum = written past tense (novels, reports). Modal verbs always use Präteritum in speech:\n<em>Ich <strong>musste</strong> arbeiten. / Sie <strong>konnte</strong> nicht kommen.</em>",
      "Sein and haben also use Präteritum in speech: <em>Ich <strong>war</strong> müde. / Er <strong>hatte</strong> Hunger.</em>",
    ],
    konjunktiv: [
      "Konjunktiv II = polite requests and hypotheticals.\n<em>Ich <strong>würde</strong> gern kommen. / <strong>Könnten</strong> Sie mir helfen?</em>",
      "Key forms to memorise: <em>wäre (sein), hätte (haben), würde (werden), könnte (können), müsste (müssen)</em>.",
    ],
    trennbar: [
      "Separable verbs split in main clauses, and the prefix goes to the end.\n<em>Ich <strong>stehe</strong> um 7 Uhr <strong>auf</strong>.</em>\nBut stay together in subordinate clauses:\n<em>…weil ich um 7 Uhr <strong>aufstehe</strong>.</em>",
      "Common separable prefixes: <strong>auf-, an-, aus-, ab-, ein-, mit-, nach-, vor-, zu-, zurück-</strong>.",
      "In infinitive constructions with modals, the verb stays together:\n<em>Ich muss früh <strong>aufstehen</strong>.</em>",
    ],
    reflexiv: [
      "Reflexive verbs use a reflexive pronoun (mich/mir, dich/dir, sich…).\n<em>Ich <strong>freue mich</strong> auf den Urlaub.</em>",
      "Common reflexive verbs: sich freuen, sich erinnern, sich vorstellen, sich beeilen, sich entschuldigen, sich interessieren für.",
      "Akkusativ reflexive: <em>ich wasche <strong>mich</strong></em> | Dativ reflexive (when there's another object): <em>ich wasche <strong>mir</strong> die Hände</em>.",
    ],
    modal: [
      "Modal verbs: <strong>können, müssen, dürfen, sollen, wollen, mögen/möchten</strong>.\nThey send the infinitive to the END:\n<em>Ich <strong>kann</strong> gut Deutsch <strong>sprechen</strong>.</em>",
      "Meanings: können=can | müssen=must | dürfen=may/allowed | sollen=should/supposed to | wollen=want to | möchten=would like.",
      "Negative of müssen ≠ not allowed! <em>nicht müssen</em> = don't have to | <em>nicht dürfen</em> = must not.\n<em>Du <strong>musst</strong> nicht kommen</em> ≠ <em>Du <strong>darfst</strong> nicht kommen</em>.",
    ],
    wortschatz: [
      "Best way to build vocabulary: learn words in <strong>context</strong>, not isolated lists. Notice how words appear in sentences.",
      "Use the <strong>spaced repetition</strong> built into this app. It schedules cards just before you'd forget them. Trust the system!",
      "Group words by <strong>word families</strong>: <em>arbeiten → die Arbeit → der Arbeiter → die Arbeitslosigkeit</em>. One root, many words!",
    ],
    gender: [
      "The #1 tip: <strong>always learn the article with the noun</strong>. Don't learn <em>Tisch</em>, learn <em>der Tisch</em>.",
      "Helpful patterns:\n• <em>-ung, -heit, -keit, -schaft, -tion</em> → <strong>die</strong>\n• <em>-chen, -lein, -ment, -um</em> → <strong>das</strong>\n• <em>-er</em> (person doing sth), days/months/seasons → <strong>der</strong>",
      "When in doubt, guess <em>die</em>. It's statistically the most common gender in German!",
    ],
    mnemonic: [
      "For nouns: create a vivid mental image linking the word to its gender colour (blue=der, red=die, green=das).",
      "For verbs: act them out or say them aloud while doing the action. Physical memory is powerful!",
      "Make up a silly sentence using the word. The more ridiculous, the better. Your brain remembers unusual things.",
    ],
    plural: [
      "German plurals are unpredictable, so always learn them with the word.\nCommon patterns: <em>-e (der Tag→Tage), -er (das Kind→Kinder), -en (die Frau→Frauen), -(e)n (die Schwester→Schwestern), umlaut (der Vater→Väter)</em>.",
      "Some nouns don't change in plural: <em>der Lehrer→die Lehrer, das Zimmer→die Zimmer</em>.",
      "Plural article is always <strong>die</strong> regardless of the singular gender: <em>der Mann→die Männer, das Kind→die Kinder</em>.",
    ],
    word: null, // handled dynamically
  };

  // ── Extra grammar topics ───────────────────────────────────
  Object.assign(TIPS, {
    wortstellung: [
      "Main clauses: the conjugated verb is always in <strong>position 2</strong>.\n<em>Heute <strong>gehe</strong> ich ins Kino.</em> (not <em>Heute ich gehe…</em>)",
      "After <strong>weil, dass, obwohl, wenn, ob</strong> the verb goes to the <strong>end</strong>.\n<em>…weil ich keine Zeit <strong>habe</strong>.</em>",
      "Time, manner, place (<strong>TeKaMoLo</strong>): when, why, how, where.\n<em>Ich fahre <strong>morgen</strong> <strong>wegen der Arbeit</strong> <strong>mit dem Zug</strong> <strong>nach Berlin</strong>.</em>",
    ],
    wechsel: [
      "Two-way prepositions: <strong>an, auf, hinter, in, neben, über, unter, vor, zwischen</strong>.\nMovement to a place (<em>wohin?</em>) → <strong>Akkusativ</strong>. Location (<em>wo?</em>) → <strong>Dativ</strong>.",
      "<em>Ich lege das Buch <strong>auf den</strong> Tisch.</em> (wohin? → Akk)\n<em>Das Buch liegt <strong>auf dem</strong> Tisch.</em> (wo? → Dat)",
      "Verb pairs help: <strong>legen/liegen, stellen/stehen, setzen/sitzen, hängen/hängen</strong>. The first of each pair is movement (Akk), the second is position (Dat).",
    ],
    adjektiv: [
      "Adjective endings depend on the article:\n• after <strong>der/die/das</strong>: mostly <em>-e</em> or <em>-en</em> (<em>der gute Mann, den guten Mann</em>)\n• after <strong>ein/kein/mein</strong>: the adjective shows the gender (<em>ein guter Mann, ein gutes Kind</em>)\n• no article: the adjective takes the article's ending (<em>guter Wein, gutes Brot</em>)",
      "Quick rule: if the article already shows the gender and case, the adjective just takes <strong>-e</strong> or <strong>-en</strong>. If it doesn't, the adjective has to show it.",
    ],
    negation: [
      "<strong>kein</strong> negates nouns with <em>ein</em> or no article: <em>Ich habe <strong>kein</strong> Auto.</em>\n<strong>nicht</strong> negates everything else: verbs, adjectives, nouns with <em>der/die/das</em>: <em>Ich kenne den Mann <strong>nicht</strong>.</em>",
      "<strong>nicht</strong> usually goes before the word it negates, or at the end: <em>Das ist <strong>nicht</strong> gut.</em> / <em>Ich komme <strong>nicht</strong>.</em>",
    ],
    uhrzeit: [
      "Telling the time: <em>Es ist drei Uhr.</em> (3:00)\n<em>Viertel nach drei</em> (3:15), <em>halb vier</em> (3:30, half <strong>to</strong> four!), <em>Viertel vor vier</em> (3:45).",
      "Watch out: <strong>halb vier</strong> means 3:30, not 4:30. Germans count halves towards the next hour.",
    ],
    formal: [
      "<strong>du</strong> for friends, family, children and other students. <strong>Sie</strong> (always capital S) for strangers, teachers, officials, at work.\n<em>Kannst <strong>du</strong> mir helfen?</em> / <em>Können <strong>Sie</strong> mir helfen?</em>",
      "Not sure? Start with <strong>Sie</strong>. Germans will tell you if they want to switch: <em>Wir können uns duzen.</em>",
    ],
    konnektoren: [
      "<strong>und, aber, oder, denn, sondern</strong> keep normal word order.\n<strong>weil, dass, obwohl, wenn, als, ob</strong> send the verb to the end.\n<strong>deshalb, trotzdem, dann</strong> take position 1, so the verb comes right after: <em>Deshalb <strong>bleibe</strong> ich zu Hause.</em>",
      "<strong>weil</strong> vs <strong>denn</strong>: same meaning (because), different word order.\n<em>…weil ich müde <strong>bin</strong>.</em> / <em>…denn ich <strong>bin</strong> müde.</em>",
    ],
    fragen: [
      "Question words: <strong>wer</strong> (who), <strong>was</strong> (what), <strong>wo</strong> (where), <strong>wohin</strong> (where to), <strong>woher</strong> (where from), <strong>wann</strong> (when), <strong>warum</strong> (why), <strong>wie</strong> (how), <strong>welche</strong> (which).",
      "Yes/no questions start with the verb: <em><strong>Kommst</strong> du morgen?</em>\nW-questions put the verb second: <em>Wann <strong>kommst</strong> du?</em>",
    ],
    komparativ: [
      "Comparative: add <strong>-er</strong>, often with an umlaut: <em>schnell → schneller, alt → älter</em>.\nSuperlative: <strong>am …sten</strong>: <em>am schnellsten, am ältesten</em>.\nIrregular: <em>gut → besser → am besten, viel → mehr → am meisten, gern → lieber → am liebsten</em>.",
      "<em>als</em> for differences, <em>wie</em> for equality: <em>Er ist größer <strong>als</strong> ich.</em> / <em>Er ist so groß <strong>wie</strong> ich.</em>",
    ],
    futur: [
      "Futur I: <strong>werden + infinitive</strong> at the end: <em>Ich <strong>werde</strong> morgen <strong>arbeiten</strong>.</em>\nIn everyday speech Germans often just use the present tense with a time word: <em>Morgen arbeite ich.</em>",
    ],
    passiv: [
      "Passive: <strong>werden + Partizip II</strong>. Focus on the action, not who does it.\n<em>Das Haus <strong>wird gebaut</strong>.</em> (is being built)\nPast: <em>Das Haus <strong>wurde gebaut</strong>.</em>",
      "Add the doer with <strong>von + Dativ</strong>: <em>Das Buch wurde <strong>von dem</strong> Autor geschrieben.</em>",
    ],
    zahlen: [
      "German says the ones before the tens: <em>21 = einundzwanzig</em> (one-and-twenty), <em>57 = siebenundfünfzig</em>.\nWatch the irregulars: <em>16 = sechzehn, 17 = siebzehn, 30 = dreißig</em>.",
    ],
  });

  // ── Word lookup (words.js is loaded the first time it's needed) ──
  let wordsPromise = null;
  function loadWords() {
    if (window.DK_WORDS) return Promise.resolve(window.DK_WORDS);
    if (!wordsPromise) {
      wordsPromise = new Promise(resolve => {
        const s = document.createElement('script');
        s.src = 'words.js';
        s.onload = () => resolve(window.DK_WORDS || []);
        s.onerror = () => resolve([]);
        document.head.appendChild(s);
      });
    }
    return wordsPromise;
  }

  // Compare words ignoring case, accents and ä/ae spelling
  const norm = s => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const stripArticle = w => w.replace(/^(der|die|das)\s+/i, '');
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
      {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        // Two swapped letters ("Wohnnug") count as one slip
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    return d[a.length][b.length];
  }

  // German word → entries; exact first, then a close spelling
  function findGerman(words, term) {
    const bare = stripArticle(term.trim());
    const t = norm(bare);
    if (!t) return { hits: [], close: null };
    const hits = words.filter(w => norm(stripArticle(w[0])) === t || norm(w[0]) === t);
    if (hits.length || bare.length < 4) return { hits, close: null };
    // Capitalised words are nouns in German, so only guess nouns for them
    const nounOnly = /^[A-ZÄÖÜ]/.test(bare);
    let best = null, bestD = 3;
    for (const w of words) {
      if (nounOnly && w[2] !== 'noun') continue;
      const cand = norm(stripArticle(w[0]));
      if (cand[0] !== t[0]) continue;
      const d = editDistance(cand, t);
      if (d < bestD) { best = w; bestD = d; }
    }
    return { hits: [], close: bestD <= (bare.length >= 9 ? 2 : 1) ? best : null };
  }

  // English word → entries whose meaning contains it as a whole word
  function findEnglish(words, term) {
    const t = norm(term.replace(/^(to|a|an|the)\s+/i, ''));
    if (!t) return [];
    const re = new RegExp('(^|[ /(])(to )?' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[ /),])');
    return words.filter(w => re.test(norm(w[3]))).sort((a, b) => norm(a[3]).length - norm(b[3]).length).slice(0, 4);
  }

  const ENDING_HINTS = [
    [/(ung|heit|keit|schaft|tion|taet|ion|ie|ik|enz|anz)$/, 'die', 'almost always'],
    [/(chen|lein)$/, 'das', 'always'],
    [/(ment|um|tum)$/, 'das', 'usually'],
    [/(ismus|ling|ig|or)$/, 'der', 'usually'],
  ];
  function endingHint(bareNorm) {
    for (const [re, art, how] of ENDING_HINTS) {
      const m = bareNorm.match(re);
      if (m) return { art, text: `nouns ending in <strong>-${m[1].replace('taet', 'tät')}</strong> are ${how} <strong>${art}</strong>` };
    }
    return null;
  }
  function describe(w) {
    const [word, art, type, en, level] = w;
    let line = `<strong>${esc(word)}</strong> = ${esc(en)} <span class="chat-meta">${type}, ${level}</span>`;
    if (type === 'noun' && art && art !== 'Pl.') {
      const hint = endingHint(norm(stripArticle(word)));
      if (hint && hint.art === art) line += `\nTip: ${hint.text}.`;
    }
    if (art === 'Pl.') line += '\nThis one is only used in the plural, so it always takes <strong>die</strong>.';
    return line;
  }

  // A word we don't have: be honest, and use the ending rule when it applies
  function unknownWord(term, askedGender, quietIfNoHint) {
    const bare = stripArticle(term);
    const guess = endingHint(norm(bare));
    if (guess) {
      return `<strong>${esc(bare)}</strong> isn't in the DeutschKarten word list, but ${guess.text}, so it's most likely <strong>${guess.art} ${esc(bare)}</strong>.`
        + (askedGender ? '' : ' For the meaning, try dict.cc.');
    }
    if (quietIfNoHint) return null;
    return `"${esc(bare)}" isn't in the DeutschKarten word list. Check the spelling, or look it up on dict.cc.`;
  }

  // Pull the word out of "what does X mean", "der die oder das X", "how do you say X" ...
  function extract(text, patterns) {
    for (const p of patterns) {
      const m = text.match(new RegExp(p.source, 'i'));
      if (m) return m[m.length - 1].replace(/["'?!.]/g, '').trim();
    }
    return null;
  }

  async function wordReply(q, raw, allowSingle) {
    const meaningTerm = extract(raw, [/what(?:'s| is| does)\s+(?:the meaning of\s+)?["']?(.+?)["']?\s+mean/, /meaning of\s+(.+)/, /was (?:heißt|heisst|bedeutet)\s+(.+)/, /translate\s+(.+)/, /^define\s+(.+)/]);
    const sayTerm = extract(raw, [/how (?:do|would|can) (?:you|i) say\s+(.+?)(?:\s+in german)?$/, /what(?:'s| is)\s+(.+?)\s+in german/, /german (?:word )?for\s+(.+)/, /(.+?)\s+auf deutsch/]);
    const genderTerm = extract(raw, [/(?:der|die|das)\s*(?:,|or|oder|\/)\s*(?:die|das|der)?\s*(?:,|or|oder|\/)?\s*(?:das|der|die)?\s*(?:for|für|:)?\s+([a-zäöüß]+)\??$/, /(?:article|gender|artikel)\s+(?:of|for|von)\s+([a-zäöüß]+)/, /is (?:it )?(?:der|die|das)\s+([a-zäöüß]+)/, /which article (?:does|is)?\s*([a-zäöüß]+)/]);
    const single = allowSingle && /^[a-zäöüß-]+( [a-zäöüß-]+)?$/i.test(raw.trim()) ? raw.trim() : null;
    if (!meaningTerm && !sayTerm && !genderTerm && !single) return null;

    const words = await loadWords();
    if (!words.length) return null;

    if (genderTerm) {
      const { hits, close } = findGerman(words, genderTerm);
      const noun = hits.find(w => w[2] === 'noun') || (close && close[2] === 'noun' ? close : null);
      if (noun) return (hits.length ? '' : `I think you mean <strong>${esc(stripArticle(noun[0]))}</strong>.\n`) + `It's <strong>${esc(noun[0])}</strong>.\n` + describe(noun);
      return unknownWord(genderTerm, true);
    }
    if (sayTerm) {
      const hits = findEnglish(words, sayTerm);
      if (hits.length) return `"${esc(sayTerm)}" in German:\n` + hits.map(describe).join('\n');
      return `I don't have "${esc(sayTerm)}" in the DeutschKarten word list yet. Try a simpler word, or check a dictionary like dict.cc.`;
    }
    const term = meaningTerm || genderTerm || single;
    const { hits, close } = findGerman(words, term);
    if (hits.length) return hits.slice(0, 3).map(describe).join('\n');
    if (close) return `I think you mean <strong>${esc(close[0])}</strong>:\n` + describe(close);
    if (single || meaningTerm) {
      const en = findEnglish(words, term);
      if (en.length) return `"${esc(term)}" in German:\n` + en.map(describe).join('\n');
    }
    if (meaningTerm) return unknownWord(meaningTerm, false);
    if (/^[A-ZÄÖÜ]/.test(stripArticle(raw.trim()))) return unknownWord(term, true, true);
    return null;
  }

  const SUGGESTIONS = ['der, die or das: Wohnung?', 'What does Erfolg mean?', 'How do you say "success"?', 'Explain Dativ', 'Word order', 'nicht or kein?'];

  async function getBotReply(input) {
    const raw = input.trim();
    const q = raw.toLowerCase();
    const card = typeof window.dkChatCard === 'function' ? window.dkChatCard() : null;
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    // ── Current card context ──
    if (/this word|this card|remember this|current (word|card)|how (do i|to) (remember|learn|memori[sz]e) (it|this)/.test(q) && card) {
      const tips = [`<strong>${esc(card.w)}</strong> = "${esc(card.en)}"`];
      if (card.t === 'noun') {
        if (card.a === 'der') tips.push('It\'s <strong>der</strong> (masculine). Try to picture a strong, bold image for it.');
        if (card.a === 'die') tips.push('It\'s <strong>die</strong> (feminine). Picture something elegant or flowing.');
        if (card.a === 'das') tips.push('It\'s <strong>das</strong> (neuter). Often small, young, or abstract things.');
      } else if (card.t === 'verb') {
        tips.push('Try saying it aloud while miming the action. Physical memory sticks.');
      }
      if (card.ex) tips.push(`Example: <em>${card.ex.replace(/<[^>]+>/g, '')}</em>`);
      return tips.join('\n');
    }
    if (/this word|this card|remember this/.test(q) && !card) {
      return 'Open the <a href="app.html">flashcards</a> and ask me again there. I\'ll give you a tip for the card you\'re on.';
    }

    // ── Small talk ──
    if (/^(danke|thanks|thank you|thx|ty)\b/.test(q)) return pick(['Gern geschehen!', 'Bitte schön! Viel Erfolg beim Lernen.', 'Kein Problem!']);
    if (/^(hi|hello|hallo|hey|moin|servus|guten (morgen|tag|abend))\b/.test(q) && q.split(' ').length <= 3) {
      const c = card ? ` You're on <strong>${esc(card.w)}</strong> right now. Ask "how do I remember this?" for a tip.` : '';
      return `Hallo! I'm Mr. RoboMax. Ask me what a word means, which article it takes, or about any grammar topic.${c}`;
    }
    if (/what can you|^help$|how does this work|what do you do|who are you/.test(q)) {
      return `I can:\n• <strong>Look up words</strong>: "what does Erfolg mean?", "how do you say table?"\n• <strong>Tell you the article</strong>: "der, die or das: Wohnung?"\n• <strong>Explain grammar</strong>: cases, word order, two-way prepositions, adjective endings, Perfekt, Konjunktiv II, passive and more\n• <strong>Help with your current flashcard</strong>: "how do I remember this?"`;
    }

    // ── Words: "what does X mean", "how do you say X", "der/die/das X" ──
    const fromWords = await wordReply(q, raw, false);
    if (fromWords) return fromWords;

    // ── Grammar topics (most specific first) ──
    const topics = [
      [/wechsel|two[- ]way|wo oder wohin|wohin|liegen|legen|stellen|stehen/, 'wechsel'],
      [/word order|wortstellung|satzbau|verb (position|second|at the end)|position 2|v2|tekamolo/, 'wortstellung'],
      [/adjective ending|adjektivendung|adjektiv|adjective/, 'adjektiv'],
      [/\bnicht\b|\bkein|negat/, 'negation'],
      [/uhrzeit|what time|telling the time|\bhalb\b|viertel|o'?clock|clock/, 'uhrzeit'],
      [/\bdu\b.*\bsie\b|\bsie\b.*\bdu\b|formal|informal|duzen|siezen|polite/, 'formal'],
      [/\bweil\b|\bdass\b|obwohl|deshalb|trotzdem|\bdenn\b|connector|conjunction|konnektor/, 'konnektoren'],
      [/question word|w-frage|fragewort|\bwarum\b|\bwoher\b|asking questions/, 'fragen'],
      [/compar|komparativ|superlativ|superlative|besser|am besten/, 'komparativ'],
      [/futur|future|\bwerden\b.*infinitiv/, 'futur'],
      [/passiv|passive/, 'passiv'],
      [/number|zahlen|counting|einundzwanzig/, 'zahlen'],
      [/akkusativ|accusativ|accusative|direct object/, 'akkusativ'],
      [/dativ|dative|indirect object/, 'dativ'],
      [/genitiv|genitive|possession|wegen|trotz/, 'genitiv'],
      [/nominativ|nominative|\bsubject\b/, 'nominativ'],
      [/präteritum|prateritum|praeteritum|simple past/, 'praeteritum'],
      [/perfekt|perfect|past tense|vergangenheit|haben oder sein|haben or sein/, 'perfekt'],
      [/konjunktiv|subjunctive|würde|wuerde|conditional|would/, 'konjunktiv'],
      [/trennbar|separable|prefix/, 'trennbar'],
      [/reflexiv|reflexive|\bsich\b/, 'reflexiv'],
      [/modal|können|koennen|müssen|muessen|dürfen|duerfen|sollen|wollen|mögen|moegen/, 'modal'],
      [/plural|mehrzahl/, 'plural'],
      [/^der\??$|masculine|maskulin/, 'der'],
      [/^die\??$|feminine|feminin/, 'die'],
      [/^das\??$|neuter|neutrum/, 'das'],
      [/article|artikel|gender|geschlecht|der die das|der, die/, 'gender'],
      [/mnemonic|memory trick|remember|memori[sz]|how to learn|study tip/, 'mnemonic'],
      [/vocabulary|wortschatz|vocab|learn words/, 'wortschatz'],
    ];
    for (const [re, key] of topics) if (re.test(q)) return pick(TIPS[key]);

    // ── A bare word or two: look it up ──
    const lookup = await wordReply(q, raw, true);
    if (lookup) return lookup;

    // ── Fallback ──
    return `I'm not sure about that one. I'm best at word lookups and grammar. Try one of these, or ask about cases, word order or verb tenses.`;
  }

  function addSuggestions() {
    const messages = document.getElementById('chatMessages');
    const row = document.createElement('div');
    row.className = 'chat-chips';
    SUGGESTIONS.forEach(text => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-chip';
      b.textContent = text;
      b.addEventListener('click', () => { row.remove(); document.getElementById('chatInput').value = text; sendChat(); });
      row.appendChild(b);
    });
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function sendChat() {
    if (chatBusy) return;
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    chatBusy = true;
    document.getElementById('chatSend').disabled = true;
    document.querySelectorAll('#chatMessages .chat-chips').forEach(c => c.remove());

    chatAddMsg('user', esc(text));
    chatAddTyping();

    const started = Date.now();
    getBotReply(text).then(reply => {
      // Short pause so the answer doesn't feel instant and robotic
      setTimeout(() => {
        chatRemoveTyping();
        chatAddMsg('ai', reply);
        if (/^I'm not sure about that one/.test(reply)) addSuggestions();
        chatBusy = false;
        document.getElementById('chatSend').disabled = false;
        document.getElementById('chatInput').focus();
      }, Math.max(0, 450 - (Date.now() - started)));
    });
  }

  // ════════════════════════════════════════════════════════════
  //  GEMINI SPEAKING PARTNER — Master prompt generator
  // ════════════════════════════════════════════════════════════

  const GEMINI_MASTER_PROMPT = `You are my dedicated German conversation partner and language tutor. Your role is to help me practise spoken German through natural, immersive dialogue while actively supporting my improvement.

  FIRST: Ask me what my current German level is (A1 / A2 / B1 / B2 / C1) before we start.

  CONVERSATION RULES:
  1. Speak primarily in German at all times, no matter my level. Adapt your vocabulary and sentence complexity to my stated level: simpler structures for A1/A2, richer and more nuanced language for B1/B2/C1.
  2. Always push me slightly beyond my comfort zone. Introduce one or two challenging words or phrases per exchange that are just above my current level, and use them naturally in context. Briefly gloss them in brackets if I might not know them: e.g. „die Herausforderung (challenge)".
  3. Pick a concrete conversation topic to start (e.g. daily routine, travel, current events, career, opinions on a film, a hypothetical scenario) and stick to it for depth.
  4. After each of my replies, do THREE things:
     a) Continue the conversation naturally in German.
     b) Give a short correction block in English if I made a grammar or vocabulary mistake. Keep it concise: ✗ what I said → ✓ what it should be, and briefly why.
     c) Introduce one new advanced word or expression related to the topic, used in a sentence.
  5. Use the full range of tenses (Präsens, Perfekt, Präteritum, Futur, Konjunktiv II) as the level allows. For B2/C1, use passive voice, subordinate clauses, and idiomatic expressions regularly.
  6. Ask open-ended follow-up questions to keep me talking. Never let the conversation go flat.
  7. Every 5 exchanges, give me a brief summary of the mistakes I've made and the new vocabulary we've covered.
  8. Be encouraging but honest. Do not let errors pass uncorrected. Catching them early builds good habits.

  Let's begin. Please ask me for my level first.`;

  let geminiPanelOpen = false;

  function toggleGeminiPanel() {
    geminiPanelOpen = !geminiPanelOpen;
    const panel = document.getElementById('geminiExpanded');
    const icon  = document.getElementById('geminiToggleIcon');
    const label = document.getElementById('geminiToggleLabel');
    panel.classList.toggle('open', geminiPanelOpen);
    icon.textContent  = geminiPanelOpen ? '✕' : '+';
    label.textContent = geminiPanelOpen ? 'Hide' : 'Practice speaking German with AI';
    if (geminiPanelOpen) {
      document.getElementById('geminiPromptBox').textContent = GEMINI_MASTER_PROMPT;
    }
  }

  function copyGeminiPrompt() {
    navigator.clipboard.writeText(GEMINI_MASTER_PROMPT).then(() => {
      const btn = document.getElementById('geminiCopyBtn');
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.innerHTML = '⎘ Copy prompt'; }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = GEMINI_MASTER_PROMPT;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      const btn = document.getElementById('geminiCopyBtn');
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.innerHTML = '⎘ Copy prompt'; }, 2000);
    });
  }

  window.dkChat = { toggle: toggleChat, open: openChat, send: sendChat, hideBubble, toggleGemini: toggleGeminiPanel, copyPrompt: copyGeminiPrompt };
})();
