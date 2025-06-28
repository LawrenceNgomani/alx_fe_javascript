// Dynamic Quote Generator - Advanced DOM Manipulation with Server Sync
class QuoteGenerator {
  constructor() {
    // Storage keys
    this.STORAGE_KEYS = {
      QUOTES: 'quotes_data',
      CATEGORIES: 'quote_categories',
      LAST_FILTER: 'last_filter',
      USER_PREFERENCES: 'user_preferences',
      LAST_SYNC: 'last_sync_time',
      SYNC_CONFLICTS: 'sync_conflicts',
      SERVER_HASH: 'server_data_hash'
    };
    
    // Server simulation configuration
    this.SERVER_CONFIG = {
      BASE_URL: 'https://jsonplaceholder.typicode.com',
      SYNC_INTERVAL: 30000, // 30 seconds
      TIMEOUT: 10000, // 10 seconds
      MAX_RETRIES: 3
    };
    
    // Initialize data
    this.quotes = [];
    this.serverQuotes = [];
    this.currentQuoteIndex = 0;
    this.filteredQuotes = [];
    this.isFormVisible = false;
    this.syncInterval = null;
    this.conflictsResolved = 0;
    this.lastSyncTime = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.pendingConflicts = [];
    
    this.init();
  }
  
  init() {
    this.loadFromStorage();
    this.cacheElements();
    this.bindEvents();
    this.populateCategories();
    this.populateCategorySelect();
    this.restoreLastFilter();
    this.showRandomQuote();
    this.updateStats();
    this.initializeServerSync();
    this.setupOnlineOfflineHandlers();
    this.updateSyncStatus();
  }
  
  cacheElements() {
    this.elements = {
      quoteDisplay: document.getElementById('quoteDisplay'),
      newQuoteBtn: document.getElementById('newQuote'),
      addQuoteBtn: document.getElementById('addQuoteBtn'),
      categorySelect: document.getElementById('categorySelect'),
      categoryFilter: document.getElementById('categoryFilter'),
      addQuoteForm: document.getElementById('addQuoteForm'),
      quoteStats: document.getElementById('quoteStats'),
      syncStatus: document.getElementById('syncStatus'),
      syncText: document.getElementById('syncText'),
      manualSyncBtn: document.getElementById('manualSyncBtn'),
      conflictModal: document.getElementById('conflictModal'),
      closeConflictModal: document.getElementById('closeConflictModal'),
      useServerData: document.getElementById('useServerData'),
      useLocalData: document.getElementById('useLocalData'),
      mergeData: document.getElementById('mergeData'),
      conflictDetails: document.getElementById('conflictDetails'),
      lastSyncTime: document.getElementById('lastSyncTime'),
      syncInterval: document.getElementById('syncInterval'),
      conflictsResolved: document.getElementById('conflictsResolved'),
      autoSyncToggle: document.getElementById('autoSyncToggle'),
      syncIntervalSelect: document.getElementById('syncIntervalSelect')
    };
  }
  
  bindEvents() {
    this.elements.newQuoteBtn.addEventListener('click', () => this.showRandomQuote());
    this.elements.addQuoteBtn.addEventListener('click', () => this.toggleAddQuoteForm());
    this.elements.categorySelect.addEventListener('change', (e) => this.filterByCategory(e.target.value));
    this.elements.manualSyncBtn.addEventListener('click', () => this.manualSync());
    
    // Conflict resolution events
    this.elements.closeConflictModal.addEventListener('click', () => this.closeConflictModal());
    this.elements.useServerData.addEventListener('click', () => this.resolveConflict('server'));
    this.elements.useLocalData.addEventListener('click', () => this.resolveConflict('local'));
    this.elements.mergeData.addEventListener('click', () => this.resolveConflict('merge'));
    
    // Sync control events
    this.elements.autoSyncToggle.addEventListener('change', (e) => this.toggleAutoSync(e.target.checked));
    this.elements.syncIntervalSelect.addEventListener('change', (e) => this.changeSyncInterval(e.target.value));
    
    // Save filter preference when window closes
    window.addEventListener('beforeunload', () => this.saveToStorage());
  }
  
  // Server Sync Implementation
  initializeServerSync() {
    this.updateSyncIntervalDisplay();
    if (this.isOnline) {
      this.startAutoSync();
      this.performInitialSync();
    }
  }
  
  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (this.elements.autoSyncToggle.checked && this.isOnline) {
      const interval = parseInt(this.elements.syncIntervalSelect.value);
      this.syncInterval = setInterval(() => {
        this.syncWithServer();
      }, interval);
    }
  }
  
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  toggleAutoSync(enabled) {
    if (enabled) {
      this.startAutoSync();
      this.showNotification('Auto-sync enabled', 'success');
    } else {
      this.stopAutoSync();
      this.showNotification('Auto-sync disabled', 'info');
    }
  }
  
  changeSyncInterval(interval) {
    this.SERVER_CONFIG.SYNC_INTERVAL = parseInt(interval);
    this.updateSyncIntervalDisplay();
    if (this.elements.autoSyncToggle.checked) {
      this.startAutoSync(); // Restart with new interval
    }
  }
  
  updateSyncIntervalDisplay() {
    const seconds = this.SERVER_CONFIG.SYNC_INTERVAL / 1000;
    this.elements.syncInterval.textContent = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`;
  }
  
  async performInitialSync() {
    try {
      this.updateSyncStatus('syncing');
      await this.syncWithServer();
      this.showNotification('Initial sync completed', 'success');
    } catch (error) {
      console.error('Initial sync failed:', error);
      this.showNotification('Initial sync failed', 'error');
    }
  }
  
  async manualSync() {
    if (this.syncInProgress) {
      this.showNotification('Sync already in progress', 'info');
      return;
    }
    
    if (!this.isOnline) {
      this.showNotification('Cannot sync while offline',