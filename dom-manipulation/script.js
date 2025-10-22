// Server simulation using localStorage as a mock backend
class ServerSimulator {
    constructor() {
        this.baseUrl = 'https://jsonplaceholder.typicode.com';
        this.localServerKey = 'quoteGeneratorServerData';
        this.initializeServerData();
    }

    // Initialize mock server data
    initializeServerData() {
        if (!localStorage.getItem(this.localServerKey)) {
            const initialData = [
                { id: 1, text: "The only way to do great work is to love what you do.", category: "Inspiration", version: 1, lastModified: new Date().toISOString() },
                { id: 2, text: "Innovation distinguishes between a leader and a follower.", category: "Leadership", version: 1, lastModified: new Date().toISOString() },
                { id: 3, text: "Life is what happens to you while you're busy making other plans.", category: "Life", version: 1, lastModified: new Date().toISOString() }
            ];
            localStorage.setItem(this.localServerKey, JSON.stringify(initialData));
        }
    }

    // Simulate fetching data from server with random delays
    async fetchQuotes() {
        // Simulate network delay
        await this.delay(Math.random() * 2000 + 500);
        
        // Simulate occasional server errors (10% chance)
        if (Math.random() < 0.1) {
            throw new Error('Server unavailable');
        }

        const serverData = JSON.parse(localStorage.getItem(this.localServerKey) || '[]');
        return serverData;
    }

