// Quote Generator Class with Server Sync and Conflict Resolution
class QuoteGenerator {
    constructor() {
        // Storage keys
        this.STORAGE_KEYS = {
            QUOTES: 'quoteGenerator_quotes',
            CATEGORIES: 'quoteGenerator_categories',
            LAST_QUOTE: 'quoteGenerator_lastQuote',
            USER_PREFERENCES: 'quoteGenerator_preferences',
            SYNC_METADATA: 'quoteGenerator_syncMetadata'
        };

        // Initialize arrays
        this.quotes = [];
        this.categories = ['inspirational', 'motivational', 'wisdom', 'humor', 'success'];
        this.filteredQuotes = [];
        this.currentQuoteIndex = 0;
        
        // Sync properties
        this.syncInterval = 30000; // 30 seconds default
        this.autoSync = true;
        this.syncIntervalId = null;
        this.isSyncing = false;
        this.conflictsResolved = 0;
        this.lastSyncTime = null;
        this.conflictResolutionMode = 'ask'; // ask, server, local, merge
        this.syncOnlyOnChanges = true;
        this.retryFailedSync = true;
        this.maxRetryAttempts = 3;
        this.retryCount = 0;
        this.serverData = null;
        this.lastLocalTimestamp = Date.now();
        this.pendingServerQuotes = null;
        this.lastLocalHash = null;
        
        // Initialize the application
        this.init();
    }

    // Initialize the application
    init() {
        this.loadQuotes();
        this.loadCategories();
        this.loadUserPreferences();
        this.loadSyncMetadata();
        this.setupEventListeners();
        this.populateCategories();
        this.updateStats();
        
        // Start auto-sync
        this.startAutoSync();
        
        // Display initial quote
        setTimeout(() => {
            if (this.lastSelectedCategory) {
                const categoryFilter = document.getElementById('categoryFilter');
                if (categoryFilter) {
                    categoryFilter.value = this.lastSelectedCategory;
                    this.filterQuotes();
                }
            } else {
                this.displayRandomQuote();
            }
        }, 100);
    }

    // Load quotes from localStorage
    loadQuotes() {
        try {
            const storedQuotes = localStorage.getItem(this.STORAGE_KEYS.QUOTES);
            if (storedQuotes) {
                this.quotes = JSON.parse(storedQuotes);
            } else {
                this.initializeDefaultQuotes();
                this.saveQuotes();
            }
            this.filteredQuotes = [...this.quotes];
            this.calculateLocalHash();
        } catch (error) {
            console.error('Error loading quotes:', error);
            this.initializeDefaultQuotes();
        }
    }

    // Initialize default quotes
    initializeDefaultQuotes() {
        this.quotes = [
            {
                id: 1,
                text: "The only way to do great work is to love what you do.",
                author: "Steve Jobs",
                category: "inspirational",
                timestamp: Date.now()
            },
            {
                id: 2,
                text: "Innovation distinguishes between a leader and a follower.",
                author: "Steve Jobs",
                category: "success",
                timestamp: Date.now()
            },
            {
                id: 3,
                text: "Life is what happens to you while you're busy making other plans.",
                author: "John Lennon",
                category: "wisdom",
                timestamp: Date.now()
            },
            {
                id: 4,
                text: "The future belongs to those who believe in the beauty of their dreams.",
                author: "Eleanor Roosevelt",
                category: "motivational",
                timestamp: Date.now()
            },
            {
                id: 5,
                text: "It is during our darkest moments that we must focus to see the light.",
                author: "Aristotle",
                category: "inspirational",
                timestamp: Date.now()
            }
        ];
    }

    // Calculate hash of local data for conflict detection
    calculateLocalHash() {
        const data = JSON.stringify(this.quotes);
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        this.lastLocalHash = hash;
        return hash;
    }

