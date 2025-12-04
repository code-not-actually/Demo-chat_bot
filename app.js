const chatToggle = document.getElementById("chat-toggle");
const chatWidget = document.getElementById("chat-widget");
const chatWindow = document.getElementById("chat-window");
const chatClose = document.getElementById("chat-close");
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const suggestionsDiv = document.getElementById("suggestions");
const suggestionsCloseBtn = document.getElementById("suggestions-close");

let lastSuggestions = [];

chatToggle.addEventListener("click", () => {
  chatWidget.classList.toggle("closed");
  if (!chatWidget.classList.contains("closed")) {
    chatWindow.hidden = false;
    userInput.focus();
  }
});

chatClose.addEventListener("click", () => {
  chatWidget.classList.add("closed");
  chatWindow.hidden = true;
  hideSuggestions();
});

suggestionsCloseBtn.addEventListener("click", () => {
  hideSuggestions();
});

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function highlightText(text, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  let result = escapeHtml(text);
  words.forEach((word) => {
    if (!word) return;
    const re = new RegExp(`(${word.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
    result = result.replace(re, '<span class="highlight">$1</span>');
  });
  return result;
}

function appendMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `msg ${sender === "user" ? "user-msg" : "bot-msg"}`;
  div.innerHTML = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showSuggestions(suggestions, query) {
  // Remove old bot prompt messages about related questions
  const previousPrompts = [...chatBox.querySelectorAll(".bot-msg")].filter((div) =>
    div.textContent.includes("related questions")
  );
  previousPrompts.forEach((div) => div.remove());

  suggestionsDiv.innerHTML = "";
  if (!suggestions || suggestions.length === 0) {
    hideSuggestions();
    return;
  }
  lastSuggestions = suggestions.slice(0, 10);

  appendMessage("Here are some related questions you can click on:", "bot");
  lastSuggestions.forEach((text, i) => {
    const div = document.createElement("div");
    div.className = "suggestion";
    div.innerHTML = `${i + 1}. ${highlightText(text, query)}`;
    div.onclick = () => {
      userInput.value = text;
      hideSuggestions();
      sendUserMessage(text);
    };
    suggestionsDiv.appendChild(div);
  });
  suggestionsDiv.style.display = "block";
  suggestionsCloseBtn.style.display = "block";
}

function hideSuggestions() {
  suggestionsDiv.innerHTML = "";
  suggestionsDiv.style.display = "none";
  suggestionsCloseBtn.style.display = "none";
  lastSuggestions = [];
}

function sendUserMessage(inputOverride = null) {
  const input = inputOverride ?? userInput.value.trim();
  if (!input) return;

  appendMessage(escapeHtml(input), "user");
  userInput.value = "";
  hideSuggestions();

  // Check if user entered a number to select from suggestions
  if (/^\d+$/.test(input) && lastSuggestions.length > 0) {
    const idx = parseInt(input) - 1;
    if (idx >= 0 && idx < lastSuggestions.length) {
      const answer = QA_DATA[lastSuggestions[idx]] || "Sorry, I don't have an answer for that. You can email us at: SupportOPA@onepercentforamerica.org with any questions or feedback. You can also call customer service at 617-404-9797. We are available Monday - Friday from 9:00am - 5:00pm (EST).";
      appendMessage(answer, "bot");
      return;
    }
  }

  // Get answer and matches using chatbot logic
  const result = enhancedFindAnswer(input, QA_DATA);
  
  if (result.matches && result.matches.length > 0 && !result.answer) {
    showSuggestions(result.matches, input);
  } else {
    const answer = result.answer || "Sorry, I don't have an answer for that. You can email us at: SupportOPA@onepercentforamerica.org with any questions or feedback. You can also call customer service at 617-404-9797. We are available Monday - Friday from 9:00am - 5:00pm (EST).";
    appendMessage(answer, "bot");
  }
}

sendBtn.addEventListener("click", () => sendUserMessage());
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendUserMessage();
});