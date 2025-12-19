// Quote Generator Application with Advanced Filtering
class QuoteGenerator {
    constructor() {
        this.STORAGE_KEY = "quoteGeneratorQuotes";
        this.FILTER_KEY = "lastSelectedFilter";
        this.SESSION_KEY = "lastViewedQuote";
        this.DEFAULT_QUOTES = [
            { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
            { text: "Innovation distinguishes between a leader and a follower.", category: "Leadership" },
            { text: "Life is what happens when you're busy making other plans.", category: "Life" },
            { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" },
            { text: "It is during our darkest moments that we must focus to see the light.", category: "Motivation" },
            { text: "The only impossible journey is the one you never begin.", category: "Motivation" },
            { text: "Success is not final, failure is not fatal.", category: "Success" },
            { text: "Believe you can and you're halfway there.", category: "Inspiration" },
            { text: "The best time to plant a tree was 20 years ago. The second best time is now.", category: "Wisdom" }
        ];

        this.quotes = [];
        this.filteredQuotes = [];
        this.currentQuote = null;
        this.selectedCategory = "";
        
        this.initializeDOM();
        this.loadFromStorage();
        this.setupEventListeners();
        this.populateCategories();
        this.restoreLastFilter();
        this.renderQuotesList();
        this.restoreLastViewedQuote();
    }

    // Initialize all DOM references
    initializeDOM() {
        this.elements = {
            quoteDisplay: document.getElementById("quoteDisplay"),
            quoteText: document.getElementById("quoteText"),
            quoteCategory: document.getElementById("quoteCategory"),
            showQuoteBtn: document.getElementById("showQuoteBtn"),
            categoryFilter: document.getElementById("categoryFilter"),
            categoryButtons: document.getElementById("categoryButtons"),
            resetFilterBtn: document.getElementById("resetFilterBtn"),
            filterStats: document.getElementById("filterStats"),
            toggleFormBtn: document.getElementById("toggleFormBtn"),
            formContainer: document.getElementById("addQuoteFormContainer"),
            quotesList: document.getElementById("quotesList"),
            quoteCount: document.getElementById("quoteCount"),
            exportBtn: document.getElementById("exportBtn"),
            importFile: document.getElementById("importFile"),
            clearStorageBtn: document.getElementById("clearStorageBtn"),
            viewStorageBtn: document.getElementById("viewStorageBtn"),
            storageInfo: document.getElementById("storageInfo")
        };
    }

    // Load quotes from localStorage
    loadFromStorage() {
        const storedQuotes = localStorage.getItem(this.STORAGE_KEY);
        
        if (storedQuotes) {
            try {
                this.quotes = JSON.parse(storedQuotes);
            } catch (error) {
                console.error("Error parsing stored quotes:", error);
                this.quotes = [...this.DEFAULT_QUOTES];
                this.saveToStorage();
            }
        } else {
            this.quotes = [...this.DEFAULT_QUOTES];
            this.saveToStorage();
        }
    }

    // Save quotes to localStorage
    saveToStorage() {
        try {
            const quotesJSON = JSON.stringify(this.quotes);
            localStorage.setItem(this.STORAGE_KEY, quotesJSON);
        } catch (error) {
            console.error("Error saving to storage:", error);
            this.showNotification("Error saving quotes to storage!", "error");
        }
    }

    // Save filter preference to localStorage
    saveFilterPreference() {
        try {
            localStorage.setItem(this.FILTER_KEY, this.selectedCategory);
        } catch (error) {
            console.error("Error saving filter preference:", error);
        }
    }

    // Restore last selected filter from localStorage
    restoreLastFilter() {
        try {
            const lastFilter = localStorage.getItem(this.FILTER_KEY);
            if (lastFilter !== null) {
                this.selectedCategory = lastFilter;
                this.elements.categoryFilter.value = lastFilter;
            }
        } catch (error) {
            console.error("Error restoring filter:", error);
        }
    }

    // Save current quote to sessionStorage
    saveToSessionStorage() {
        if (this.currentQuote) {
            try {
                sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentQuote));
            } catch (error) {
                console.error("Error saving to session storage:", error);
            }
        }
    }

    // Restore last viewed quote from sessionStorage
    restoreLastViewedQuote() {
        try {
            const lastQuote = sessionStorage.getItem(this.SESSION_KEY);
            if (lastQuote) {
                this.currentQuote = JSON.parse(lastQuote);
                this.displayQuote(this.currentQuote);
            }
        } catch (error) {
            console.error("Error restoring last quote:", error);
        }
    }

