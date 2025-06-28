// Dynamic Quote Generator - Advanced DOM Manipulation
class QuoteGenerator {
  constructor() {
    this.quotes = [
      {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        category: "motivation"
      }

// Step 2: Global filterQuotes function as required
function filterQuotes() {
  const categoryFilter = document.getElementById('categoryFilter');
  if (!categoryFilter) return;
  
  const selectedCategory = categoryFilter.value;
  const generator = window.quoteGeneratorInstance;
  
  if (generator) {
    generator.filterByCategory(selectedCategory);
    showGlobalNotification(`Filtered by: ${selectedCategory === 'all' ? 'All Categories' : selectedCategory}`, 'info');
  }
}

// Enhanced addQuote function with storage integration
function addQuote() {
  const quoteText = document.getElementById('newQuoteText').value;
  const quoteCategory = document.getElementById('newQuoteCategory').value;
  
  // Validate inputs
  if (!quoteText.trim()) {
    showGlobalNotification('Please enter a quote text.', 'error');
    return;
  }
  
  if (!quoteCategory.trim()) {
    showGlobalNotification('Please enter a quote category.', 'error');
    return;
  }
  
  // Get the QuoteGenerator instance
  const generator = window.quoteGeneratorInstance;
  if (!generator) {
    showGlobalNotification('Quote generator not initialized.', 'error');
    return;
  }
  
  // Add quote through the instance
  generator.addQuoteDirectly(quoteText.trim(), quoteCategory.trim());
  
  // Clear form inputs
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
  
  showGlobalNotification('Quote added and saved to storage!', 'success');
}

// Global notification function
function showGlobalNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Style the notification
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '15px 20px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '10000',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s ease',
    maxWidth: '300px'
  });
  