    // Simulate posting data to server
    async postQuotes(quotes) {
        await this.delay(Math.random() * 1000 + 500);
        
        // Add version and timestamp to each quote
        const updatedQuotes = quotes.map(quote => ({
            ...quote,
            version: (quote.version || 0) + 1,
            lastModified: new Date().toISOString()
        }));

        localStorage.setItem(this.localServerKey, JSON.stringify(updatedQuotes));
        return updatedQuotes;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Quote Manager with conflict resolution
class QuoteManager {
    constructor() {
        this.server = new ServerSimulator();
        this.quotes = [];
        this.localStorageKey = 'quoteGeneratorLocalData';
        this.lastSyncTime = null;
        this.isSyncing = false;
        this.pendingChanges = false;
        this.syncInterval = null;
        
        this.initialize();
    }

    initialize() {
        this.loadFromLocalStorage();
        this.startPeriodicSync();
        this.setupEventListeners();
        this.updateUI();
    }

    // Load quotes from localStorage
    loadFromLocalStorage() {
        const saved = localStorage.getItem(this.localStorageKey);
        if (saved) {
            this.quotes = JSON.parse(saved);
        } else {
            // Initial local data
            this.quotes = [
                { id: 4, text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams", version: 1, lastModified: new Date().toISOString() }
            ];
            this.saveToLocalStorage();
        }
    }

    // Save quotes to localStorage
    saveToLocalStorage() {
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.quotes));
        this.pendingChanges = true;
    }

    // Add a new quote locally
    addQuote(text, category) {
        const newQuote = {
            id: Date.now(),
            text: text.trim(),
            category: category.trim(),
            version: 1,
            lastModified: new Date().toISOString(),
            local: true // Mark as locally created
        };
        
        this.quotes.push(newQuote);
        this.saveToLocalStorage();
        this.updateUI();
        
        // Auto-sync after adding a quote
        this.syncWithServer();
    }

    // Get a random quote
    getRandomQuote() {
        if (this.quotes.length === 0) {
            return { text: "No quotes available. Add some quotes!", category: "" };
        }
        
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        return this.quotes[randomIndex];
    }

    // Sync with server
    async syncWithServer() {
        if (this.isSyncing) {
            this.updateSyncStatus('Already syncing...', 'syncing');
            return;
        }

        this.isSyncing = true;
        this.updateSyncStatus('Syncing with server...', 'syncing');

        try {
            // Fetch latest from server
            const serverQuotes = await this.server.fetchQuotes();
            
            // Merge and resolve conflicts
            const mergedQuotes = this.mergeQuotes(this.quotes, serverQuotes);
            
            // Update server with merged data
            const updatedServerQuotes = await this.server.postQuotes(mergedQuotes);
            
            // Update local data
            this.quotes = updatedServerQuotes;
            this.saveToLocalStorage();
            
            this.lastSyncTime = new Date();
            this.pendingChanges = false;
            
            this.updateSyncStatus('Sync completed successfully!', 'synced');
            this.updateLastSyncTime();
            
        } catch (error) {
            console.error('Sync failed:', error);
            this.updateSyncStatus('Sync failed: ' + error.message, 'conflict');
        } finally {
            this.isSyncing = false;
            
            // Clear status after 3 seconds
            setTimeout(() => {
                this.updateSyncStatus('', '');
            }, 3000);
        }
    }

    // Merge local and server quotes with conflict resolution
    mergeQuotes(localQuotes, serverQuotes) {
        const merged = [...serverQuotes];
        const conflicts = [];
        
        localQuotes.forEach(localQuote => {
            const serverQuoteIndex = merged.findIndex(sq => sq.id === localQuote.id);
            
            if (serverQuoteIndex === -1) {
                // New local quote - add to merged
                merged.push(localQuote);
            } else {
                const serverQuote = merged[serverQuoteIndex];
                
                // Check if there's a conflict (different versions)
                if (localQuote.version !== serverQuote.version || 
                    localQuote.text !== serverQuote.text || 
                    localQuote.category !== serverQuote.category) {
                    
                    // Conflict detected - server wins by default
                    conflicts.push({
                        local: localQuote,
                        server: serverQuote,
                        resolved: serverQuote // Server version wins by default
                    });
                    
                    // Keep server version
                    merged[serverQuoteIndex] = serverQuote;
                }
            }
        });
        
        // If there are conflicts, show resolution UI
        if (conflicts.length > 0) {
            this.showConflictResolution(conflicts);
        }
        
        return merged;
    }

    // Show conflict resolution UI
    showConflictResolution(conflicts) {
        const conflictContainer = document.getElementById('conflictResolution');
        const conflictList = document.getElementById('conflictList');
        
        conflictList.innerHTML = '';
        
        conflicts.forEach((conflict, index) => {
            const conflictItem = document.createElement('div');
            conflictItem.className = 'conflict-item';
            conflictItem.innerHTML = `
                <h4>Conflict for Quote ID: ${conflict.local.id}</h4>
                <p><strong>Local Version:</strong> "${conflict.local.text}" (${conflict.local.category})</p>
                <p><strong>Server Version:</strong> "${conflict.server.text}" (${conflict.server.category})</p>
                <div>
                    <button onclick="quoteManager.resolveConflict(${index}, 'local')">Use Local</button>
                    <button onclick="quoteManager.resolveConflict(${index}, 'server')">Use Server</button>
                </div>
            `;
            conflictList.appendChild(conflictItem);
        });
        
        conflictContainer.style.display = 'block';
        this.updateSyncStatus(`${conflicts.length} conflict(s) detected`, 'conflict');
    }

    // Resolve a specific conflict
    resolveConflict(conflictIndex, choice) {
        // This would update the server with the chosen version
        // For now, we'll just hide the conflict UI
        document.getElementById('conflictResolution').style.display = 'none';
        this.updateSyncStatus(`Conflict resolved using ${choice} version`, 'synced');
        
        // Re-sync to ensure consistency
        setTimeout(() => this.syncWithServer(), 1000);
    }

    // Start periodic syncing
    startPeriodicSync() {
        // Sync every 30 seconds
        this.syncInterval = setInterval(() => {
            if (this.pendingChanges) {
                this.syncWithServer();
            }
        }, 30000);
    }

    // Update sync status UI
    updateSyncStatus(message, type) {
        const statusElement = document.getElementById('syncStatus');
        statusElement.textContent = message;
        statusElement.className = `sync-status ${type}`;
        statusElement.style.display = message ? 'block' : 'none';
    }

    // Update last sync time display
    updateLastSyncTime() {
        const lastSyncElement = document.getElementById('lastSync');
        if (this.lastSyncTime) {
            lastSyncElement.textContent = `Last sync: ${this.lastSyncTime.toLocaleTimeString()}`;
        }
    }

    // Update main UI
    updateUI() {
        const quoteDisplay = document.getElementById('quoteDisplay');
        const randomQuote = this.getRandomQuote();
        
        quoteDisplay.innerHTML = `
            <p class="quote-text">"${randomQuote.text}"</p>
            <p class="quote-category">— ${randomQuote.category}</p>
            <p><small>Total quotes: ${this.quotes.length}</small></p>
        `;
    }

    // Setup event listeners
    setupEventListeners() {
        document.getElementById('newQuote').addEventListener('click', () => {
            this.updateUI();
        });

        document.getElementById('manualSync').addEventListener('click', () => {
            this.syncWithServer();
        });

        // Add quote form functionality
        this.createAddQuoteForm();
    }

    // Create add quote form
    createAddQuoteForm() {
        const formContainer = document.createElement('div');
        formContainer.innerHTML = `
            <h2>Add New Quote</h2>
            <div class="form-group">
                <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
            </div>
            <div class="form-group">
                <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
            </div>
            <button id="addQuoteBtn">Add Quote</button>
        `;
        
        document.body.appendChild(formContainer);
        
        document.getElementById('addQuoteBtn').addEventListener('click', () => {
            const text = document.getElementById('newQuoteText').value;
            const category = document.getElementById('newQuoteCategory').value;
            
            if (text && category) {
                this.addQuote(text, category);
                document.getElementById('newQuoteText').value = '';
                document.getElementById('newQuoteCategory').value = '';
            } else {
                alert('Please enter both quote text and category!');
            }
        });
    }
}

// Initialize the application
let quoteManager;

document.addEventListener('DOMContentLoaded', () => {
    quoteManager = new QuoteManager();
});
// Test function to simulate conflicts
function simulateConflictTest() {
    console.log('Simulating conflict scenario...');
    
    // Modify local data directly
    const localData = JSON.parse(localStorage.getItem('quoteGeneratorLocalData') || '[]');
    if (localData.length > 0) {
        localData[0].text = "Modified locally: " + localData[0].text;
        localData[0].version = (localData[0].version || 0) + 1;
        localStorage.setItem('quoteGeneratorLocalData', JSON.stringify(localData));
    }
    
    // Modify server data directly
    const serverData = JSON.parse(localStorage.getItem('quoteGeneratorServerData') || '[]');
    if (serverData.length > 0) {
        serverData[0].text = "Modified on server: " + serverData[0].text;
        serverData[0].version = (serverData[0].version || 0) + 1;
        localStorage.setItem('quoteGeneratorServerData', JSON.stringify(serverData));
    }
    
    // Trigger sync to see conflict resolution
    quoteManager.syncWithServer();
}

// Uncomment the line below to test conflict simulation
// setTimeout(simulateConflictTest, 2000);