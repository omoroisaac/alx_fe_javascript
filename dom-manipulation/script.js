// Initial quotes array
let quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Motivation" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Inspiration" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" }
];

// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay");
const categorySelect = document.getElementById("categorySelect");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");

// Populate category dropdown
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join("");
}

// Show a random quote
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  const filteredQuotes = quotes.filter(q => q.category === selectedCategory);

  if (filteredQuotes.length > 0) {
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    quoteDisplay.textContent = `"${filteredQuotes[randomIndex].text}"`;
  } else {
    quoteDisplay.textContent = "No quotes available in this category.";
  }
}

// Add a new quote
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }

  quotes.push({ text, category });
  populateCategories();

  // Select the new category automatically
  categorySelect.value = category;

  // Clear inputs
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("Quote added successfully!");
}

// Event Listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);

// Initialize
populateCategories();
showRandomQuote();
