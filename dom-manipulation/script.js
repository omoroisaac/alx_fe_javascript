// Array of quote objects
let quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
    { text: "Innovation distinguishes between a leader and a follower.", category: "Leadership" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" }
];

// Initialize the application
function init() {
    displayRandomQuote();
    setupEventListeners();
    createAddQuoteForm();
}

// Display a random quote
function showRandomQuote() {
    const quoteDisplay = document.getElementById('quoteDisplay');
    
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

// CREATE ADD QUOTE FORM - Using appendChild explicitly
function createAddQuoteForm() {
    // Create container div
    const formContainer = document.createElement('div');
    
    // Create heading
    const heading = document.createElement('h2');
    heading.textContent = 'Add New Quote';
    formContainer.appendChild(heading);
    
    // Create quote text input
    const textGroup = document.createElement('div');
    textGroup.className = 'form-group';
    
    const quoteInput = document.createElement('input');
    quoteInput.type = 'text';
    quoteInput.id = 'newQuoteText';
    quoteInput.placeholder = 'Enter a new quote';
    textGroup.appendChild(quoteInput);
    formContainer.appendChild(textGroup);
    
    // Create category input
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'form-group';
    
    const categoryInput = document.createElement('input');
    categoryInput.type = 'text';
    categoryInput.id = 'newQuoteCategory';
    categoryInput.placeholder = 'Enter quote category';
    categoryGroup.appendChild(categoryInput);
    formContainer.appendChild(categoryGroup);
    
    // Create add button
    const addButton = document.createElement('button');
    addButton.id = 'addQuoteBtn';
    addButton.textContent = 'Add Quote';
    formContainer.appendChild(addButton);
    
    // Append the form to body using appendChild
    document.body.appendChild(formContainer);
    
    // Add event listener
    addButton.addEventListener('click', addQuote);
}

// ADD QUOTE FUNCTION - Add new quote to array and update DOM using appendChild
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
    
    // Update DOM using appendChild - create success message
    const successMessage = document.createElement('p');
    successMessage.textContent = `Quote added successfully! Total quotes: ${quotes.length}`;
    successMessage.style.color = 'green';
    successMessage.style.marginTop = '10px';
    
    // Find the form container and append success message
    const formContainer = document.querySelector('div:last-child');
    formContainer.appendChild(successMessage);
    
    // Remove success message after 3 seconds
    setTimeout(() => {
        if (successMessage.parentNode) {
            formContainer.removeChild(successMessage);
        }
    }, 3000);
    
    // Refresh display
    showRandomQuote();
}

// Setup event listeners
function setupEventListeners() {
    const newQuoteBtn = document.getElementById('newQuote');
    newQuoteBtn.addEventListener('click', showRandomQuote);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);