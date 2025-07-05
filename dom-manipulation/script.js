// Dynamic Quote Generator with Server Sync and Conflict Resolution
class QuoteGenerator {
    constructor() {
        // Storage keys for local and session storage
        this.STORAGE_KEYS = {
            QUOTES: 'quoteGenerator_quotes',
            CATEGORIES: 'quoteGenerator_categories',
            LAST_QUOTE: 'quoteGenerator_lastQuote',
            USER_PREFERENCES: 'quoteGenerator_preferences',
            SYNC_DATA: 'quoteGenerator_syncData',
            LAST_SYNC: 'quoteGenerator_lastSync'
        };

        // Server simulation configuration
        this.SERVER_CONFIG = {
            BASE_URL: 'https://jsonplaceholder.typicode.com',
            SYNC_INTERVAL: 30000, // 30 seconds
            MAX_RETRY_ATTEMPTS: 3,
            TIMEOUT: 5000
        };

        // Initialize arrays
        this.quotes = [];
        this.categories = ['inspirational', 'motivational', 'wisdom', 'humor', 'success'];
        this.filteredQuotes = [];
        this.currentQuoteIndex = 0;
        this.favorites = [];

        // Sync-related properties
        this.syncTimer = null;
        this.lastSyncTime = null;
        this.syncInProgress = false;
        this.retryAttempts = 0;
        this.syncHealth = 100;
        this.conflictsResolved = 0;
        this.autoSyncEnabled = true;
        this.syncInterval = 30000;
        this.conflictResolutionMode = 'ask';
        this.serverData = null;
        this.localDataVersion = 1;
        this.serverDataVersion = 1;

        // Initialize the application
        this.init();
    }

