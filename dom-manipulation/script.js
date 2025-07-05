// Enhanced Quote Generator with Server Sync and Conflict Resolution
class QuoteGenerator {
    constructor() {
        // Storage keys for local storage
        this.STORAGE_KEYS = {
            QUOTES: 'quoteGenerator_quotes',
            CATEGORIES: 'quoteGenerator_categories',
            LAST_QUOTE: 'quoteGenerator_lastQuote',
            USER_PREFERENCES: 'quoteGenerator_preferences',
            SYNC_METADATA: 'quoteGenerator_syncMetadata',
            PENDING_CHANGES: 'quoteGenerator_pendingChanges'
        };

        // Server simulation configuration
        this.SERVER_CONFIG = {
            BASE_URL: 'https://jsonplaceholder.typicode.com',
            SYNC_INTERVAL: 30000, // 30 seconds
            RETRY_ATTEMPTS: 3,
            RETRY_DELAY: 2000
        };

        // Initialize arrays
        this.quotes = [];
        this.categories = ['inspirational', 'motivational', 'wisdom', 'humor', 'success'];
        this.filteredQuotes = [];
        this.currentQuoteIndex = 0;
        this.favorites = [];
        this.pendingChanges = [];
        this.syncMetadata = {
            lastSync: null,
            serverVersion: 0,
            localVersion: 0,
            conflictCount: 0
        };

        // Sync state management
        this.syncTimer = null;
        this.isSyncing = false;
        this.syncCallbacks = [];

        // Initialize the application
        this.init();
    }