    // Save quotes to localStorage
    saveQuotes() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.QUOTES, JSON.stringify(this.quotes));
            this.lastLocalTimestamp = Date.now();
            this.calculateLocalHash();
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

    // Load user preferences
    loadUserPreferences() {
        try {
            const preferences = localStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES);
            if (preferences) {
                const parsed = JSON.parse(preferences);
                if (parsed.lastCategory) this.lastSelectedCategory = parsed.lastCategory;
                if (parsed.autoSync !== undefined) this.autoSync = parsed.autoSync;
                if (parsed.syncInterval) this.syncInterval = parsed.syncInterval;
                if (parsed.conflictResolutionMode) this.conflictResolutionMode = parsed.conflictResolutionMode;
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }

    // Save user preferences
    saveUserPreferences() {
        try {
            const preferences = {
                lastCategory: this.lastSelectedCategory,
                autoSync: this.autoSync,
                syncInterval: this.syncInterval,
                conflictResolutionMode: this.conflictResolutionMode,
                timestamp: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving user preferences:', error);
        }
    }

    // Load sync metadata
    loadSyncMetadata() {
        try {
            const metadata = localStorage.getItem(this.STORAGE_KEYS.SYNC_METADATA);
            if (metadata) {
                const parsed = JSON.parse(metadata);
                this.lastSyncTime = parsed.lastSyncTime;
                this.conflictsResolved = parsed.conflictsResolved || 0;
                this.retryCount = parsed.retryCount || 0;
            }
        } catch (error) {
            console.error('Error loading sync metadata:', error);
        }
    }

    // Save sync metadata
    saveSyncMetadata() {
        try {
            const metadata = {
                lastSyncTime: this.lastSyncTime,
                conflictsResolved: this.conflictsResolved,
                retryCount: this.retryCount
            };
            localStorage.setItem(this.STORAGE_KEYS.SYNC_METADATA, JSON.stringify(metadata));
        } catch (error) {
            console.error('Error saving sync metadata:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Quote display
        const newQuoteBtn = document.getElementById('newQuote');
        if (newQuoteBtn) newQuoteBtn.addEventListener('click', () => this.displayRandomQuote());

        // Add quote button
        const addQuoteBtn = document.getElementById('addQuoteBtn');
        if (addQuoteBtn) {
            addQuoteBtn.addEventListener('click', () => this.toggleAddQuoteForm());
        }

        // Add quote form
        const quoteForm = document.getElementById('quoteForm');
        if (quoteForm) {
            quoteForm.addEventListener('submit', (e) => this.handleAddQuote(e));
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelAddQuote');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.toggleAddQuoteForm());
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterQuotes());
        }

        // Import/Export
        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.addEventListener('change', (e) => this.importFromJsonFile(e));
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportQuotes());
        }

        // Clear storage
        const clearStorageBtn = document.getElementById('clearStorageBtn');
        if (clearStorageBtn) {
            clearStorageBtn.addEventListener('click', () => this.clearStorage());
        }

        // Sync controls
        const manualSyncBtn = document.getElementById('manualSyncBtn');
        if (manualSyncBtn) {
            manualSyncBtn.addEventListener('click', () => this.manualSync());
        }

        const autoSyncToggle = document.getElementById('autoSyncToggle');
        if (autoSyncToggle) {
            autoSyncToggle.addEventListener('change', (e) => {
                this.autoSync = e.target.checked;
                this.saveUserPreferences();
                if (this.autoSync) {
                    this.startAutoSync();
                } else {
                    this.stopAutoSync();
                }
            });
        }

        const syncIntervalSelect = document.getElementById('syncIntervalSelect');
        if (syncIntervalSelect) {
            syncIntervalSelect.addEventListener('change', (e) => {
                this.syncInterval = parseInt(e.target.value);
                this.saveUserPreferences();
                if (this.autoSync) {
                    this.stopAutoSync();
                    this.startAutoSync();
                }
            });
        }

        const forceSyncBtn = document.getElementById('forceSyncBtn');
        if (forceSyncBtn) {
            forceSyncBtn.addEventListener('click', () => this.performSync(true));
        }

        const resetSyncBtn = document.getElementById('resetSyncBtn');
        if (resetSyncBtn) {
            resetSyncBtn.addEventListener('click', () => this.resetSync());
        }

        // Conflict resolution
        const useServerBtn = document.getElementById('useServerData');
        if (useServerBtn) {
            useServerBtn.addEventListener('click', () => this.resolveConflict('server'));
        }

        const useLocalBtn = document.getElementById('useLocalData');
        if (useLocalBtn) {
            useLocalBtn.addEventListener('click', () => this.resolveConflict('local'));
        }

        const mergeBtn = document.getElementById('mergeData');
        if (mergeBtn) {
            mergeBtn.addEventListener('click', () => this.resolveConflict('merge'));
        }

        const closeConflictBtn = document.getElementById('closeConflictModal');
        if (closeConflictBtn) {
            closeConflictBtn.addEventListener('click', () => this.hideConflictModal());
        }

        // Advanced options
        const conflictModeSelect = document.getElementById('conflictResolutionMode');
        if (conflictModeSelect) {
            conflictModeSelect.addEventListener('change', (e) => {
                this.conflictResolutionMode = e.target.value;
                this.saveUserPreferences();
            });
        }

        const syncOnlyOnChanges = document.getElementById('syncOnlyOnChanges');
        if (syncOnlyOnChanges) {
            syncOnlyOnChanges.addEventListener('change', (e) => {
                this.syncOnlyOnChanges = e.target.checked;
            });
        }

        const retryFailedSync = document.getElementById('retryFailedSync');
        if (retryFailedSync) {
            retryFailedSync.addEventListener('change', (e) => {
                this.retryFailedSync = e.target.checked;
            });
        }

        const maxRetrySelect = document.getElementById('maxRetryAttempts');
        if (maxRetrySelect) {
            maxRetrySelect.addEventListener('change', (e) => {
                this.maxRetryAttempts = parseInt(e.target.value);
            });
        }

        // Close notification
        const closeNotification = document.getElementById('closeNotification');
        if (closeNotification) {
            closeNotification.addEventListener('click', () => {
                const notif = document.getElementById('syncNotifications');
                if (notif) notif.classList.add('hidden');
            });
        }
    }

    // Toggle add quote form visibility
    toggleAddQuoteForm() {
        const form = document.getElementById('addQuoteForm');
        if (form) {
            form.classList.toggle('hidden');
        }
    }

    // Generate unique ID
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // Display random quote
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
    }

    // Display specific quote
    displayQuote(quote) {
        const quoteText = document.getElementById('quoteText');
        const quoteAuthor = document.getElementById('quoteAuthor');
        const quoteCategory = document.getElementById('quoteCategory');

        if (quoteText) quoteText.textContent = `"${quote.text}"`;
        if (quoteAuthor) quoteAuthor.textContent = `– ${quote.author}`;
        if (quoteCategory) quoteCategory.textContent = `Category: ${quote.category}`;
    }

    // Handle adding new quote
    handleAddQuote(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const newQuote = {
            id: this.generateId(),
            text: formData.get('quoteText').trim(),
            author: formData.get('quoteAuthor').trim(),
            category: formData.get('quoteCategory').trim().toLowerCase(),
            timestamp: Date.now()
        };

        if (!newQuote.text || !newQuote.author || !newQuote.category) {
            alert('Please fill in all fields');
            return;
        }

        this.quotes.push(newQuote);
        
        if (!this.categories.includes(newQuote.category)) {
            this.categories.push(newQuote.category);
            this.saveCategories();
            this.populateCategories();
        }

        this.saveQuotes();
        this.updateFilteredQuotes();
        event.target.reset();
        this.toggleAddQuoteForm();
        this.displayQuote(newQuote);
        this.updateStats();
        this.showNotification('Quote added successfully!', 'success');
    }

    // Populate category dropdown
    populateCategories() {
        const categoryFilter = document.getElementById('categoryFilter');
        const addQuoteCategory = document.getElementById('addQuoteCategory');
        
        const uniqueCategories = [...new Set(this.quotes.map(q => q.category))];
        uniqueCategories.forEach(cat => {
            if (!this.categories.includes(cat)) {
                this.categories.push(cat);
            }
        });
        
        if (categoryFilter) {
            const currentSelection = categoryFilter.value;
            categoryFilter.innerHTML = '<option value="all">All Categories</option>';
            
            this.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
                categoryFilter.appendChild(option);
            });
            
            if (currentSelection && [...categoryFilter.options].some(o => o.value === currentSelection)) {
                categoryFilter.value = currentSelection;
            } else if (this.lastSelectedCategory) {
                const exists = [...categoryFilter.options].some(o => o.value === this.lastSelectedCategory);
                if (exists) categoryFilter.value = this.lastSelectedCategory;
            }
        }
        
        if (addQuoteCategory) {
            addQuoteCategory.innerHTML = '';
            this.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
                addQuoteCategory.appendChild(option);
            });
        }
    }

    // Filter quotes by category
    filterQuotes() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;
        
        const selectedCategory = categoryFilter.value;
        this.lastSelectedCategory = selectedCategory;
        this.saveUserPreferences();
        
        if (selectedCategory === 'all') {
            this.filteredQuotes = [...this.quotes];
        } else {
            this.filteredQuotes = this.quotes.filter(q => 
                q.category.toLowerCase() === selectedCategory.toLowerCase()
            );
        }
        
        this.updateStats();
        this.displayRandomQuote();
    }

    // Update filtered quotes
    updateFilteredQuotes() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter && categoryFilter.value !== 'all') {
            this.filterQuotes();
        } else {
            this.filteredQuotes = [...this.quotes];
            this.displayRandomQuote();
        }
    }

    // Export quotes to JSON
    exportQuotes() {
        try {
            const data = {
                quotes: this.quotes,
                categories: this.categories,
                exportDate: new Date().toISOString(),
                version: "1.0"
            };
            
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `quotes_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Quotes exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting:', error);
            this.showNotification('Error exporting quotes', 'error');
        }
    }

    // Import quotes from JSON file
    importFromJsonFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.quotes || !Array.isArray(data.quotes)) {
                    throw new Error('Invalid file format');
                }

                const validQuotes = data.quotes.filter(q => q.text && q.author && q.category);
                
                if (validQuotes.length === 0) {
                    alert('No valid quotes in file');
                    return;
                }

                validQuotes.forEach(q => {
                    if (!q.id) q.id = this.generateId();
                    if (!q.timestamp) q.timestamp = Date.now();
                });

                this.quotes.push(...validQuotes);
                
                if (data.categories && Array.isArray(data.categories)) {
                    data.categories.forEach(cat => {
                        if (!this.categories.includes(cat)) {
                            this.categories.push(cat);
                        }
                    });
                }

                this.saveQuotes();
                this.saveCategories();
                this.filteredQuotes = [...this.quotes];
                this.populateCategories();
                this.updateStats();
                
                this.showNotification(`Imported ${validQuotes.length} quotes!`, 'success');
                event.target.value = '';
            } catch (error) {
                console.error('Error importing:', error);
                this.showNotification('Error importing quotes', 'error');
            }
        };
        
        reader.readAsText(file);
    }

    // Clear all storage
    clearStorage() {
        if (confirm('Clear all quotes and data? This cannot be undone.')) {
            localStorage.removeItem(this.STORAGE_KEYS.QUOTES);
            localStorage.removeItem(this.STORAGE_KEYS.CATEGORIES);
            localStorage.removeItem(this.STORAGE_KEYS.SYNC_METADATA);
            
            this.quotes = [];
            this.categories = ['inspirational', 'motivational', 'wisdom', 'humor', 'success'];
            this.filteredQuotes = [];
            
            this.initializeDefaultQuotes();
            this.saveQuotes();
            this.saveCategories();
            this.populateCategories();
            this.updateStats();
            this.displayRandomQuote();
            
            this.showNotification('All data cleared', 'info');
        }
    }

    // ==================== SERVER SYNC FUNCTIONS ====================

    // Fetch quotes from server using mock API
    async fetchQuotesFromServer() {
        try {
            // Using JSONPlaceholder as mock API
            const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
            
            if (!response.ok) {
                throw new Error('Server unavailable');
            }

            // Simulate server quotes with realistic data
            const serverQuotes = [
                {
                    id: 'server_1',
                    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                    author: "Winston Churchill",
                    category: "success",
                    timestamp: Date.now() - 100000
                },
                {
                    id: 'server_2',
                    text: "The only impossible journey is the one you never begin.",
                    author: "Tony Robbins",
                    category: "motivational",
                    timestamp: Date.now() - 50000
                },
                {
                    id: 'server_3',
                    text: "Believe you can and you're halfway there.",
                    author: "Theodore Roosevelt",
                    category: "inspirational",
                    timestamp: Date.now() - 30000
                }
            ];

            this.serverData = {
                quotes: serverQuotes,
                timestamp: Date.now(),
                serverHash: this.calculateHash(serverQuotes)
            };

            return this.serverData;
        } catch (error) {
            console.error('Error fetching from server:', error);
            return null;
        }
    }

    // Post data to server using mock API
    async postQuotesToServer() {
        try {
            const dataToPost = {
                quotes: this.quotes,
                categories: this.categories,
                timestamp: Date.now(),
                localHash: this.lastLocalHash
            };

            // Using JSONPlaceholder for mock POST
            const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'Quote Generator Sync',
                    body: JSON.stringify(dataToPost),
                    userId: 1
                })
            });

            if (!response.ok) {
                throw new Error('Server post failed');
            }

            const result = await response.json();
            console.log('Data posted to server:', result);
            return true;
        } catch (error) {
            console.error('Error posting to server:', error);
            return false;
        }
    }

    // Calculate hash for data
    calculateHash(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    // Sync quotes with server
    async syncQuotes() {
        if (this.isSyncing) return;

        this.isSyncing = true;
        this.updateSyncStatus('syncing');

        try {
            // Post local data to server
            const postSuccess = await this.postQuotesToServer();
            
            // Fetch updated data from server
            const serverData = await this.fetchQuotesFromServer();

            if (!serverData) {
                this.retryCount++;
                if (this.retryFailedSync && this.retryCount < this.maxRetryAttempts) {
                    this.showNotification('Sync failed, retrying...', 'warning');
                    setTimeout(() => this.syncQuotes(), 2000);
                } else {
                    this.showNotification('Sync failed - server unavailable', 'error');
                    this.updateSyncStatus('offline');
                    this.retryCount = 0;
                }
                this.isSyncing = false;
                return;
            }

            this.retryCount = 0;

            // Check for conflicts
            if (this.detectConflicts(serverData.quotes)) {
                this.handleConflict(serverData.quotes);
                this.isSyncing = false;
                return;
            }

            // No conflict - merge data
            this.mergeServerData(serverData.quotes);
            
            this.lastSyncTime = new Date().toLocaleTimeString();
            this.saveSyncMetadata();
            this.updateSyncStatus('online');
            this.showNotification('Quotes synced with server!', 'success');

        } catch (error) {
            console.error('Sync error:', error);
            this.showNotification('Sync error occurred', 'error');
            this.updateSyncStatus('offline');
        }

        this.isSyncing = false;
    }

    // Detect conflicts between local and server data
    detectConflicts(serverQuotes) {
        // Check if quote counts differ
        if (serverQuotes.length !== this.quotes.length) {
            return true;
        }

        // Check if IDs match
        const serverIds = new Set(serverQuotes.map(q => q.id));
        const localIds = new Set(this.quotes.map(q => q.id));

        // If sets differ, there's a conflict
        if (serverIds.size !== localIds.size) {
            return true;
        }

        for (let id of localIds) {
            if (!serverIds.has(id)) {
                return true;
            }
        }

        return false;
    }

    // Handle conflicts with user notification
    handleConflict(serverQuotes) {
        if (this.conflictResolutionMode === 'ask') {
            this.showConflictModal(serverQuotes);
        } else if (this.conflictResolutionMode === 'server') {
            this.resolveConflict('server', serverQuotes);
        } else if (this.conflictResolutionMode === 'local') {
            this.resolveConflict('local', serverQuotes);
        } else if (this.conflictResolutionMode === 'merge') {
            this.resolveConflict('merge', serverQuotes);
        }
    }

    // Show conflict modal to user
    showConflictModal(serverQuotes) {
        const modal = document.getElementById('conflictModal');
        if (!modal) return;

        document.getElementById('serverQuotesCount').textContent = serverQuotes.length;
        document.getElementById('localQuotesCount').textContent = this.quotes.length;
        document.getElementById('serverUpdateTime').textContent = new Date().toLocaleString();
        document.getElementById('localUpdateTime').textContent = 
            new Date(this.lastLocalTimestamp).toLocaleString();

        this.pendingServerQuotes = serverQuotes;
        
        modal.classList.remove('hidden');
        this.updateSyncStatus('conflict');
    }

    // Hide conflict modal
    hideConflictModal() {
        const modal = document.getElementById('conflictModal');
        if (modal) modal.classList.add('hidden');
    }

    // Resolve conflict with specified strategy
    resolveConflict(strategy, serverQuotes = this.pendingServerQuotes) {
        if (!serverQuotes) return;

        if (strategy === 'server') {
            this.quotes = serverQuotes;
            this.showNotification('Using server data', 'info');
        } else if (strategy === 'local') {
            this.showNotification('Keeping local data', 'info');
        } else if (strategy === 'merge') {
            this.mergeServerData(serverQuotes);
            this.showNotification('Data merged successfully', 'info');
        }

        this.saveQuotes();
        this.filteredQuotes = [...this.quotes];
        this.populateCategories();
        this.updateStats();
        this.conflictsResolved++;
        this.saveSyncMetadata();
        this.hideConflictModal();
        this.updateSyncStatus('online');
    }

    // Merge server data with local data
    mergeServerData(serverQuotes) {
        const serverIds = new Set(serverQuotes.map(q => q.id));
        const existingIds = new Set(this.quotes.map(q => q.id));
        
        // Add new quotes from server that don't exist locally
        serverQuotes.forEach(sq => {
            if (!existingIds.has(sq.id)) {
                this.quotes.push(sq);
            }
        });

        // Extract and add new categories from server
        serverQuotes.forEach(sq => {
            if (!this.categories.includes(sq.category)) {
                this.categories.push(sq.category);
            }
        });

        this.saveQuotes();
        this.saveCategories();
        this.filteredQuotes = [...this.quotes];
        this.populateCategories();
        this.updateStats();
    }

    // Start automatic syncing
    startAutoSync() {
        if (this.syncIntervalId) clearInterval(this.syncIntervalId);
        
        this.syncIntervalId = setInterval(() => {
            if (this.autoSync && !this.isSyncing) {
                this.syncQuotes();
            }
        }, this.syncInterval);
        
        this.updateSyncStatus('online');
    }

    // Stop automatic syncing
    stopAutoSync() {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
        }
        this.updateSyncStatus('offline');
    }

    // Manually trigger sync
    manualSync() {
        this.syncQuotes();
    }

    // Reset sync state
    resetSync() {
        this.conflictsResolved = 0;
        this.retryCount = 0;
        this.lastSyncTime = null;
        this.saveSyncMetadata();
        this.updateSyncStatus('online');
        this.showNotification('Sync reset', 'info');
    }

    // Update sync status in UI
    updateSyncStatus(status) {
        const statusEl = document.getElementById('syncStatus');
        const textEl = document.getElementById('syncText');
        const connectionEl = document.getElementById('connectionStatus');
        const syncStatusEl = document.getElementById('syncStatusText');

        if (statusEl) {
            statusEl.className = `sync-indicator ${status}`;
        }

        const statusMap = {
            'online': { text: 'Online', connection: 'Connected', syncStatus: 'Idle' },
            'offline': { text: 'Offline', connection: 'Disconnected', syncStatus: 'Failed' },
            'syncing': { text: 'Syncing...', connection: 'Syncing', syncStatus: 'In Progress' },
            'conflict': { text: 'Conflict!', connection: 'Conflict Detected', syncStatus: 'Conflict' }
        };

        if (textEl && statusMap[status]) textEl.textContent = statusMap[status].text;
        if (connectionEl && statusMap[status]) connectionEl.textContent = statusMap[status].connection;
        if (syncStatusEl && statusMap[status]) syncStatusEl.textContent = statusMap[status].syncStatus;

        this.updateSyncStats();
    }

    // Show notification to user
    showNotification(message, type = 'info') {
        const notificationEl = document.getElementById('syncNotifications');
        const messageEl = document.getElementById('notificationMessage');
        const iconEl = document.getElementById('notificationIcon');

        if (!notificationEl) return;

        const icons = {
            'success': '✓',
            'error': '✕',
            'warning': '⚠',
            'info': 'ℹ'
        };

        if (messageEl) messageEl.textContent = message;
        if (iconEl) iconEl.textContent = icons[type] || 'ℹ';

        notificationEl.className = `sync-notifications`;
        
        setTimeout(() => {
            notificationEl.classList.add('hidden');
        }, 4000);
    }

    // Update statistics display
    updateStats() {
        const totalQuotes = document.getElementById('totalQuotes');
        const totalCategories = document.getElementById('totalCategories');
        const displayedQuotes = document.getElementById('displayedQuotes');
        const syncHealth = document.getElementById('syncHealth');

        if (totalQuotes) totalQuotes.textContent = this.quotes.length;
        if (totalCategories) totalCategories.textContent = this.categories.length;
        if (displayedQuotes) displayedQuotes.textContent = this.filteredQuotes.length;
        if (syncHealth) syncHealth.textContent = '100%';
    }

    // Update sync statistics
    updateSyncStats() {
        const lastSyncEl = document.getElementById('lastSyncTime');
        const conflictsEl = document.getElementById('conflictsResolved');
        const syncIntervalEl = document.getElementById('syncInterval');

        if (lastSyncEl) lastSyncEl.textContent = this.lastSyncTime || 'Never';
        if (conflictsEl) conflictsEl.textContent = this.conflictsResolved;
        if (syncIntervalEl) syncIntervalEl.textContent = `${this.syncInterval / 1000}s`;
    }
}

// ==================== GLOBAL FUNCTIONS FOR COMPATIBILITY ====================

// Add quote quick function
window.addQuote = function() {
    if (window.quoteGenerator) {
        const text = document.getElementById('newQuoteText');
        const category = document.getElementById('newQuoteCategory');
        
        if (text && category && text.value && category.value) {
            const quote = {
                id: window.quoteGenerator.generateId(),
                text: text.value,
                author: 'Anonymous',
                category: category.value.toLowerCase(),
                timestamp: Date.now()
            };
            
            window.quoteGenerator.quotes.push(quote);
            if (!window.quoteGenerator.categories.includes(quote.category)) {
                window.quoteGenerator.categories.push(quote.category);
                window.quoteGenerator.saveCategories();
                window.quoteGenerator.populateCategories();
            }
            
            window.quoteGenerator.saveQuotes();
            window.quoteGenerator.updateFilteredQuotes();
            text.value = '';
            category.value = '';
            window.quoteGenerator.displayQuote(quote);
            window.quoteGenerator.updateStats();
            window.quoteGenerator.showNotification('Quote added!', 'success');
        }
    }
};

// Filter quotes function
window.filterQuotes = function() {
    if (window.quoteGenerator) {
        window.quoteGenerator.filterQuotes();
    }
};

// Export to JSON function
window.exportToJson = function() {
    if (window.quoteGenerator) {
        window.quoteGenerator.exportQuotes();
    }
};

// Import from JSON file function
window.importFromJsonFile = function(event) {
    if (window.quoteGenerator) {
        window.quoteGenerator.importFromJsonFile(event);
    }
};

// Populate categories function
window.populateCategories = function() {
    if (window.quoteGenerator) {
        window.quoteGenerator.populateCategories();
    }
};

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.quoteGenerator = new QuoteGenerator();
    console.log('Quote Generator initialized with server sync capabilities');
});