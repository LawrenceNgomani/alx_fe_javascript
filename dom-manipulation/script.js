// Quote Generator Application
class QuoteGenerator {
    constructor() {
        this.quotes = [
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

        this.currentQuote = null;
        this.selectedCategory = "";
        this.initializeDOM();
        this.setupEventListeners();
        this.updateCategoryFilter();
        this.renderQuotesList();
    }

    // Initialize all DOM references
    initializeDOM() {
        this.elements = {
            quoteText: document.getElementById("quoteText"),
            quoteCategory: document.getElementById("quoteCategory"),
            showQuoteBtn: document.getElementById("showQuoteBtn"),
            categoryFilter: document.getElementById("categoryFilter"),
            toggleFormBtn: document.getElementById("toggleFormBtn"),
            formContainer: document.getElementById("addQuoteFormContainer"),
            quotesList: document.getElementById("quotesList")
        };
    }

    // Setup all event listeners
    setupEventListeners() {
        this.elements.showQuoteBtn.addEventListener("click", () => this.showRandomQuote());
        this.elements.toggleFormBtn.addEventListener("click", () => this.toggleAddQuoteForm());
        this.elements.categoryFilter.addEventListener("change", (e) => this.filterByCategory(e));
    }

    // Display a random quote based on selected category
    showRandomQuote() {
        const filteredQuotes = this.selectedCategory 
            ? this.quotes.filter(q => q.category === this.selectedCategory)
            : this.quotes;

        if (filteredQuotes.length === 0) {
            this.elements.quoteText.textContent = "No quotes found for this category.";
            this.elements.quoteCategory.textContent = "";
            return;
        }

        this.currentQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
        this.displayQuote(this.currentQuote);
    }

    // Display a specific quote in the quote display area
    displayQuote(quote) {
        this.elements.quoteText.textContent = `"${quote.text}"`;
        this.elements.quoteCategory.textContent = `Category: ${quote.category}`;
        
        // Add animation effect
        this.elements.quoteText.parentElement.style.animation = "none";
        setTimeout(() => {
            this.elements.quoteText.parentElement.style.animation = "slideDown 0.3s ease";
        }, 10);
    }

    // Get all unique categories from quotes
    getCategories() {
        return [...new Set(this.quotes.map(q => q.category))].sort();
    }

    // Update category filter dropdown
    updateCategoryFilter() {
        const categories = this.getCategories();
        const currentValue = this.elements.categoryFilter.value;

        // Clear existing options except the first one
        while (this.elements.categoryFilter.options.length > 1) {
            this.elements.categoryFilter.remove(1);
        }

        // Add category options
        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            this.elements.categoryFilter.appendChild(option);
        });

        // Restore previous selection
        this.elements.categoryFilter.value = currentValue;
    }

    // Filter quotes by category
    filterByCategory(event) {
        this.selectedCategory = event.target.value;
        this.showRandomQuote();
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

        // Event listeners
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
            alert("Please fill in both quote text and category.");
            return;
        }

        const newQuote = {
            text: text.trim(),
            category: category.trim()
        };

        this.quotes.push(newQuote);
        this.updateCategoryFilter();
        this.renderQuotesList();
        this.toggleAddQuoteForm();

        // Show confirmation
        this.showConfirmation(`Quote added successfully to "${newQuote.category}" category!`);
    }

    // Render all quotes in the quotes list section
    renderQuotesList() {
        this.elements.quotesList.innerHTML = "";

        if (this.quotes.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";
            emptyState.textContent = "No quotes available. Add your first quote!";
            this.elements.quotesList.appendChild(emptyState);
            return;
        }

        this.quotes.forEach((quote, index) => {
            const card = this.createQuoteCard(quote, index);
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
            this.updateCategoryFilter();
            this.renderQuotesList();
            this.showConfirmation("Quote deleted successfully!");
        }
    }

    // Show a temporary confirmation message
    showConfirmation(message) {
        const notification = document.createElement("div");
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: slideDown 0.3s ease;
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