    // Setup all event listeners
    setupEventListeners() {
        this.elements.showQuoteBtn.addEventListener("click", () => this.showRandomQuote());
        this.elements.toggleFormBtn.addEventListener("click", () => this.toggleAddQuoteForm());
        this.elements.categoryFilter.addEventListener("change", (e) => this.filterQuotes(e));
        this.elements.resetFilterBtn.addEventListener("click", () => this.resetFilter());
        this.elements.exportBtn.addEventListener("click", () => this.exportToJSON());
        this.elements.importFile.addEventListener("change", (e) => this.importFromJSON(e));
        this.elements.clearStorageBtn.addEventListener("click", () => this.clearStorage());
        this.elements.viewStorageBtn.addEventListener("click", () => this.viewStorageInfo());
    }

    // Get all unique categories from quotes
    getCategories() {
        return [...new Set(this.quotes.map(q => q.category))].sort();
    }

    // Populate categories dropdown and buttons dynamically
    populateCategories() {
        const categories = this.getCategories();
        const currentValue = this.elements.categoryFilter.value;

        // Update dropdown
        while (this.elements.categoryFilter.options.length > 1) {
            this.elements.categoryFilter.remove(1);
        }

        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            this.elements.categoryFilter.appendChild(option);
        });

        this.elements.categoryFilter.value = currentValue;

        // Update category buttons
        this.updateCategoryButtons(categories);
    }

    // Update category filter buttons
    updateCategoryButtons(categories) {
        this.elements.categoryButtons.innerHTML = "";

        const allBtn = document.createElement("button");
        allBtn.type = "button";
        allBtn.className = `category-btn ${this.selectedCategory === "" ? "active" : ""}`;
        allBtn.textContent = "All Categories";
        allBtn.addEventListener("click", () => this.resetFilter());
        this.elements.categoryButtons.appendChild(allBtn);

        categories.forEach(category => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `category-btn ${this.selectedCategory === category ? "active" : ""}`;
            btn.textContent = category;
            btn.addEventListener("click", () => this.selectCategoryButton(category));
            this.elements.categoryButtons.appendChild(btn);
        });
    }

    // Handle category button click
    selectCategoryButton(category) {
        this.selectedCategory = category;
        this.elements.categoryFilter.value = category;
        this.filterQuotes();
    }

    // Filter quotes based on selected category
    filterQuotes(event) {
        if (event) {
            this.selectedCategory = event.target.value;
        }

        // Save filter preference
        this.saveFilterPreference();

        // Filter quotes
        this.filteredQuotes = this.selectedCategory === ""
            ? [...this.quotes]
            : this.quotes.filter(q => q.category === this.selectedCategory);

        // Update UI
        this.updateCategoryButtons(this.getCategories());
        this.updateFilterStats();
        this.renderQuotesList();
    }

    // Reset filter to show all categories
    resetFilter() {
        this.selectedCategory = "";
        this.elements.categoryFilter.value = "";
        this.saveFilterPreference();
        this.updateCategoryButtons(this.getCategories());
        this.filteredQuotes = [...this.quotes];
        this.updateFilterStats();
        this.renderQuotesList();
        this.showNotification("Filter reset - showing all quotes");
    }

    // Update filter statistics display
    updateFilterStats() {
        const statsDiv = this.elements.filterStats;
        
        if (this.selectedCategory === "") {
            statsDiv.classList.remove("show");
            return;
        }

        statsDiv.classList.add("show");
        statsDiv.innerHTML = `
            <div class="filter-stats-item">
                <span class="filter-stats-label">Category Selected</span>
                <span class="filter-stats-value">${this.selectedCategory}</span>
            </div>
            <div class="filter-stats-item">
                <span class="filter-stats-label">Matching Quotes</span>
                <span class="filter-stats-value">${this.filteredQuotes.length}</span>
            </div>
            <div class="filter-stats-item">
                <span class="filter-stats-label">Total Quotes</span>
                <span class="filter-stats-value">${this.quotes.length}</span>
            </div>
        `;
    }

    // Display a random quote from filtered list
    showRandomQuote() {
        if (this.filteredQuotes.length === 0) {
            this.elements.quoteText.textContent = "No quotes found for this category.";
            this.elements.quoteCategory.textContent = "";
            return;
        }

        this.currentQuote = this.filteredQuotes[Math.floor(Math.random() * this.filteredQuotes.length)];
        this.displayQuote(this.currentQuote);
        this.saveToSessionStorage();
    }

    // Display a specific quote in the quote display area
    displayQuote(quote) {
        this.elements.quoteText.textContent = `"${quote.text}"`;
        this.elements.quoteCategory.textContent = `Category: ${quote.category}`;
        
        this.elements.quoteDisplay.style.animation = "none";
        setTimeout(() => {
            this.elements.quoteDisplay.style.animation = "slideDown 0.3s ease";
        }, 10);
    }

    // Toggle the add quote form visibility
    toggleAddQuoteForm() {
        this.elements.formContainer.classList.toggle("active");
        
        if (this.elements.formContainer.classList.contains("active")) {
            this.createAddQuoteForm();
        } else {
            this.elements.formContainer.innerHTML = "";
        }
    }

    // Create and render the add quote form
    createAddQuoteForm() {
        this.elements.formContainer.innerHTML = "";

        const form = document.createElement("form");
        form.className = "add-quote-form";

        // Quote text input
        const quoteGroup = document.createElement("div");
        quoteGroup.className = "form-group";
        const quoteLabel = document.createElement("label");
        quoteLabel.textContent = "Quote Text";
        const quoteInput = document.createElement("input");
        quoteInput.type = "text";
        quoteInput.id = "quoteInput";
        quoteInput.placeholder = "Enter your quote here...";
        quoteInput.required = true;
        quoteGroup.appendChild(quoteLabel);
        quoteGroup.appendChild(quoteInput);
        form.appendChild(quoteGroup);

        // Category input/select
        const categoryGroup = document.createElement("div");
        categoryGroup.className = "form-group";
        const categoryLabel = document.createElement("label");
        categoryLabel.textContent = "Category";
        const categoryInputContainer = document.createElement("div");
        categoryInputContainer.style.display = "flex";
        categoryInputContainer.style.gap = "10px";

        const categorySelect = document.createElement("select");
        categorySelect.id = "categorySelect";
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select existing...";
        categorySelect.appendChild(defaultOption);

        this.getCategories().forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });

        const orText = document.createElement("span");
        orText.textContent = "or";
        orText.style.alignSelf = "center";
        orText.style.color = "#999";

        const categoryInput = document.createElement("input");
        categoryInput.type = "text";
        categoryInput.id = "categoryInput";
        categoryInput.placeholder = "New category";

        categoryInputContainer.appendChild(categorySelect);
        categoryInputContainer.appendChild(orText);
        categoryInputContainer.appendChild(categoryInput);
        categoryGroup.appendChild(categoryLabel);
        categoryGroup.appendChild(categoryInputContainer);
        form.appendChild(categoryGroup);

        // Form actions
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "form-actions";

        const submitBtn = document.createElement("button");
        submitBtn.type = "submit";
        submitBtn.className = "btn btn-primary";
        submitBtn.textContent = "Add Quote";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn btn-secondary";
        cancelBtn.textContent = "Cancel";

        actionsDiv.appendChild(submitBtn);
        actionsDiv.appendChild(cancelBtn);
        form.appendChild(actionsDiv);

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.addQuote(
                quoteInput.value,
                categorySelect.value || categoryInput.value
            );
        });

        cancelBtn.addEventListener("click", () => this.toggleAddQuoteForm());

        this.elements.formContainer.appendChild(form);
        quoteInput.focus();
    }

    // Add a new quote to the array and update UI
    addQuote(text, category) {
        if (!text.trim() || !category.trim()) {
            this.showNotification("Please fill in both quote text and category.", "error");
            return;
        }

        const newQuote = {
            text: text.trim(),
            category: category.trim()
        };

        this.quotes.push(newQuote);
        this.saveToStorage();
        this.populateCategories();
        this.filterQuotes();
        this.toggleAddQuoteForm();

        this.showNotification(`Quote added successfully to "${newQuote.category}" category!`);
    }

    // Render all quotes (filtered or all) in the quotes list section
    renderQuotesList() {
        this.elements.quotesList.innerHTML = "";
        this.elements.quoteCount.textContent = this.filteredQuotes.length;

        if (this.filteredQuotes.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";
            emptyState.textContent = this.selectedCategory 
                ? `No quotes found in "${this.selectedCategory}" category. Try a different category or add a new quote!`
                : "No quotes available. Add your first quote or import quotes!";
            this.elements.quotesList.appendChild(emptyState);
            return;
        }

        this.filteredQuotes.forEach((quote, index) => {
            const actualIndex = this.quotes.indexOf(quote);
            const card = this.createQuoteCard(quote, actualIndex);
            this.elements.quotesList.appendChild(card);
        });
    }

    // Create a quote card element
    createQuoteCard(quote, index) {
        const card = document.createElement("div");
        card.className = "quote-card";

        const textP = document.createElement("p");
        textP.className = "quote-card-text";
        textP.textContent = `"${quote.text}"`;

        const metaDiv = document.createElement("div");
        metaDiv.className = "quote-card-meta";

        const categoryBadge = document.createElement("span");
        categoryBadge.className = "quote-card-category";
        categoryBadge.textContent = quote.category;

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-danger btn-sm";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => this.deleteQuote(index));

        metaDiv.appendChild(categoryBadge);
        metaDiv.appendChild(deleteBtn);

        card.appendChild(textP);
        card.appendChild(metaDiv);

        return card;
    }

    // Delete a quote from the array
    deleteQuote(index) {
        if (confirm("Are you sure you want to delete this quote?")) {
            this.quotes.splice(index, 1);
            this.saveToStorage();
            this.populateCategories();
            this.filterQuotes();
            this.showNotification("Quote deleted successfully!");
        }
    }

    // Export quotes to JSON file
    exportToJSON() {
        if (this.quotes.length === 0) {
            this.showNotification("No quotes to export!", "error");
            return;
        }

        const dataStr = JSON.stringify(this.quotes, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `quotes-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showNotification(`Exported ${this.quotes.length} quotes successfully!`);
    }

    // Import quotes from JSON file
    importFromJSON(event) {
        const file = event.target.files[0];
        
        if (!file) {
            return;
        }

        const fileReader = new FileReader();
        
        fileReader.onload = (e) => {
            try {
                const importedQuotes = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedQuotes)) {
                    throw new Error("Imported data must be an array of quotes");
                }

                const validQuotes = importedQuotes.filter(quote => 
                    quote.text && quote.category && typeof quote.text === "string" && typeof quote.category === "string"
                );

                if (validQuotes.length === 0) {
                    throw new Error("No valid quotes found in the file");
                }

                this.quotes.push(...validQuotes);
                this.saveToStorage();
                this.populateCategories();
                this.filterQuotes();

                this.showNotification(`Imported ${validQuotes.length} quotes successfully!`);
            } catch (error) {
                console.error("Import error:", error);
                this.showNotification(`Import failed: ${error.message}`, "error");
            }
        };

        fileReader.onerror = () => {
            this.showNotification("Error reading file", "error");
        };

        fileReader.readAsText(file);
        
        // Reset file input
        event.target.value = "";
    }

    // Clear all storage
    clearStorage() {
        if (confirm("Are you sure you want to clear all stored data? This cannot be undone.")) {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.FILTER_KEY);
            sessionStorage.removeItem(this.SESSION_KEY);
            this.quotes = [];
            this.filteredQuotes = [];
            this.currentQuote = null;
            this.selectedCategory = "";
            this.elements.categoryFilter.value = "";
            this.elements.quoteText.textContent = "Click 'Show New Quote' to get started!";
            this.elements.quoteCategory.textContent = "";
            this.populateCategories();
            this.renderQuotesList();
            this.showNotification("All storage cleared!");
        }
    }

    // View storage information
    viewStorageInfo() {
        const localStorageData = localStorage.getItem(this.STORAGE_KEY);
        const sessionStorageData = sessionStorage.getItem(this.SESSION_KEY);
        
        const localStorageSize = new Blob([localStorageData || ""]).size;
        const sessionStorageSize = new Blob([sessionStorageData || ""]).size;
        const totalSize = localStorageSize + sessionStorageSize;

        const infoDiv = this.elements.storageInfo;
        infoDiv.innerHTML = "";
        infoDiv.style.display = "block";

        const title = document.createElement("h4");
        title.textContent = "Storage Information";
        infoDiv.appendChild(title);

        const grid = document.createElement("div");
        grid.className = "info-grid";

        const items = [
            { label: "Total Quotes", value: this.quotes.length },
            { label: "Unique Categories", value: this.getCategories().length },
            { label: "Current Filter", value: this.selectedCategory || "All Categories" },
            { label: "Filtered Quotes", value: this.filteredQuotes.length },
            { label: "Local Storage Size", value: `${(localStorageSize / 1024).toFixed(2)} KB` },
            { label: "Session Storage Size", value: `${(sessionStorageSize / 1024).toFixed(2)} KB` },
            { label: "Total Storage Used", value: `${(totalSize / 1024).toFixed(2)} KB` },
            { label: "Last Updated", value: new Date().toLocaleString() }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "info-item";

            const label = document.createElement("div");
            label.className = "info-label";
            label.textContent = item.label;

            const value = document.createElement("div");
            value.className = "info-value";
            value.textContent = item.value;

            itemDiv.appendChild(label);
            itemDiv.appendChild(value);
            grid.appendChild(itemDiv);
        });

        infoDiv.appendChild(grid);
    }

    // Show notification message
    showNotification(message, type = "success") {
        const notification = document.createElement("div");
        const bgColor = type === "error" ? "#e74c3c" : "#27ae60";
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: slideDown 0.3s ease;
            max-width: 400px;
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = "slideUp 0.3s ease";
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    new QuoteGenerator();
});