    // Initialize the application
    init() {
        this.loadQuotes();
        this.loadCategories();
        this.loadUserPreferences();
        this.loadSyncMetadata();
        this.loadPendingChanges();
        this.setupEventListeners();
        this.populateCategories();
        this.setupSyncUI();
        this.startPeriodicSync();
        
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
        }, 100);
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
                        category: "inspirational",
                        timestamp: Date.now(),
                        source: 'local'
                    },
                    {
                        id: 2,
                        text: "Innovation distinguishes between a leader and a follower.",
                        author: "Steve Jobs",
                        category: "success",
                        timestamp: Date.now(),
                        source: 'local'
                    },
                    {
                        id: 3,
                        text: "Life is what happens to you while you're busy making other plans.",
                        author: "John Lennon",
                        category: "wisdom",
                        timestamp: Date.now(),
                        source: 'local'
                    },
                    {
                        id: 4,
                        text: "The future belongs to those who believe in the beauty of their dreams.",
                        author: "Eleanor Roosevelt",
                        category: "motivational",
                        timestamp: Date.now(),
                        source: 'local'
                    },
                    {
                        id: 5,
                        text: "It is during our darkest moments that we must focus to see the light.",
                        author: "Aristotle",
                        category: "inspirational",
                        timestamp: Date.now(),
                        source: 'local'
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
            this.syncMetadata.localVersion++;
            this.saveSyncMetadata();
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
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }

    // Save user preferences to localStorage
    saveUserPreferences() {
        try {
            const preferences = {
                lastCategory: this.lastSelectedCategory,
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
                this.syncMetadata = { ...this.syncMetadata, ...JSON.parse(metadata) };
            }
        } catch (error) {
            console.error('Error loading sync metadata:', error);
        }
    }

    // Save sync metadata
    saveSyncMetadata() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.SYNC_METADATA, JSON.stringify(this.syncMetadata));
        } catch (error) {
            console.error('Error saving sync metadata:', error);
        }
    }

    // Load pending changes
    loadPendingChanges() {
        try {
            const pending = localStorage.getItem(this.STORAGE_KEYS.PENDING_CHANGES);
            if (pending) {
                this.pendingChanges = JSON.parse(pending);
            }
        } catch (error) {
            console.error('Error loading pending changes:', error);
        }
    }

    // Save pending changes
    savePendingChanges() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.PENDING_CHANGES, JSON.stringify(this.pendingChanges));
        } catch (error) {
            console.error('Error saving pending changes:', error);
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
            categoryFilter.addEventListener('change', (e) => this.filterQuotes());
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

        // Sync control buttons
        const syncBtn = document.getElementById('syncNow');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.manualSync());
        }

        const toggleSyncBtn = document.getElementById('toggleSync');
        if (toggleSyncBtn) {
            toggleSyncBtn.addEventListener('click', () => this.togglePeriodicSync());
        }

        const resolveConflictsBtn = document.getElementById('resolveConflicts');
        if (resolveConflictsBtn) {
            resolveConflictsBtn.addEventListener('click', () => this.showConflictResolution());
        }
    }

    // Setup sync UI elements
    setupSyncUI() {
        // Create sync status indicator
        this.createSyncStatusIndicator();
        this.updateSyncStatus('idle');
        
        // Create conflict notification area
        this.createConflictNotification();
        
        // Update sync info display
        this.updateSyncInfo();
    }

    // Create sync status indicator
    createSyncStatusIndicator() {
        const container = document.querySelector('.container') || document.body;
        const syncStatus = document.createElement('div');
        syncStatus.id = 'syncStatus';
        syncStatus.className = 'sync-status';
        syncStatus.innerHTML = `
            <div class="sync-indicator">
                <span class="sync-icon">🔄</span>
                <span class="sync-text">Sync Status: <span id="syncStatusText">Idle</span></span>
                <span class="sync-time">Last sync: <span id="lastSyncTime">Never</span></span>
            </div>
            <div class="sync-controls">
                <button id="syncNow" class="btn btn-sm">Sync Now</button>
                <button id="toggleSync" class="btn btn-sm">Toggle Auto-Sync</button>
                <button id="resolveConflicts" class="btn btn-sm" style="display: none;">Resolve Conflicts</button>
            </div>
        `;
        
        container.insertBefore(syncStatus, container.firstChild);
        
        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            .sync-status {
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 5px;
                padding: 10px;
                margin-bottom: 20px;
                font-size: 14px;
            }
            .sync-indicator {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            .sync-icon {
                font-size: 16px;
                animation: none;
            }
            .sync-icon.spinning {
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .sync-controls {
                display: flex;
                gap: 10px;
            }
            .btn {
                padding: 5px 10px;
                border: 1px solid #ccc;
                border-radius: 3px;
                background: white;
                cursor: pointer;
                font-size: 12px;
            }
            .btn:hover {
                background: #f0f0f0;
            }
            .btn-sm {
                padding: 3px 8px;
                font-size: 11px;
            }
            .conflict-notification {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 10px;
                margin-bottom: 15px;
                display: none;
            }
            .conflict-notification.show {
                display: block;
            }
            .conflict-notification.error {
                background: #f8d7da;
                border-color: #f5c6cb;
            }
            .conflict-notification.success {
                background: #d1ecf1;
                border-color: #b8daff;
            }
            .conflict-list {
                max-height: 200px;
                overflow-y: auto;
                margin: 10px 0;
            }
            .conflict-item {
                padding: 8px;
                margin: 5px 0;
                border: 1px solid #ddd;
                border-radius: 3px;
                background: white;
            }
            .conflict-actions {
                margin-top: 10px;
                display: flex;
                gap: 10px;
            }
        `;
        document.head.appendChild(style);
    }

    // Create conflict notification area
    createConflictNotification() {
        const container = document.querySelector('.container') || document.body;
        const notification = document.createElement('div');
        notification.id = 'conflictNotification';
        notification.className = 'conflict-notification';
        
        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus) {
            container.insertBefore(notification, syncStatus.nextSibling);
        } else {
            container.appendChild(notification);
        }
    }

    // Update sync status
    updateSyncStatus(status, message = '') {
        const statusText = document.getElementById('syncStatusText');
        const syncIcon = document.querySelector('.sync-icon');
        const lastSyncTime = document.getElementById('lastSyncTime');
        
        if (statusText) {
            statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        }
        
        if (syncIcon) {
            syncIcon.classList.toggle('spinning', status === 'syncing');
        }
        
        if (lastSyncTime && this.syncMetadata.lastSync) {
            const lastSync = new Date(this.syncMetadata.lastSync);
            lastSyncTime.textContent = lastSync.toLocaleString();
        }
        
        // Update resolve conflicts button visibility
        const resolveBtn = document.getElementById('resolveConflicts');
        if (resolveBtn) {
            resolveBtn.style.display = this.syncMetadata.conflictCount > 0 ? 'inline-block' : 'none';
        }
        
        if (message) {
            this.showNotification(message, status === 'error' ? 'error' : 'success');
        }
    }

    // Start periodic sync
    startPeriodicSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        
        this.syncTimer = setInterval(() => {
            this.performSync();
        }, this.SERVER_CONFIG.SYNC_INTERVAL);
        
        // Perform initial sync
        setTimeout(() => this.performSync(), 1000);
    }

    // Stop periodic sync
    stopPeriodicSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    // Toggle periodic sync
    togglePeriodicSync() {
        if (this.syncTimer) {
            this.stopPeriodicSync();
            this.updateSyncStatus('stopped', 'Auto-sync disabled');
        } else {
            this.startPeriodicSync();
            this.updateSyncStatus('enabled', 'Auto-sync enabled');
        }
    }

    // Manual sync trigger
    async manualSync() {
        await this.performSync(true);
    }

    // Perform sync with server
    async performSync(isManual = false) {
        if (this.isSyncing) {
            if (isManual) {
                this.showNotification('Sync already in progress', 'info');
            }
            return;
        }
        
        this.isSyncing = true;
        this.updateSyncStatus('syncing');
        
        try {
            // Step 1: Fetch server data
            const serverData = await this.fetchServerData();
            
            // Step 2: Process and merge data
            const conflicts = await this.processServerData(serverData);
            
            // Step 3: Send pending changes to server
            await this.sendPendingChanges();
            
            // Step 4: Update sync metadata
            this.syncMetadata.lastSync = Date.now();
            this.syncMetadata.conflictCount = conflicts.length;
            this.saveSyncMetadata();
            
            // Step 5: Update UI
            this.updateSyncStatus('success', 
                `Sync completed. ${conflicts.length} conflicts ${conflicts.length > 0 ? 'detected' : 'resolved'}`);
            
            if (conflicts.length > 0) {
                this.handleConflicts(conflicts);
            }
            
        } catch (error) {
            console.error('Sync error:', error);
            this.updateSyncStatus('error', `Sync failed: ${error.message}`);
        } finally {
            this.isSyncing = false;
        }
    }

    // Fetch data from server (simulated)
    async fetchServerData() {
        try {
            // Simulate server API call using JSONPlaceholder
            const response = await fetch(`${this.SERVER_CONFIG.BASE_URL}/posts`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const posts = await response.json();
            
            // Transform posts into quote format (simulation)
            const serverQuotes = posts.slice(0, 5).map((post, index) => ({
                id: `server_${post.id}`,
                text: post.title,
                author: `User ${post.userId}`,
                category: this.categories[index % this.categories.length],
                timestamp: Date.now() - (index * 3600000), // Simulate different timestamps
                source: 'server',
                serverId: post.id
            }));
            
            return {
                quotes: serverQuotes,
                version: Math.floor(Date.now() / 1000), // Simulate server version
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('Error fetching server data:', error);
            throw new Error('Failed to fetch server data');
        }
    }

    // Process server data and detect conflicts
    async processServerData(serverData) {
        const conflicts = [];
        const newQuotes = [];
        
        // Check for conflicts and new quotes
        for (const serverQuote of serverData.quotes) {
            const existingQuote = this.quotes.find(q => 
                q.id === serverQuote.id || 
                (q.serverId && q.serverId === serverQuote.serverId)
            );
            
            if (existingQuote) {
                // Check if there's a conflict
                if (existingQuote.text !== serverQuote.text || 
                    existingQuote.author !== serverQuote.author ||
                    existingQuote.category !== serverQuote.category) {
                    
                    conflicts.push({
                        type: 'modification',
                        local: existingQuote,
                        server: serverQuote,
                        id: existingQuote.id
                    });
                }
            } else {
                // New quote from server
                newQuotes.push(serverQuote);
            }
        }
        
        // Apply conflict resolution strategy (server takes precedence)
        for (const conflict of conflicts) {
            const index = this.quotes.findIndex(q => q.id === conflict.local.id);
            if (index !== -1) {
                // Server data takes precedence
                this.quotes[index] = { ...conflict.server };
            }
        }
        
        // Add new quotes from server
        this.quotes.push(...newQuotes);
        
        // Update local storage
        if (conflicts.length > 0 || newQuotes.length > 0) {
            this.saveQuotes();
            this.updateFilteredQuotes();
            this.updateQuoteCount();
        }
        
        return conflicts;
    }

    // Send pending changes to server (simulated)
    async sendPendingChanges() {
        if (this.pendingChanges.length === 0) {
            return;
        }
        
        try {
            for (const change of this.pendingChanges) {
                // Simulate sending to server
                const response = await fetch(`${this.SERVER_CONFIG.BASE_URL}/posts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: change.quote.text,
                        body: change.quote.author,
                        userId: 1
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    // Update local quote with server ID
                    const localQuote = this.quotes.find(q => q.id === change.quote.id);
                    if (localQuote) {
                        localQuote.serverId = result.id;
                    }
                }
            }
            
            // Clear pending changes
            this.pendingChanges = [];
            this.savePendingChanges();
            
        } catch (error) {
            console.error('Error sending pending changes:', error);
            // Keep pending changes for retry
        }
    }

    // Handle conflicts with user notification
    handleConflicts(conflicts) {
        const notification = document.getElementById('conflictNotification');
        if (!notification) return;
        
        notification.innerHTML = `
            <div class="conflict-header">
                <h4>🔄 Data Conflicts Detected</h4>
                <p>${conflicts.length} conflicts were automatically resolved using server data.</p>
            </div>
            <div class="conflict-list">
                ${conflicts.map(conflict => `
                    <div class="conflict-item">
                        <strong>Quote:</strong> "${conflict.local.text}"<br>
                        <strong>Local Author:</strong> ${conflict.local.author}<br>
                        <strong>Server Author:</strong> ${conflict.server.author}<br>
                        <em>Server version was applied</em>
                    </div>
                `).join('')}
            </div>
            <div class="conflict-actions">
                <button onclick="quoteGenerator.hideConflictNotification()" class="btn">Close</button>
                <button onclick="quoteGenerator.showConflictResolution()" class="btn">Review All</button>
            </div>
        `;
        
        notification.className = 'conflict-notification show';
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideConflictNotification();
        }, 10000);
    }

    // Show conflict resolution dialog
    showConflictResolution() {
        const modal = document.createElement('div');
        modal.className = 'conflict-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Conflict Resolution History</h3>
                    <button onclick="this.closest('.conflict-modal').remove()" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Total conflicts resolved: ${this.syncMetadata.conflictCount}</p>
                    <p>Resolution strategy: Server data takes precedence</p>
                    <div class="sync-info">
                        <p><strong>Last sync:</strong> ${this.syncMetadata.lastSync ? new Date(this.syncMetadata.lastSync).toLocaleString() : 'Never'}</p>
                        <p><strong>Local version:</strong> ${this.syncMetadata.localVersion}</p>
                        <p><strong>Server version:</strong> ${this.syncMetadata.serverVersion}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="quoteGenerator.resetConflictCount()" class="btn">Reset Count</button>
                    <button onclick="this.closest('.conflict-modal').remove()" class="btn">Close</button>
                </div>
            </div>
        `;
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .conflict-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .modal-content {
                background: white;
                padding: 20px;
                border-radius: 8px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }
            .close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
            }
            .modal-footer {
                margin-top: 15px;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            .sync-info {
                background: #f8f9fa;
                padding: 10px;
                border-radius: 5px;
                margin-top: 10px;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(modal);
    }

    // Hide conflict notification
    hideConflictNotification() {
        const notification = document.getElementById('conflictNotification');
        if (notification) {
            notification.classList.remove('show');
        }
    }

    // Reset conflict count
    resetConflictCount() {
        this.syncMetadata.conflictCount = 0;
        this.saveSyncMetadata();
        this.updateSyncStatus('idle', 'Conflict count reset');
        
        // Close modal
        const modal = document.querySelector('.conflict-modal');
        if (modal) {
            modal.remove();
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.getElementById('conflictNotification');
        if (!notification) return;
        
        notification.className = `conflict-notification show ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
                <span class="notification-message">${message}</span>
                <button onclick="quoteGenerator.hideConflictNotification()" class="btn btn-sm">×</button>
            </div>
        `;
        
        // Auto-hide info notifications
        if (type === 'info' || type === 'success') {
            setTimeout(() => {
                this.hideConflictNotification();
            }, 3000);
        }
    }

    // Update sync info display
    updateSyncInfo() {
        // This could be used to update a more detailed sync info panel
        console.log('Sync Info:', {
            quotes: this.quotes.length,
            pendingChanges: this.pendingChanges.length,
            lastSync: this.syncMetadata.lastSync,
            conflicts: this.syncMetadata.conflictCount
        });
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
    }

    // Display a specific quote
    displayQuote(quote) {
        const quoteText = document.getElementById('quoteText');
        const quoteAuthor = document.getElementById('quoteAuthor');
        const quoteCategory = document.getElementById('quoteCategory');

        if (quoteText) quoteText.textContent = `"${quote.text}"`;
        if (quoteAuthor) quoteAuthor.textContent = `— ${quote.author}`;
        if (quoteCategory) {
            const sourceIndicator = quote.source === 'server' ? ' 🌐' : '';
            quoteCategory.textContent = `Category: ${quote.category}${sourceIndicator}`;
        }
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
            timestamp: Date.now(),
            source: 'local'
        };

        // Validate input
        if (!newQuote.text || !newQuote.author || !newQuote.category) {
            alert('Please fill in all fields');
            return;
        }

        // Add to quotes array
        this.quotes.push(newQuote);
        
        // Add to pending changes for server sync
        this.pendingChanges.push({
            action: 'add',
            quote: newQuote,
            timestamp: Date.now()
        });
        this.savePendingChanges();
        
        // Add category if it doesn't exist
        if (!this.categories.includes(newQuote.category)) {
            this.categories.push(newQuote.category);
            this.saveCategories();
            this.populateCategories();
        }

        // Save to localStorage
        this.saveQuotes();
        
        // Update filtered quotes and refresh display
        this.updateFilteredQuotes();