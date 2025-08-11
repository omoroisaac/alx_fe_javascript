/* Dynamic Quote Generator
   - localStorage for persistent quotes
   - sessionStorage for last viewed quote (session-only)
   - import / export (JSON)
*/

const STORAGE_KEY = 'dqg_quotes_v1';
const SESSION_LAST_QUOTE_KEY = 'dqg_lastQuote_v1';

const DEFAULT_QUOTES = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Motivation" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Inspiration" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" }
];

let quotes = [];

// DOM references
const categorySelect = document.getElementById('categorySelect');
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const resetBtn = document.getElementById('resetBtn');
const lastViewedEl = document.getElementById('lastViewed');

// ---- Storage helpers ----
function saveQuotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error('Failed to save quotes to localStorage', err);
  }
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
  // fallback
  quotes = DEFAULT_QUOTES.slice();
  saveQuotes();
}

// ---- UI helpers ----
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categorySelect.innerHTML = '';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function showRandomQuote() {
  if (!quotes.length) { quoteDisplay.textContent = 'No quotes available.'; return; }
  const selectedCategory = categorySelect.value || quotes[0].category;
  let pool = quotes.filter(q => q.category === selectedCategory);
  if (!pool.length) pool = quotes; // fallback to all

  const idx = Math.floor(Math.random() * pool.length);
  const chosen = pool[idx];

  quoteDisplay.textContent = `"${chosen.text}" — ${chosen.category}`;

  // store last viewed in session storage (session-only)
  try { sessionStorage.setItem(SESSION_LAST_QUOTE_KEY, JSON.stringify({ text: chosen.text, category: chosen.category, ts: Date.now() })); }
  catch (e) { console.warn('Could not write sessionStorage', e); }

  updateLastViewedDisplay();
}

function updateLastViewedDisplay() {
  try {
    const raw = sessionStorage.getItem(SESSION_LAST_QUOTE_KEY);
    if (!raw) { lastViewedEl.textContent = ''; return; }
    const last = JSON.parse(raw);
    lastViewedEl.textContent = `Last viewed this session: "${last.text}" — ${last.category}`;
  } catch (e) { console.warn('Could not read last viewed from sessionStorage', e); }
}

// ---- Add / Reset ----
function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const catInput = document.getElementById('newQuoteCategory');
  const text = (textInput.value || '').trim();
  const category = (catInput.value || '').trim();

  if (!text || !category) { alert('Please enter both quote text and a category.'); return; }

  // duplicate guard
  const duplicate = quotes.some(q => q.text === text && q.category === category);
  if (duplicate) { alert('This exact quote in the same category already exists.'); return; }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();

  // select the newly added category and show the new quote
  categorySelect.value = category;
  quoteDisplay.textContent = `"${text}" — ${category}`;

  // clear inputs
  textInput.value = '';
  catInput.value = '';

  alert('Quote added!');
}

function resetToDefaults() {
  if (!confirm('Reset saved quotes to the default set? This will overwrite your stored quotes.')) return;
  localStorage.removeItem(STORAGE_KEY);
  loadQuotes();
  populateCategories();
  showRandomQuote();
}

// ---- Import / Export ----
function exportToJson() {
  try {
    const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Could not export quotes: ' + err.message);
  }
}

function importFromJsonFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('Imported JSON must be an array of {text, category} objects.');

      // dedupe based on text+category
      const existing = new Set(quotes.map(q => q.text + '||' + q.category));
      let added = 0;
      for (const item of imported) {
        if (!item || typeof item.text !== 'string' || typeof item.category !== 'string') continue;
        const key = item.text + '||' + item.category;
        if (!existing.has(key)) {
          quotes.push({ text: item.text, category: item.category });
          existing.add(key);
          added++;
        }
      }

      saveQuotes();
      populateCategories();
      alert(`Imported ${added} new quotes.`);
    } catch (err) {
      alert('Error importing JSON: ' + (err && err.message ? err.message : err));
    } finally {
      importFile.value = ''; // reset file input
    }
  };
  reader.readAsText(file);
}

// ---- Wiring ----
newQuoteBtn.addEventListener('click', showRandomQuote);
addQuoteBtn.addEventListener('click', addQuote);
exportBtn.addEventListener('click', exportToJson);
importFile.addEventListener('change', (ev) => { const f = ev.target.files && ev.target.files[0]; importFromJsonFile(f); });
resetBtn.addEventListener('click', resetToDefaults);

// ---- Init ----
loadQuotes();
populateCategories();
updateLastViewedDisplay();
if (!sessionStorage.getItem(SESSION_LAST_QUOTE_KEY)) {
  // show a quote on first load of the session
  showRandomQuote();
} else {
  // restore last quote into main display as well
  const last = JSON.parse(sessionStorage.getItem(SESSION_LAST_QUOTE_KEY));
  if (last && last.text) quoteDisplay.textContent = `"${last.text}" — ${last.category}`;
}
const FILTER_KEY = 'dqg_lastFilter_v1';

// Populate both categorySelect (for random quote) and categoryFilter (for filtering)
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];

  // categorySelect
  categorySelect.innerHTML = '';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  // categoryFilter
  const filter = document.getElementById('categoryFilter');
  filter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    filter.appendChild(opt);
  });

  // restore last filter selection
  const lastFilter = localStorage.getItem(FILTER_KEY);
  if (lastFilter) filter.value = lastFilter;
}

function filterQuotes() {
  const selected = document.getElementById('categoryFilter').value;
  localStorage.setItem(FILTER_KEY, selected);

  const filtered = selected === 'all' ? quotes : quotes.filter(q => q.category === selected);

  const container = document.getElementById('filteredQuotes');
  container.innerHTML = '';
  if (!filtered.length) {
    container.textContent = 'No quotes found for this category.';
    return;
  }

  filtered.forEach(q => {
    const p = document.createElement('p');
    p.textContent = `"${q.text}" — ${q.category}`;
    container.appendChild(p);
  });
}

// Update addQuote to refresh filters too
function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const catInput = document.getElementById('newQuoteCategory');
  const text = textInput.value.trim();
  const category = catInput.value.trim();

  if (!text || !category) {
    alert('Please enter both a quote and a category.');
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  filterQuotes();

  categorySelect.value = category;
  textInput.value = '';
  catInput.value = '';
}

// Init additions
populateCategories();
filterQuotes();