// Quotes array
const quotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Do not watch the clock. Do what it does. Keep going.", category: "Motivation" },
  { text: "Knowledge is power.", category: "Education" }
];

// DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuote");
const categorySelect = document.getElementById("categorySelect");
const addQuoteButton = document.getElementById("addQuoteBtn");

// Populate categories dynamically
function populateCategories() {
  categorySelect.innerHTML = "";

  const categories = [];

  quotes.forEach(quote => {
    if (!categories.includes(quote.category)) {
      categories.push(quote.category);
    }
  });

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// ✅ REQUIRED FUNCTION NAME
function displayRandomQuote() {
  const selectedCategory = categorySelect.value;

  const filteredQuotes = quotes.filter(
    quote => quote.category === selectedCategory
  );

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  quoteDisplay.innerHTML = "";
  const paragraph = document.createElement("p");
  paragraph.textContent = `"${randomQuote.text}"`;
  quoteDisplay.appendChild(paragraph);
}

// ✅ REQUIRED FUNCTION NAME
function addQuote() {
  const quoteText = document.getElementById("newQuoteText").value.trim();
  const quoteCategory = document.getElementById("newQuoteCategory").value.trim();

  if (quoteText === "" || quoteCategory === "") {
    alert("Please enter both quote text and category.");
    return;
  }

  quotes.push({
    text: quoteText,
    category: quoteCategory
  });

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  populateCategories();
  quoteDisplay.textContent = "Quote added successfully!";
}

// ✅ REQUIRED EVENT LISTENERS
newQuoteButton.addEventListener("click", displayRandomQuote);
addQuoteButton.addEventListener("click", addQuote);

// Initial setup
populateCategories();
