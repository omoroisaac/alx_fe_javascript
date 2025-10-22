// Array of quote objects
let quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
    { text: "Innovation distinguishes between a leader and a follower.", category: "Leadership" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" }
];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');

// Initialize the application
function init() {
    displayRandomQuote();
    setupEventListeners();
    createAddQuoteForm(); // Create the form dynamically as required
}

// Display a random quote
function showRandomQuote() {
    displayRandomQuote();
}

// Function to display random quote
function displayRandomQuote() {
    if (quotes.length === 0) {
        quoteDisplay.innerHTML = '<p>No quotes available. Add some quotes first!</p>';
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];
    
    quoteDisplay.innerHTML = `
        <p class="quote-text">"${randomQuote.text}"</p>
        <p class="quote-category">— ${randomQuote.category}</p>
    `;
}

// CREATE ADD QUOTE FORM - This is the required function
function createAddQuoteForm() {
    const formContainer = document.createElement('div');
    formContainer.innerHTML = `
        <h2>Add New Quote</h2>
        <div class="form-group">
            <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
        </div>
        <div class="form-group">
            <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
        </div>
        <button onclick="addQuote()">Add Quote</button>
    `;
    
    // Insert the form after the quote display section
    const quoteContainer = document.querySelector('.container');
    quoteContainer.parentNode.insertBefore(formContainer, quoteContainer.nextSibling);
}

// ADD QUOTE FUNCTION - Add new quote to array and update DOM
function addQuote() {
    const quoteText = document.getElementById('newQuoteText').value.trim();
    const quoteCategory = document.getElementById('newQuoteCategory').value.trim();
    
    if (!quoteText || !quoteCategory) {
        alert('Please enter both quote text and category!');
        return;
    }
    
    // Create new quote object
    const newQuote = {
        text: quoteText,
        category: quoteCategory
    };
    
    // Add to quotes array
    quotes.push(newQuote);
    
    // Clear input fields
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    
    // Update DOM - show confirmation and refresh if needed
    alert('Quote added successfully! Total quotes: ' + quotes.length);
    
    // Optional: Automatically show the new quote
    displayRandomQuote();
}

// Setup event listeners
function setupEventListeners() {
    // EVENT LISTENER ON "SHOW NEW QUOTE" BUTTON
    newQuoteBtn.addEventListener('click', showRandomQuote);
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);