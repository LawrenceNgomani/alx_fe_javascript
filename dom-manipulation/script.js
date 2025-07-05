// Storage keys for local and session storage
        this.STORAGE_KEYS = {
            QUOTES: 'quoteGenerator_quotes',
            CATEGORIES: 'quoteGenerator_categories',
            LAST_QUOTE: 'quoteGenerator_lastQuote',
            USER_PREFERENCES: 'quoteGenerator_preferences'
        };

        // Initialize arrays
        this.quotes = [];
        this.categories = ['inspirational', 'motivational', 'wisdom', 'humor', 'success'];
        this.filteredQuotes = [];
        this.currentQuoteIndex = 0;
        this.favorites = [];

        // Initialize the application
        this.init();
    }

    // Initialize the application
    init() {
        this.loadQuotes();
        this.loadCategories();
        this.loadUserPreferences();
        this.setupEventListeners();
        this.populateCategories();
        this.displayRandomQuote();
    }

    // Load quotes from localStorage
    loadQuotes() {
        try {
            const storedQuotes = localStorage.getItem(this.STORAGE_KEYS.QUOTES);
            if (storedQuotes) {
                this.quotes = JSON.parse(storedQuotes);
            } else {
                // Load default quotes if none exist
                this.quotes = [
                    {
                        id: 1,
                        text: "The only way to do great work is to love what you do.",
                        author: "Steve Jobs",
                        category: "inspirational"
                    },
                    {
                        id: 2,
                        text: "Innovation distinguishes between a leader and a follower.",
                        author: "Steve Jobs",
                        category: "success"
                    },
                    {
                        id: 3,
                        text: "Life is what happens to you while you're busy making other plans.",
                        author: "John Lennon",
                        category: "wisdom"
                    },
                    {
                        id: 4,
                        text: "The future belongs to those who believe in the beauty of their dreams.",
                        author: "Eleanor Roosevelt",
                        category: "motivational"
                    },
                    {
                        id: 5,
                        text: "It is during our darkest moments that we must focus to see the light.",
                        author: "Aristotle",
                        category: "inspirational"
                    }
                ];
                this.saveQuotes();
            }
            this.filteredQuotes = [...this.quotes];
        } catch (error) {
            console.error('Error loading quotes:', error);
            this.quotes = [];
        }
    }

    // Save quotes to localStorage
    saveQuotes() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.QUOTES, JSON.stringify(this.quotes));
        } catch (error) {
            console.error('Error saving quotes:', error);
        }
    }

    // Load categories from localStorage
    loadCategories() {
        try {
            const storedCategories = localStorage.getItem(this.STORAGE_KEYS.CATEGORIES);
            if (storedCategories) {
                this.categories = JSON.parse(storedCategories);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // Save categories to localStorage
    saveCategories() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
        } catch (error) {
            console.error('Error saving categories:', error);
        }
    }

    // Load user preferences from sessionStorage
    loadUserPreferences() {
        try {
            const preferences = sessionStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES);
            if (preferences) {
                const parsed = JSON.parse(preferences);
                // Apply any user preferences here
                if (parsed.lastCategory) {
                    this.lastSelectedCategory = parsed.lastCategory;
                }
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }

    // Save user preferences to sessionStorage
    saveUserPreferences() {
        try {
            const preferences = {
                lastCategory: this.lastSelectedCategory,
                timestamp: Date.now()
            };
            sessionStorage.setItem(this.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving user preferences:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // New quote button
        const newQuoteBtn = document.getElementById('newQuote');
        if (newQuoteBtn) {
            newQuoteBtn.addEventListener('click', () => this.displayRandomQuote());
        }

        // Add quote form
        const addQuoteForm = document.getElementById('addQuoteForm');
        if (addQuoteForm) {
            addQuoteForm.addEventListener('submit', (e) => this.handleAddQuote(e));
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.filterByCategory(e.target.value));
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchQuotes(e.target.value));
        }

        // Import/Export buttons
        const exportBtn = document.getElementById('exportQuotes');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportQuotes());
        }

        const importBtn = document.getElementById('importFile');
        if (importBtn) {
            importBtn.addEventListener('change', (e) => this.importFromJsonFile(e));
        }

        // Clear storage button
        const clearStorageBtn = document.getElementById('clearStorage');
        if (clearStorageBtn) {
            clearStorageBtn.addEventListener('click', () => this.clearStorage());
        }
    }

    // Generate unique ID for quotes
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // Display a random quote
    displayRandomQuote() {
        if (this.filteredQuotes.length === 0) {
            this.displayQuote({
                text: "No quotes available. Add some quotes to get started!",
                author: "Quote Generator",
                category: "system"
            });
            return;
        }

        const randomIndex = Math.floor(Math.random() * this.filteredQuotes.length);
        const quote = this.filteredQuotes[randomIndex];
        this.currentQuoteIndex = randomIndex;
        this.displayQuote(quote);
        
        // Save last viewed quote to sessionStorage
        this.saveLastQuote(quote);
    }

    // Original function name for compatibility
    showRandomQuote() {
        this.displayRandomQuote();
    }

    // Display a specific quote
    displayQuote(quote) {
        const quoteText = document.getElementById('quoteText');
        const quoteAuthor = document.getElementById('quoteAuthor');
        const quoteCategory = document.getElementById('quoteCategory');

        if (quoteText) quoteText.textContent = `"${quote.text}"`;
        if (quoteAuthor) quoteAuthor.textContent = `— ${quote.author}`;
        if (quoteCategory) quoteCategory.textContent = `Category: ${quote.category}`;
    }

    // Save last quote to sessionStorage
    saveLastQuote(quote) {
        try {
            sessionStorage.setItem(this.STORAGE_KEYS.LAST_QUOTE, JSON.stringify(quote));
        } catch (error) {
            console.error('Error saving last quote:', error);
        }
    }

    // Create Add Quote Form (original function for compatibility)
    createAddQuoteForm() {
        const quoteDisplay = document.getElementById('quoteDisplay');
        if (!quoteDisplay) return;

        // Check if form already exists
        if (document.getElementById('addQuoteForm')) {
            return;
        }

        const formContainer = document.createElement('div');
        formContainer.id = 'addQuoteForm';
        formContainer.innerHTML = `
            <h3>Add New Quote</h3>
            <div>
                <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
                <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
                <button onclick="addQuote()">Add Quote</button>
            </div>
        `;

        quoteDisplay.appendChild(formContainer);
    }

    // Add quote function for compatibility with original requirements
    addQuote() {
        const quoteText = document.getElementById('newQuoteText');
        const quoteCategory = document.getElementById('newQuoteCategory');
        
        if (!quoteText || !quoteCategory) {
            alert('Quote form not found. Please create the form first.');
            return;
        }

        const text = quoteText.value.trim();
        const category = quoteCategory.value.trim();

        if (!text || !category) {
            alert('Please fill in both quote text and category');
            return;
        }

        const newQuote = {
            id: this.generateId(),
            text: text,
            author: 'Anonymous', // Default author for simple form
            category: category.toLowerCase()
        };

        // Add to quotes array
        this.quotes.push(newQuote);
        
        // Add category if it doesn't exist
        if (!this.categories.includes(newQuote.category)) {
            this.categories.push(newQuote.category);
            this.saveCategories();
            this.populateCategories();
        }

        // Save to localStorage
        this.saveQuotes();
        
        // Update filtered quotes
        this.filteredQuotes = [...this.quotes];
        
        // Clear form
        quoteText.value = '';
        quoteCategory.value = '';
        
        // Display the new quote
        this.displayQuote(newQuote);
        
        // Update quote count
        this.updateQuoteCount();
        
        alert('Quote added successfully!');
    }
    // Handle adding new quote (enhanced form)
    handleAddQuote(event) {
        
        const formData = new FormData(event.target);
        const newQuote = {
            id: this.generateId(),
            text: formData.get('quoteText').trim(),
            author: formData.get('quoteAuthor').trim(),
            category: formData.get('quoteCategory').trim().toLowerCase()
        };

        // Validate input
        if (!newQuote.text || !newQuote.author || !newQuote.category) {
            alert('Please fill in all fields');
            return;
        }

        // Add to quotes array
        this.quotes.push(newQuote);
        
        // Add category if it doesn't exist
        if (!this.categories.includes(newQuote.category)) {
            this.categories.push(newQuote.category);
            this.saveCategories();
            this.populateCategories();
        }

        // Save to localStorage
        this.saveQuotes();
        
        // Update filtered quotes
        this.filteredQuotes = [...this.quotes];
        
        // Reset form
        event.target.reset();
        
        // Display the new quote
        this.displayQuote(newQuote);
        
        // Update quote count
        this.updateQuoteCount();
        
        alert('Quote added successfully!');
    }

    // Filter quotes by category
    filterByCategory(category) {
        this.lastSelectedCategory = category;
        this.saveUserPreferences();
        
        if (category === 'all') {
            this.filteredQuotes = [...this.quotes];
        } else {
            this.filteredQuotes = this.quotes.filter(quote => 
                quote.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        this.updateQuoteCount();
    }

    // Search quotes
    searchQuotes(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredQuotes = [...this.quotes];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredQuotes = this.quotes.filter(quote =>
                quote.text.toLowerCase().includes(term) ||
                quote.author.toLowerCase().includes(term) ||
                quote.category.toLowerCase().includes(term)
            );
        }
        
        this.updateQuoteCount();
    }

    // Populate category dropdown
    populateCategories() {
        const categoryFilter = document.getElementById('categoryFilter');
        const addQuoteCategory = document.getElementById('addQuoteCategory');
        
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="all">All Categories</option>';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                categoryFilter.appendChild(option);
            });
        }
        
        if (addQuoteCategory) {
            addQuoteCategory.innerHTML = '';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                addQuoteCategory.appendChild(option);
            });
        }
    }

    // Update quote count display
    updateQuoteCount() {
        const quoteCount = document.getElementById('quoteCount');
        if (quoteCount) {
            quoteCount.textContent = `${this.filteredQuotes.length} quotes available`;
        }
    }

    // Export quotes to JSON file
    exportQuotes() {
        try {
            const dataToExport = {
                quotes: this.quotes,
                categories: this.categories,
                exportDate: new Date().toISOString(),
                version: "1.0"
            };
            
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `quotes_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('Quotes exported successfully!');
        } catch (error) {
            console.error('Error exporting quotes:', error);
            alert('Error exporting quotes. Please try again.');
        }
    }

    // Import quotes from JSON file
    importFromJsonFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate imported data
                if (!importedData.quotes || !Array.isArray(importedData.quotes)) {
                    throw new Error('Invalid file format: quotes array not found');
                }

                // Process imported quotes
                const newQuotes = importedData.quotes.filter(quote => 
                    quote.text && quote.author && quote.category
                );

                if (newQuotes.length === 0) {
                    alert('No valid quotes found in the file.');
                    return;
                }

                // Add unique IDs to imported quotes
                newQuotes.forEach(quote => {
                    if (!quote.id) {
                        quote.id = this.generateId();
                    }
                });

                // Merge with existing quotes
                this.quotes.push(...newQuotes);
                
                // Merge categories
                if (importedData.categories && Array.isArray(importedData.categories)) {
                    importedData.categories.forEach(category => {
                        if (!this.categories.includes(category)) {
                            this.categories.push(category);
                        }
                    });
                }

                // Save to localStorage
                this.saveQuotes();
                this.saveCategories();
                
                // Update UI
                this.filteredQuotes = [...this.quotes];
                this.populateCategories();
                this.updateQuoteCount();
                
                alert(`Successfully imported ${newQuotes.length} quotes!`);
                
                // Reset file input
                event.target.value = '';
                
            } catch (error) {
                console.error('Error importing quotes:', error);
                alert('Error importing quotes: ' + error.message);
            }
        };
        
        fileReader.readAsText(file);
    }

    // Clear all storage
    clearStorage() {
        if (confirm('Are you sure you want to clear all quotes and data? This action cannot be undone.')) {
            localStorage.removeItem(this.STORAGE_KEYS.QUOTES);
            localStorage.removeItem(this.STORAGE_KEYS.CATEGORIES);
            sessionStorage.removeItem(this.STORAGE_KEYS.LAST_QUOTE);
            sessionStorage.removeItem(this.STORAGE_KEYS.USER_PREFERENCES);
            
            // Reset arrays
            this.quotes = [];
            this.categories = ['inspirational', 'motivational', 'wisdom', 'humor', 'success'];
            this.filteredQuotes = [];
            
            // Update UI
            this.populateCategories();
            this.updateQuoteCount();
            this.displayRandomQuote();
            
            alert('All data cleared successfully!');
        }
    }

    // Get storage usage information
    getStorageInfo() {
        const info = {
            quotesCount: this.quotes.length,
            categoriesCount: this.categories.length,
            localStorageUsed: this.getStorageSize(localStorage),
            sessionStorageUsed: this.getStorageSize(sessionStorage)
        };
        
        return info;
    }

    // Calculate storage size
    getStorageSize(storage) {
        let size = 0;
        for (let key in storage) {
            if (storage.hasOwnProperty(key)) {
                size += storage[key].length + key.length;
            }
        }
        return size;
    }
}

// Make functions globally available for compatibility
window.showRandomQuote = function() {
    if (window.quoteGenerator) {
        window.quoteGenerator.showRandomQuote();
    }
};

window.addQuote = function() {
    if (window.quoteGenerator) {
        window.quoteGenerator.addQuote();
    }
};

window.createAddQuoteForm = function() {
    if (window.quoteGenerator) {
        window.quoteGenerator.createAddQuoteForm();
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quoteGenerator = new QuoteGenerator();
    
    // Display storage info in console
    console.log('Quote Generator Storage Info:', window.quoteGenerator.getStorageInfo());
});