    // Initialize the application
    init() {
        this.loadQuotes();
        this.loadCategories();
        this.loadUserPreferences();
        this.loadSyncData();
        this.setupEventListeners();
        this.populateCategories();
        this.initializeSync();
        
        // Restore last filter selection
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
            this.updateAllStats();
        }, 100);
    }

    // Load sync data from localStorage
    loadSyncData() {
        try {
            const syncData = localStorage.getItem(this.STORAGE_KEYS.SYNC_DATA);
            if (syncData) {
                const parsed = JSON.parse(syncData);
                this.localDataVersion = parsed.localDataVersion || 1;
                this.serverDataVersion = parsed.serverDataVersion || 1;
                this.conflictsResolved = parsed.conflictsResolved || 0;
                this.syncHealth = parsed.syncHealth || 100;
            }
            
            const lastSync = localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
            if (lastSync) {
                this.lastSyncTime = new Date(lastSync);
            }
        } catch (error) {
            console.error('Error loading sync data:', error);
        }
    }

    // Save sync data to localStorage
    saveSyncData() {
        try {
            const syncData = {
                localDataVersion: this.localDataVersion,
                serverDataVersion: this.serverDataVersion,
                conflictsResolved: this.conflictsResolved,
                syncHealth: this.syncHealth,
                timestamp: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEYS.SYNC_DATA, JSON.stringify(syncData));
            
            if (this.lastSyncTime) {
                localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, this.lastSyncTime.toISOString());
            }
        } catch (error) {
            console.error('Error saving sync data:', error);
        }
    }

    // Initialize sync functionality
    initializeSync() {
        this.updateSyncStatus('offline');
        this.updateSyncUI();
        
        // Start auto-sync if enabled
        if (this.autoSyncEnabled) {
            this.startAutoSync();
        }
        
        // Initial sync attempt
        setTimeout(() => {
            this.performSync();
        }, 1000);
    }

    // Start automatic syncing
    startAutoSync() {
        this.stopAutoSync();
        if (this.autoSyncEnabled) {
            this.syncTimer = setInterval(() => {
                if (!this.syncInProgress) {
                    this.performSync();
                }
            }, this.syncInterval);
        }
    }

    // Stop automatic syncing
    stopAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    // Perform synchronization with server
    async performSync() {
        if (this.syncInProgress) return;
        
        this.syncInProgress = true;
        this.updateSyncStatus('syncing');
        this.showNotification('ℹ️', 'Syncing with server...', 'info');
        
        try {
            // Simulate server data fetch
            const serverResponse = await this.fetchServerData();
            
            if (serverResponse && serverResponse.success) {
                const serverQuotes = serverResponse.quotes;
                const serverVersion = serverResponse.version;
                
                // Check for conflicts
                const hasConflicts = this.detectConflicts(serverQuotes, serverVersion);
                
                if (hasConflicts) {
                    await this.handleConflicts(serverQuotes, serverVersion);
                } else {
                    // No conflicts, proceed with sync
                    await this.mergeServerData(serverQuotes, serverVersion);
                    this.showNotification('✅', 'Sync completed successfully', 'success');
                }
                
                this.updateSyncStatus('online');
                this.lastSyncTime = new Date();
                this.retryAttempts = 0;
                this.syncHealth = Math.min(100, this.syncHealth + 10);
                
            } else {
                throw new Error('Server response invalid');
            }
            
        } catch (error) {
            console.error('Sync error:', error);
            this.handleSyncError(error);
        } finally {
            this.syncInProgress = false;
            this.updateSyncUI();
            this.saveSyncData();
        }
    }

    // Simulate server data fetch using JSONPlaceholder
    async fetchServerData() {
        try {
            // Simulate fetching posts as quotes from JSONPlaceholder
            const response = await fetch(`${this.SERVER_CONFIG.BASE_URL}/posts?_limit=10`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: this.SERVER_CONFIG.TIMEOUT
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const posts = await response.json();
            
            // Transform posts into quotes format
            const serverQuotes = posts.map(post => ({
                id: `server_${post.id}`,
                text: post.title,
                author: `User ${post.userId}`,
                category: this.getRandomCategory(),
                source: 'server',
                timestamp: Date.now() - Math.random() * 86400000 // Random timestamp within last day
            }));
            
            return {
                success: true,
                quotes: serverQuotes,
                version: this.serverDataVersion + 1,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('Error fetching server data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get random category for server quotes
    getRandomCategory() {
        const categories = ['inspirational', 'motivational', 'wisdom', 'humor', 'success'];
        return categories[Math.floor(Math.random() * categories.length)];
    }

    // Detect conflicts between local and server data
    detectConflicts(serverQuotes, serverVersion) {
        // Check version conflict
        if (serverVersion <= this.serverDataVersion) {
            return false;
        }
        
        // Check if local data has been modified since last sync
        const localModified = this.localDataVersion > this.serverDataVersion;
        
        // Check for overlapping IDs or significant differences
        const serverIds = new Set(serverQuotes.map(q => q.id));
        const localIds = new Set(this.quotes.map(q => q.id));
        
        // If there are conflicting IDs or local modifications, it's a conflict
        const hasOverlap = [...serverIds].some(id => localIds.has(id));
        
        return localModified || hasOverlap || (serverQuotes.length > 0 && this.quotes.length > 0);
    }

    // Handle conflicts based on resolution strategy
    async handleConflicts(serverQuotes, serverVersion) {
        const resolution = this.conflictResolutionMode;
        
        if (resolution === 'ask') {
            await this.showConflictModal(serverQuotes, serverVersion);
        } else {
            await this.resolveConflictAutomatically(serverQuotes, serverVersion, resolution);
        }
    }

    // Show conflict resolution modal
    showConflictModal(serverQuotes, serverVersion) {
        return new Promise((resolve) => {
            const modal = document.getElementById('conflictModal');
            const serverCount = document.getElementById('serverQuotesCount');
            const localCount = document.getElementById('localQuotesCount');
            const serverTime = document.getElementById('serverUpdateTime');
            const localTime = document.getElementById('localUpdateTime');
            
            if (modal) {
                modal.classList.remove('hidden');
                
                // Update conflict information
                if (serverCount) serverCount.textContent = serverQuotes.length;
                if (localCount) localCount.textContent = this.quotes.length;
                if (serverTime) serverTime.textContent = new Date().toLocaleString();
                if (localTime) localTime.textContent = this.lastSyncTime ? this.lastSyncTime.toLocaleString() : 'Never';
                
                // Set up event listeners for conflict resolution
                const useServerBtn = document.getElementById('useServerData');
                const useLocalBtn = document.getElementById('useLocalData');
                const mergeBtn = document.getElementById('mergeData');
                const closeBtn = document.getElementById('closeConflictModal');
                
                const handleResolution = async (strategy) => {
                    modal.classList.add('hidden');
                    await this.resolveConflictAutomatically(serverQuotes, serverVersion, strategy);
                    resolve();
                };
                
                if (useServerBtn) useServerBtn.onclick = () => handleResolution('server');
                if (useLocalBtn) useLocalBtn.onclick = () => handleResolution('local');
                if (mergeBtn) mergeBtn.onclick = () => handleResolution('merge');
                if (closeBtn) closeBtn.onclick = () => {
                    modal.classList.add('hidden');
                    resolve();
                };
            }
        });
    }

    // Resolve conflicts automatically based on strategy
    async resolveConflictAutomatically(serverQuotes, serverVersion, strategy) {
        let resolvedQuotes = [];
        let message = '';
        
        switch (strategy) {
            case 'server':
                resolvedQuotes = [...serverQuotes];
                message = 'Server data has been applied';
                break;
                
            case 'local':
                resolvedQuotes = [...this.quotes];
                message = 'Local data has been preserved';
                break;
                
            case 'merge':
                resolvedQuotes = await this.mergeQuotes(this.quotes, serverQuotes);
                message = 'Data has been merged successfully';
                break;
                
            default:
                resolvedQuotes = [...this.quotes];
                message = 'No changes applied';
        }
        
        // Apply resolved data
        this.quotes = resolvedQuotes;
        this.serverDataVersion = serverVersion;
        this.localDataVersion = serverVersion;
        this.conflictsResolved++;
        
        // Update storage and UI
        this.saveQuotes();
        this.updateFilteredQuotes();
        this.populateCategories();
        this.updateAllStats();
        
        this.showNotification('✅', message, 'success');
    }

    // Merge local and server quotes intelligently
    async mergeQuotes(localQuotes, serverQuotes) {
        const mergedQuotes = [...localQuotes];
        const localIds = new Set(localQuotes.map(q => q.id));
        
        // Add server quotes that don't exist locally
        serverQuotes.forEach(serverQuote => {
            if (!localIds.has(serverQuote.id)) {
                mergedQuotes.push(serverQuote);
            }
        });
        
        return mergedQuotes;
    }

    // Merge server data when no conflicts
    async mergeServerData(serverQuotes, serverVersion) {
        const mergedQuotes = await this.mergeQuotes(this.quotes, serverQuotes);
        
        this.quotes = mergedQuotes;
        this.serverDataVersion = serverVersion;
        this.localDataVersion = serverVersion;
        
        this.saveQuotes();
        this.updateFilteredQuotes();
        this.populateCategories();
        this.updateAllStats();
    }

    // Handle sync errors
    handleSyncError(error) {
        this.retryAttempts++;
        this.syncHealth = Math.max(0, this.syncHealth - 20);
        
        if (this.retryAttempts >= this.SERVER_CONFIG.MAX_RETRY_ATTEMPTS) {
            this.updateSyncStatus('offline');
            this.showNotification('❌', 'Sync failed. Working offline.', 'error');
            this.retryAttempts = 0;
        } else {
            this.updateSyncStatus('conflict');
            this.showNotification('⚠️', `Sync failed. Retrying... (${this.retryAttempts}/${this.SERVER_CONFIG.MAX_RETRY_ATTEMPTS})`, 'warning');
            
            // Retry after delay
            setTimeout(() => {
                if (!this.syncInProgress) {
                    this.performSync();
                }
            }, 5000);
        }
    }

    // Update sync status indicator
    updateSyncStatus(status) {
        const syncIndicator = document.getElementById('syncStatus');
        const syncText = document.getElementById('syncText');
        const connectionStatus = document.getElementById('connectionStatus');
        const syncStatusText = document.getElementById('syncStatusText');
        
        if (syncIndicator) {
            syncIndicator.className = `sync-indicator ${status}`;
        }
        
        const statusMap = {
            'online': 'Online',
            'offline': 'Offline',
            'syncing': 'Syncing...',
            'conflict': 'Conflict'
        };
        
        if (syncText) syncText.textContent = statusMap[status] || 'Unknown';
        if (connectionStatus) connectionStatus.textContent = statusMap[status] || 'Unknown';
        if (syncStatusText) syncStatusText.textContent = status === 'syncing' ? 'Syncing' : 'Idle';
    }

    // Update sync UI elements
    updateSyncUI() {
        const lastSyncElement = document.getElementById('lastSyncTime');
        const syncIntervalElement = document.getElementById('syncInterval');
        const conflictsResolvedElement = document.getElementById('conflictsResolved');
        const dataVersionElement = document.getElementById('dataVersion');
        
        if (lastSyncElement) {
            lastSyncElement.textContent = this.lastSyncTime ? 
                this.lastSyncTime.toLocaleTimeString() : 'Never';
        }
        
        if (syncIntervalElement) {
            syncIntervalElement.textContent = `${this.syncInterval / 1000}s`;
        }
        
        if (conflictsResolvedElement) {
            conflictsResolvedElement.textContent = this.conflictsResolved;
        }
        
        if (dataVersionElement) {
            dataVersionElement.textContent = `v${this.localDataVersion}`;
        }
    }

    // Show notification
    showNotification(icon, message, type = 'info') {
        const notification = document.getElementById('syncNotifications');
        const notificationIcon = document.getElementById('notificationIcon');
        const notificationMessage = document.getElementById('notificationMessage');
        
        if (notification && notificationIcon && notificationMessage) {
            notificationIcon.textContent = icon;
            notificationMessage.textContent = message;
            
            notification.className = `sync-notifications ${type}`;
            notification.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 5000);
        }
    }

    // Update all stats
    updateAllStats() {
        const totalQuotes = document.getElementById('totalQuotes');
        const totalCategories = document.getElementById('totalCategories');
        const displayedQuotes = document.getElementById('displayedQuotes');
        const syncHealth = document.getElementById('syncHealth');
        const totalQuotesCount = document.getElementById('totalQuotesCount');
        const filteredQuotesCount = document.getElementById('filteredQuotesCount');
        const currentFilterStatus = document.getElementById('currentFilterStatus');
        
        if (totalQuotes) totalQuotes.textContent = this.quotes.length;
        if (totalCategories) totalCategories.textContent = this.categories.length;
        if (displayedQuotes) displayedQuotes.textContent = this.filteredQuotes.length;
        if (syncHealth) syncHealth.textContent = `${this.syncHealth}%`;
        if (totalQuotesCount) totalQuotesCount.textContent = this.quotes.length;
        if (filteredQuotesCount) filteredQuotesCount.textContent = this.filteredQuotes.length;
        
        if (currentFilterStatus) {
            const categoryFilter = document.getElementById('categoryFilter');
            const filterValue = categoryFilter ? categoryFilter.value : 'all';
            currentFilterStatus.textContent = filterValue === 'all' ? 'All Categories' : 
                filterValue.charAt(0).toUpperCase() + filterValue.slice(1);
        }
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
            this.localDataVersion++;
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

    // Load user preferences from localStorage
    loadUserPreferences() {
        try {
            const preferences = localStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES);
            if (preferences) {
                const parsed = JSON.parse(preferences);
                if (parsed.lastCategory) {
                    this.lastSelectedCategory = parsed.lastCategory;
                }
            }
            
            const sessionPreferences = sessionStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES);
            if (sessionPreferences) {
                const parsed = JSON.parse(sessionPreferences);
                if (parsed.timestamp && (!preferences || parsed.timestamp > JSON.parse(preferences).timestamp)) {
                    if (parsed.lastCategory) {
                        this.lastSelectedCategory = parsed.lastCategory;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }

    // Save user preferences to both localStorage and sessionStorage
    saveUserPreferences() {
        try {
            const preferences = {
                lastCategory: this.lastSelectedCategory,
                timestamp: Date.now()
            };
            
            localStorage.setItem(this.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
            sessionStorage.setItem(this.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving user preferences:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Existing event listeners
        const newQuoteBtn = document.getElementById('newQuote');
        if (newQuoteBtn) {
            newQuoteBtn.addEventListener('click', () => this.displayRandomQuote());
        }

        const addQuoteBtn = document.getElementById('addQuoteBtn');
        if (addQuoteBtn) {
            addQuoteBtn.addEventListener('click', () => this.toggleAddQuoteForm());
        }

        const cancelAddQuoteBtn = document.getElementById('cancelAddQuote');
        if (cancelAddQuoteBtn) {
            cancelAddQuoteBtn.addEventListener('click', () => this.hideAddQuoteForm());
        }

        const quoteForm = document.getElementById('quoteForm');
        if (quoteForm) {
            quoteForm.addEventListener('submit', (e) => this.handleAddQuote(e));
        }

        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterQuotes());
        }

        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', () => this.filterQuotes());
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportQuotes());
        }

        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.addEventListener('change', (e) => this.importFromJsonFile(e));
        }

        // Sync-related event listeners
        const manualSyncBtn = document.getElementById('manualSyncBtn');
        if (manualSyncBtn) {
            manualSyncBtn.addEventListener('click', () => this.performSync());
        }

        const forceSyncBtn = document.getElementById('forceSyncBtn');
        if (forceSyncBtn) {
            forceSyncBtn.addEventListener('click', () => this.forceSync());
        }

        const resetSyncBtn = document.getElementById('resetSyncBtn');
        if (resetSyncBtn) {
            resetSyncBtn.addEventListener('click', () => this.resetSync());
        }

        const autoSyncToggle = document.getElementById('autoSyncToggle');
        if (autoSyncToggle) {
            autoSyncToggle.addEventListener('change', (e) => this.toggleAutoSync(e.target.checked));
        }

        const syncIntervalSelect = document.getElementById('syncIntervalSelect');
        if (syncIntervalSelect) {
            syncIntervalSelect.addEventListener('change', (e) => this.changeSyncInterval(e.target.value));
        }

        const conflictResolutionMode = document.getElementById('conflictResolutionMode');
        if (conflictResolutionMode) {
            conflictResolutionMode.addEventListener('change', (e) => {
                this.conflictResolutionMode = e.target.value;
            });
        }

        const closeNotification = document.getElementById('closeNotification');
        if (closeNotification) {
            closeNotification.addEventListener('click', () => this.hideNotification());
        }

        const showConflictDetails = document.getElementById('showConflictDetails');
        if (showConflictDetails) {
            showConflictDetails.addEventListener('click', () => this.toggleConflictDetails(true));
        }

        const hideConflictDetails = document.getElementById('hideConflictDetails');
        if (hideConflictDetails) {
            hideConflictDetails.addEventListener('click', () => this.toggleConflictDetails(false));
        }
    }

    // Toggle add quote form
    toggleAddQuoteForm() {
        const form = document.getElementById('addQuoteForm');
        if (form) {
            form.classList.toggle('hidden');
        }
    }

    // Hide add quote form
    hideAddQuoteForm() {
        const form = document.getElementById('addQuoteForm');
        if (form) {
            form.classList.add('hidden');
        }
    }

    // Force sync
    forceSync() {
        this.retryAttempts = 0;
        this.performSync();
    }

    // Reset sync
    resetSync() {
        if (confirm('Are you sure you want to reset sync data? This will clear sync history.')) {
            this.localDataVersion = 1;
            this.serverDataVersion = 1;
            this.conflictsResolved = 0;
            this.syncHealth = 100;
            this.lastSyncTime = null;
            this.saveSyncData();
            this.updateSyncUI();
            this.showNotification('🔄', 'Sync data has been reset', 'info');
        }
    }

    // Toggle auto sync
    toggleAutoSync(enabled) {
        this.autoSyncEnabled = enabled;
        if (enabled) {
            this.startAutoSync();
            this.showNotification('🔄', 'Auto sync enabled', 'success');
        } else {
            this.stopAutoSync();
            this.showNotification('⏸️', 'Auto sync disabled', 'info');
        }
    }

    // Change sync interval
    changeSyncInterval(interval) {
        this.syncInterval = parseInt(interval);
        if (this.autoSyncEnabled) {
            this.startAutoSync();
        }
        this.updateSyncUI();
        this.showNotification('⏱️', `Sync interval changed to ${this.syncInterval / 1000}s`, 'info');
    }

    // Hide notification
    hideNotification() {
        const notification = document.getElementById('syncNotifications');
        if (notification) {
            notification.classList.add('hidden');
        }
    }

    // Toggle conflict details
    toggleConflictDetails(show) {
        const details = document.getElementById('conflictDetails');
        const showBtn = document.getElementById('showConflictDetails');
        const hideBtn = document.getElementById('hideConflictDetails');
        
        if (details) {
            if (show) {
                details.classList.remove('hidden');
                if (showBtn) showBtn.classList.add('hidden');
                if (hideBtn) hideBtn.classList.remove('hidden');
            } else {
                details.classList.add('hidden');
                if (showBtn) showBtn.classList.remove('hidden');
                if (hideBtn) hideBtn.classList.add('hidden');
            }
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
        const quoteText = document.