  // Set background color based on type
  switch (type) {
    case 'success':
      notification.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
      break;
    case 'error':
      notification.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
      break;
    default:
      notification.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Animate out and remove
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
},
      {
        text: "Innovation distinguishes between a leader and a follower.",
        author: "Steve Jobs",
        category: "innovation"
      },
      {
        text: "Life is what happens to you while you're busy making other plans.",
        author: "John Lennon",
        category: "life"
      },
      {
        text: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
        category: "dreams"
      },
      {
        text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
        category: "success"
      },
      {
        text: "The only impossible journey is the one you never begin.",
        author: "Tony Robbins",
        category: "motivation"
      },
      {
        text: "In the middle of difficulty lies opportunity.",
        author: "Albert Einstein",
        category: "opportunity"
      },
      {
        text: "The way to get started is to quit talking and begin doing.",
        author: "Walt Disney",
        category: "action"
      }
    ];
    
    this.currentQuoteIndex = 0;
    this.filteredQuotes = [...this.quotes];
    this.isFormVisible = false;
    
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
  }
  
  cacheElements() {
    this.elements = {
      quoteDisplay: document.getElementById('quoteDisplay'),
      newQuoteBtn: document.getElementById('newQuote'),
      addQuoteBtn: document.getElementById('addQuoteBtn'),
      categorySelect: document.getElementById('categorySelect'),
      categoryFilter: document.getElementById('categoryFilter'),
      addQuoteForm: document.getElementById('addQuoteForm'),
      quoteStats: document.getElementById('quoteStats')
    };
  }
  
  bindEvents() {
    this.elements.newQuoteBtn.addEventListener('click', () => this.showRandomQuote());
    this.elements.addQuoteBtn.addEventListener('click', () => this.toggleAddQuoteForm());
    this.elements.categorySelect.addEventListener('change', (e) => this.filterByCategory(e.target.value));
    
    // Save filter preference when window closes
    window.addEventListener('beforeunload', () => this.saveToStorage());
  }
  
  // Step 2: Web Storage Implementation
  loadFromStorage() {
    try {
      // Load quotes from storage or use defaults
      const savedQuotes = localStorage.getItem(this.STORAGE_KEYS.QUOTES);
      if (savedQuotes) {
        this.quotes = JSON.parse(savedQuotes);
      } else {
        // Default quotes if none in storage
        this.quotes = [
          {
            text: "The only way to do great work is to love what you do.",
            author: "Steve Jobs",
            category: "motivation"
          },
          {
            text: "Innovation distinguishes between a leader and a follower.",
            author: "Steve Jobs",
            category: "innovation"
          },
          {
            text: "Life is what happens to you while you're busy making other plans.",
            author: "John Lennon",
            category: "life"
          },
          {
            text: "The future belongs to those who believe in the beauty of their dreams.",
            author: "Eleanor Roosevelt",
            category: "dreams"
          },
          {
            text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            author: "Winston Churchill",
            category: "success"
          },
          {
            text: "The only impossible journey is the one you never begin.",
            author: "Tony Robbins",
            category: "motivation"
          },
          {
            text: "In the middle of difficulty lies opportunity.",
            author: "Albert Einstein",
            category: "opportunity"
          },
          {
            text: "The way to get started is to quit talking and begin doing.",
            author: "Walt Disney",
            category: "action"
          }
        ];
        this.saveToStorage();
      }
      
      // Load last selected filter
      const lastFilter = localStorage.getItem(this.STORAGE_KEYS.LAST_FILTER);
      this.lastSelectedFilter = lastFilter || 'all';
      
      // Initialize filtered quotes
      this.filteredQuotes = [...this.quotes];
      
    } catch (error) {
      console.error('Error loading from storage:', error);
      this.showNotification('Error loading saved data. Using defaults.', 'error');
    }
  }
  
  saveToStorage() {
    try {
      // Save quotes as JSON
      localStorage.setItem(this.STORAGE_KEYS.QUOTES, JSON.stringify(this.quotes));
      
      // Save categories
      const categories = this.getUniqueCategories();
      localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      
      // Save last filter
      const currentFilter = this.elements.categoryFilter ? this.elements.categoryFilter.value : 'all';
      localStorage.setItem(this.STORAGE_KEYS.LAST_FILTER, currentFilter);
      
      // Save user preferences
      const preferences = {
        totalQuotes: this.quotes.length,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(this.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
      
    } catch (error) {
      console.error('Error saving to storage:', error);
      this.showNotification('Error saving data to storage.', 'error');
    }
  }
  
  restoreLastFilter() {
    if (this.elements.categoryFilter && this.lastSelectedFilter !== 'all') {
      this.elements.categoryFilter.value = this.lastSelectedFilter;
      this.elements.categorySelect.value = this.lastSelectedFilter;
      this.filterByCategory(this.lastSelectedFilter);
    }
  }
  
  // Step 2: Populate Categories Dynamically
  populateCategories() {
    if (!this.elements.categoryFilter) return;
    
    // Clear existing options except "All Categories"
    this.elements.categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    // Get unique categories and add them
    const categories = this.getUniqueCategories();
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      this.elements.categoryFilter.appendChild(option);
    });
  }
  
  showRandomQuote() {
    if (this.filteredQuotes.length === 0) {
      this.displayNoQuotesMessage();
      return;
    }
    
    // Get random quote from filtered quotes
    const randomIndex = Math.floor(Math.random() * this.filteredQuotes.length);
    const quote = this.filteredQuotes[randomIndex];
    
    // Clear previous content with animation
    this.elements.quoteDisplay.style.opacity = '0';
    
    setTimeout(() => {
      this.displayQuote(quote);
      this.elements.quoteDisplay.style.opacity = '1';
    }, 150);
  }
  
  displayQuote(quote) {
    // Clear existing content
    this.elements.quoteDisplay.innerHTML = '';
    
    // Create quote elements dynamically
    const quoteTextElement = document.createElement('div');
    quoteTextElement.className = 'quote-text';
    quoteTextElement.textContent = `"${quote.text}"`;
    
    const quoteAuthorElement = document.createElement('div');
    quoteAuthorElement.className = 'quote-author';
    quoteAuthorElement.textContent = `— ${quote.author}`;
    
    const quoteCategoryElement = document.createElement('div');
    quoteCategoryElement.className = 'quote-category';
    quoteCategoryElement.textContent = quote.category.toUpperCase();
    
    // Append elements to quote display
    this.elements.quoteDisplay.appendChild(quoteTextElement);
    this.elements.quoteDisplay.appendChild(quoteAuthorElement);
    this.elements.quoteDisplay.appendChild(quoteCategoryElement);
    
    // Add click event to copy quote
    this.elements.quoteDisplay.addEventListener('click', () => this.copyQuoteToClipboard(quote));
    this.elements.quoteDisplay.style.cursor = 'pointer';
    this.elements.quoteDisplay.title = 'Click to copy quote';
  }
  
  displayNoQuotesMessage() {
    this.elements.quoteDisplay.innerHTML = '';
    
    const messageElement = document.createElement('div');
    messageElement.className = 'quote-text';
    messageElement.textContent = 'No quotes available for the selected category.';
    messageElement.style.color = '#95a5a6';
    
    this.elements.quoteDisplay.appendChild(messageElement);
  }
  
  createAddQuoteForm() {
    // Clear existing form
    this.elements.addQuoteForm.innerHTML = '';
    
    const formTitle = document.createElement('h3');
    formTitle.textContent = 'Add New Quote';
    formTitle.style.marginBottom = '20px';
    formTitle.style.color = '#2c3e50';
    
    // Quote text input
    const quoteGroup = document.createElement('div');
    quoteGroup.className = 'form-group';
    
    const quoteLabel = document.createElement('label');
    quoteLabel.textContent = 'Quote Text:';
    quoteLabel.setAttribute('for', 'quoteText');
    
    const quoteTextarea = document.createElement('textarea');
    quoteTextarea.id = 'quoteText';
    quoteTextarea.placeholder = 'Enter the quote text...';
    quoteTextarea.required = true;
    
    quoteGroup.appendChild(quoteLabel);
    quoteGroup.appendChild(quoteTextarea);
    
    // Author input
    const authorGroup = document.createElement('div');
    authorGroup.className = 'form-group';
    
    const authorLabel = document.createElement('label');
    authorLabel.textContent = 'Author:';
    authorLabel.setAttribute('for', 'quoteAuthor');
    
    const authorInput = document.createElement('input');
    authorInput.type = 'text';
    authorInput.id = 'quoteAuthor';
    authorInput.placeholder = 'Enter author name...';
    authorInput.required = true;
    
    authorGroup.appendChild(authorLabel);
    authorGroup.appendChild(authorInput);
    
    // Category input/select
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'form-group';
    
    const categoryLabel = document.createElement('label');
    categoryLabel.textContent = 'Category:';
    categoryLabel.setAttribute('for', 'quoteCategory');
    
    const categoryContainer = document.createElement('div');
    categoryContainer.style.display = 'flex';
    categoryContainer.style.gap = '10px';
    
    const categorySelect = document.createElement('select');
    categorySelect.id = 'quoteCategory';
    categorySelect.style.flex = '1';
    
    // Add existing categories to select
    const existingCategories = this.getUniqueCategories();
    existingCategories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      categorySelect.appendChild(option);
    });
    
    // Add new category option
    const newCategoryOption = document.createElement('option');
    newCategoryOption.value = 'new';
    newCategoryOption.textContent = 'Add New Category';
    categorySelect.appendChild(newCategoryOption);
    
    const newCategoryInput = document.createElement('input');
    newCategoryInput.type = 'text';
    newCategoryInput.placeholder = 'New category name...';
    newCategoryInput.style.flex = '1';
    newCategoryInput.style.display = 'none';
    
    categorySelect.addEventListener('change', (e) => {
      if (e.target.value === 'new') {
        newCategoryInput.style.display = 'block';
        newCategoryInput.focus();
      } else {
        newCategoryInput.style.display = 'none';
      }
    });
    
    categoryContainer.appendChild(categorySelect);
    categoryContainer.appendChild(newCategoryInput);
    
    categoryGroup.appendChild(categoryLabel);
    categoryGroup.appendChild(categoryContainer);
    
    // Form actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'form-actions';
    
    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'btn btn-success';
    submitBtn.textContent = 'Add Quote';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-danger';
    cancelBtn.textContent = 'Cancel';
    
    // Event listeners for form actions
    submitBtn.addEventListener('click', () => {
      this.addNewQuote(quoteTextarea.value, authorInput.value, 
        categorySelect.value === 'new' ? newCategoryInput.value : categorySelect.value);
    });
    
    cancelBtn.addEventListener('click', () => {
      this.toggleAddQuoteForm();
    });
    
    actionsDiv.appendChild(submitBtn);
    actionsDiv.appendChild(cancelBtn);
    
    // Append all elements to form
    this.elements.addQuoteForm.appendChild(formTitle);
    this.elements.addQuoteForm.appendChild(quoteGroup);
    this.elements.addQuoteForm.appendChild(authorGroup);
    this.elements.addQuoteForm.appendChild(categoryGroup);
    this.elements.addQuoteForm.appendChild(actionsDiv);
  }
  
  toggleAddQuoteForm() {
    this.isFormVisible = !this.isFormVisible;
    
    if (this.isFormVisible) {
      this.createAddQuoteForm();
      this.elements.addQuoteForm.classList.remove('hidden');
      this.elements.addQuoteForm.classList.add('show');
      this.elements.addQuoteBtn.textContent = 'Cancel';
      
      // Smooth scroll to form
      this.elements.addQuoteForm.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    } else {
      this.elements.addQuoteForm.classList.add('hidden');
      this.elements.addQuoteForm.classList.remove('show');
      this.elements.addQuoteBtn.textContent = 'Add New Quote';
    }
  }
  
  addNewQuote(text, author, category) {
    // Validate inputs
    if (!text.trim() || !author.trim() || !category.trim()) {
      this.showNotification('Please fill in all fields.', 'error');
      return;
    }
    
    // Create new quote object
    const newQuote = {
      text: text.trim(),
      author: author.trim(),
      category: category.trim().toLowerCase()
    };
    
    // Add to quotes array
    this.quotes.push(newQuote);
    
    // Update filtered quotes if needed
    this.filterByCategory(this.elements.categorySelect.value);
    
    // Update category select options
    this.populateCategorySelect();
    this.populateCategories(); // Update both dropdowns
    
    // Save to storage
    this.saveToStorage();
    
    // Update stats
    this.updateStats();
    
    // Show success notification
    this.showNotification('Quote added successfully!', 'success');
    
    // Hide form
    this.toggleAddQuoteForm();
    
    // Show the new quote
    this.displayQuote(newQuote);
  }
  
  // Method for Step 3 direct quote addition
  addQuoteDirectly(text, category) {
    // Create new quote object with "Anonymous" as default author
    const newQuote = {
      text: text,
      author: "Anonymous",
      category: category.toLowerCase()
    };
    
    // Add to quotes array - direct DOM manipulation
    this.quotes.push(newQuote);
    
    // Update the DOM dynamically
    this.updateDOMAfterQuoteAddition();
    
    // Show the newly added quote
    this.displayQuote(newQuote);
  }
  
  // Helper method to update DOM after quote addition
  updateDOMAfterQuoteAddition() {
    // Update filtered quotes based on current filter
    this.filterByCategory(this.elements.categorySelect.value);
    
    // Dynamically update category select options
    this.populateCategorySelect();
    this.populateCategories(); // Update both dropdowns
    
    // Save to storage
    this.saveToStorage();
    
    // Update statistics display
    this.updateStats();
    
    // Trigger a visual feedback animation
    this.elements.quoteDisplay.style.transform = 'scale(1.05)';
    setTimeout(() => {
      this.elements.quoteDisplay.style.transform = 'scale(1)';
    }, 200);
  }
  
  filterByCategory(category) {
    if (category === 'all') {
      this.filteredQuotes = [...this.quotes];
    } else {
      this.filteredQuotes = this.quotes.filter(quote => quote.category === category);
    }
    
    // Sync both filter dropdowns
    if (this.elements.categoryFilter) {
      this.elements.categoryFilter.value = category;
    }
    if (this.elements.categorySelect) {
      this.elements.categorySelect.value = category;
    }
    
    // Save current filter to storage
    this.lastSelectedFilter = category;
    this.saveToStorage();
    
    // Show a random quote from filtered results
    this.showRandomQuote();
    this.updateStats();
  }
  
  populateCategorySelect() {
    const currentValue = this.elements.categorySelect.value;
    
    // Clear existing options except "All Categories"
    this.elements.categorySelect.innerHTML = '<option value="all">All Categories</option>';
    
    // Get unique categories and add them
    const categories = this.getUniqueCategories();
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      this.elements.categorySelect.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if (currentValue && (currentValue === 'all' || categories.includes(currentValue))) {
      this.elements.categorySelect.value = currentValue;
    }
  }
  
  getUniqueCategories() {
    return [...new Set(this.quotes.map(quote => quote.category))].sort();
  }
  
  updateStats() {
    const totalQuotes = this.quotes.length;
    const totalCategories = this.getUniqueCategories().length;
    const filteredCount = this.filteredQuotes.length;
    
    this.elements.quoteStats.innerHTML = '';
    
    const statsContainer = document.createElement('div');
    
    const totalStat = this.createStatItem('Total Quotes', totalQuotes);
    const categoriesStat = this.createStatItem('Categories', totalCategories);
    const filteredStat = this.createStatItem('Showing', filteredCount);
    
    statsContainer.appendChild(totalStat);
    statsContainer.appendChild(categoriesStat);
    statsContainer.appendChild(filteredStat);
    
    this.elements.quoteStats.appendChild(statsContainer);
  }
  
  createStatItem(label, value) {
    const statDiv = document.createElement('div');
    statDiv.className = 'stat-item';
    
    const valueSpan = document.createElement('span');
    valueSpan.className = 'stat-number';
    valueSpan.textContent = value;
    
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    
    statDiv.appendChild(valueSpan);
    statDiv.appendChild(labelSpan);
    
    return statDiv;
  }
  
  copyQuoteToClipboard(quote) {
    const quoteText = `"${quote.text}" — ${quote.author}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(quoteText).then(() => {
        this.showNotification('Quote copied to clipboard!', 'success');
      }).catch(() => {
        this.fallbackCopyToClipboard(quoteText);
      });
    } else {
      this.fallbackCopyToClipboard(quoteText);
    }
  }
  
  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showNotification('Quote copied to clipboard!', 'success');
    } catch (err) {
      this.showNotification('Failed to copy quote.', 'error');
    }
    
    document.body.removeChild(textArea);
  }
  
  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '10000',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
      maxWidth: '300px'
    });
    
    // Set background color based on type
    switch (type) {
      case 'success':
        notification.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
        break;
      case 'error':
        notification.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
        break;
      default:
        notification.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.quoteGeneratorInstance = new QuoteGenerator();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuoteGenerator;
}