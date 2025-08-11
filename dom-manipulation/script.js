// Dynamic Quote Generator with periodic server sync + conflict handling
const STORAGE_KEY = 'dqg_quotes_v1';
const FILTER_KEY = 'dqg_lastFilter_v1';
const SESSION_LAST_QUOTE_KEY = 'dqg_lastQuote_v1';
const SERVER_BASE = 'https://jsonplaceholder.typicode.com/posts'; // mock server
const SYNC_INTERVAL_MS = 30_000; // 30 seconds

// Default seed
const DEFAULT_QUOTES = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Motivation" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Inspiration" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" }
];

let quotes = [];
let syncIntervalId = null;
let lastSync = null;

// DOM refs
const categorySelect = document.getElementById('categorySelect');
const categoryFilter = document.getElementById('categoryFilter');
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const syncNowBtn = document.getElementById('syncNowBtn');
const autoSyncToggle = document.getElementById('autoSyncToggle');
const syncStatus = document.getElementById('syncStatus');
const filteredQuotesContainer = document.getElementById('filteredQuotes');
const conflictPanel = document.getElementById('conflictPanel');
const conflictList = document.getElementById('conflictList');
const closeConflicts = document.getElementById('closeConflicts');

// ---- Storage helpers ----
function saveQuotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) { quotes = parsed; return; }
    } catch (err) {
      console.warn('Invalid saved data, falling back to defaults', err);
    }
  }
  quotes = DEFAULT_QUOTES.map(q => ({ ...q }));
  saveQuotes();
}

function setSyncStatus(msg) { syncStatus.textContent = msg; }

// ---- UI helpers ----
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];

  // categorySelect
  categorySelect.innerHTML = '';
  categories.forEach(cat => { const o = document.createElement('option'); o.value = cat; o.textContent = cat; categorySelect.appendChild(o); });

  // categoryFilter
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => { const o = document.createElement('option'); o.value = cat; o.textContent = cat; categoryFilter.appendChild(o); });

  // restore last filter
  const lastFilter = localStorage.getItem(FILTER_KEY);
  if (lastFilter) categoryFilter.value = lastFilter;
}

function showRandomQuote() {
  const selectedCategory = categorySelect.value || quotes[0]?.category;
  const pool = quotes.filter(q => !selectedCategory || q.category === selectedCategory);
  if (!pool.length) { quoteDisplay.textContent = 'No quotes available.'; return; }
  const idx = Math.floor(Math.random() * pool.length);
  const chosen = pool[idx];
  quoteDisplay.textContent = `"${chosen.text}" — ${chosen.category}`;
  try { sessionStorage.setItem(SESSION_LAST_QUOTE_KEY, JSON.stringify({ text: chosen.text, category: chosen.category, ts: Date.now() })); } catch(e){}
}

function renderFilteredQuotes() {
  const selected = categoryFilter.value || 'all';
  localStorage.setItem(FILTER_KEY, selected);
  const list = selected === 'all' ? quotes : quotes.filter(q => q.category === selected);
  filteredQuotesContainer.innerHTML = '';
  if (!list.length) { filteredQuotesContainer.textContent = 'No quotes found for this category.'; return; }
  list.forEach(q => { const p = document.createElement('p'); p.textContent = `"${q.text}" — ${q.category}`; filteredQuotesContainer.appendChild(p); });
}

// ---- Add quote (attempt to post to server) ----
async function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const catInput = document.getElementById('newQuoteCategory');
  const text = (textInput.value || '').trim();
  const category = (catInput.value || '').trim();
  if (!text || !category) { alert('Please enter both quote text and a category.'); return; }

  const newQ = { text, category, lastModified: Date.now() };
  quotes.push(newQ);
  saveQuotes();
  populateCategories();
  renderFilteredQuotes();

  // try to POST to server (mock)
  try {
    const payload = { title: category, body: text, userId: 1 };
    const res = await fetch(SERVER_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const r = await res.json();
    if (r && r.id) {
      newQ.serverId = String(r.id);
      // record server "updatedAt" as now (mock)
      newQ.lastModified = Date.now();
      saveQuotes();
      setSyncStatus('Added quote locally and received server id.');
    }
  } catch (err) {
    console.warn('Could not push to server (mock):', err);
  }

  textInput.value = '';
  catInput.value = '';
}

// ---- Server interaction (fetch & reconcile) ----
async function fetchServerQuotes(limit = 20) {
  const res = await fetch(`${SERVER_BASE}?_limit=${limit}`);
  const data = await res.json();
  // JSONPlaceholder does not provide timestamps; we simulate an updatedAt for demo purposes
  return data.map(p => ({ serverId: String(p.id), text: p.body, category: `User ${p.userId}`, updatedAt: Date.now() - (p.id * 60_000) }));
}

function reconcileServerData(serverQuotes) {
  const serverById = new Map(serverQuotes.map(s => [s.serverId, s]));
  const localByServerId = new Map(quotes.filter(q => q.serverId).map(q => [String(q.serverId), q]));
  const localByKey = new Map(quotes.map(q => [q.text + '||' + q.category, q]));

  const added = [], updated = [], deleted = [], conflicts = [];

  // Bring server-only items into local
  for (const s of serverQuotes) {
    const local = localByServerId.get(s.serverId);
    if (local) {
      // exists locally; compare
      if (local.text !== s.text || local.category !== s.category) {
        // conflict detection: if local was modified after server's updatedAt, it's a conflict
        const localModified = local.lastModified || 0;
        if (localModified > (s.updatedAt || 0)) {
          // conflict: prefer server by default, but record for manual resolution
          conflicts.push({ type: 'modify', server: s, local });
          // server wins by default
          local.text = s.text; local.category = s.category; local.lastModified = s.updatedAt; updated.push(local);
        } else {
          // server is newer or local not modified: accept server
          local.text = s.text; local.category = s.category; local.lastModified = s.updatedAt; updated.push(local);
        }
      }
    } else {
      // try to match by text+category
      const key = s.text + '||' + s.category;
      const match = localByKey.get(key);
      if (match) {
        match.serverId = s.serverId; match.lastModified = s.updatedAt; updated.push(match);
      } else {
        // server has an item that local doesn't — add it
        const copy = { text: s.text, category: s.category, serverId: s.serverId, lastModified: s.updatedAt };
        quotes.push(copy); added.push(copy);
      }
    }
  }

  // Find local items that reference serverId but server no longer has them
  const se