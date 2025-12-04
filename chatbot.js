// Chatbot logic converted from Python to JavaScript

const KEYWORD_MAP = {
  "one percent for america": ["Who is One Percent for America (OPA)?"],
  "one percent": ["Who is One Percent for America (OPA)?"],
  "opa": ["Who is One Percent for America (OPA)?"],
  "national nonprofit": ["Who is One Percent for America (OPA)?"],
  "citizenship platform": ["Who is One Percent for America (OPA)?"],
  "financed": ["How is One Percent for America financed?"],
  "funded": ["How is One Percent for America financed?"],
  "bluehub capital": ["How is One Percent for America financed?"],
  "corporate sponsor": ["How is One Percent for America financed?"],
  "partnership": ["How is One Percent for America financed?"],
  "privacy": ["Will OPA share my information with the government?"],
  "information sharing": ["Will OPA share my information with the government?"],
  "third parties": ["Will OPA share my information with the government?"],
  "data privacy": ["Will OPA share my information with the government?"],
  "contact": ["How do I contact One Percent for America?"],
  "customer service": ["How do I contact One Percent for America?"],
  "email": ["How do I contact One Percent for America?"],
  "phone": ["How do I contact One Percent for America?"],
  "address": ["How do I contact One Percent for America?"],
  "eligible": ["Who is eligible to borrow from OPA?"],
  "loan qualification": ["Who is eligible to borrow from OPA?"],
  "green card holder": ["Who is eligible to borrow from OPA?"],
  "daca": ["Who is eligible to borrow from OPA?"],
  "tps": ["Who is eligible to borrow from OPA?"],
  "borrow": ["How does borrowing from OPA work?"],
  "loan application": ["How does borrowing from OPA work?"],
  "paper application": ["How does borrowing from OPA work?"],
  "loan benefits": ["What are the benefits of an OPA loan?"],
  "interest rate": ["What are the benefits of an OPA loan?"],
  "1 percent": ["What are the benefits of an OPA loan?"],
  "1%": ["What are the benefits of an OPA loan?"],
  "repay": ["How does a borrower repay an OPA loan?"],
  "payment": ["How does a borrower repay an OPA loan?"],
  "monthly payment": ["How does a borrower repay an OPA loan?"],
  "loan check": [
    "My loan has been approved—when will I get my check?",
    "Can I use my OPA loan check for USCIS applications submitted online?"
  ],
  "uscis applications": [
    "Can I use my OPA loan check for USCIS applications submitted online?"
  ],
  "one-time payment": ["How do I make a one-time loan payment?"],
  "pay loan": ["How do I make a one-time loan payment?"],
  "loan documents": ["How do I get my loan documents?"],
  "loan balance": ["How do I check my loan balance?"],
  "lend": ["How does lending to OPA work?"],
  "donate": [
    "How does donating to OPA work?",
    "I made a donation but did not receive a receipt. What should I do?"
  ],
  "donation receipt": ["I made a donation but did not receive a receipt. What should I do?"],
  "mailing address": ["What is the mailing address for donations?"],
  "refer borrowers": ["How can I or my organization refer borrowers to OPA?"],
  "partner": ["How can my organization partner or collaborate with OPA?"],
  "sponsor": ["How do I become a Partner, Sponsor, or Provider?"],
  "doante": ["How does donating to OPA work?"],
  "borow": ["How does borrowing from OPA work?"],
  "loaner": ["Who is eligible to borrow from OPA?"],
  "1 percent interest": ["What are the benefits of an OPA loan?"],
  "loan repayment": ["How does a borrower repay an OPA loan?"]
};

const GREETINGS = new Set([
  "hi", "hello", "hey", "hiya", "good morning", "good afternoon", "good evening"
]);

// Normalize text for comparison
function normalize(text) {
  text = text.toLowerCase();
  text = text.replace(/%/g, " percent ");
  text = text.replace(/[^a-z0-9\s]/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

// Check if input is a greeting
function isGreeting(text) {
  return GREETINGS.has(normalize(text));
}

// Simple fuzzy matching - calculates similarity ratio between two strings
function similarityRatio(str1, str2) {
  const s1 = str1.toLowerCase().split(/\s+/);
  const s2 = str2.toLowerCase().split(/\s+/);
  const set1 = new Set(s1);
  const set2 = new Set(s2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : (intersection.size / union.size) * 100;
}

// Check if keyword matches query with fuzzy threshold
function keywordMatched(query, keyword) {
  return similarityRatio(query, keyword) >= 75;
}

// Get matching questions based on user query
function getMatches(userQ, qaData) {
  const normalizedUserQ = normalize(userQ);
  const questions = Object.keys(qaData);
  const matches = new Set();
  
  // Check questions and answers for matches
  questions.forEach(question => {
    const normalizedQ = normalize(question);
    const normalizedA = normalize(qaData[question]);
    
    const questionScore = similarityRatio(normalizedUserQ, normalizedQ);
    const answerScore = similarityRatio(normalizedUserQ, normalizedA);
    
    if (questionScore >= 60 || answerScore >= 60) {
      matches.add(question);
    }
    
    // Check keyword matches
    if (normalizedUserQ.includes(normalizedQ) || normalizedA.includes(normalizedUserQ)) {
      matches.add(question);
    }
    
    // Check keyword map
    for (const [keyword, mappedQuestions] of Object.entries(KEYWORD_MAP)) {
      if (keywordMatched(normalizedUserQ, keyword) && mappedQuestions.includes(question)) {
        matches.add(question);
      }
    }
  });
  
  return Array.from(matches).slice(0, 10);
}

// Main function to find answer and related questions
function enhancedFindAnswer(userInput, qaData) {
  if (isGreeting(userInput)) {
    return {
      answer: "Hello! How can I assist you today?",
      matches: []
    };
  }
  
  const normalizedUserQ = normalize(userInput);
  let directAnswer = null;
  
  // Look for high-confidence direct matches
  for (const [question, answer] of Object.entries(qaData)) {
    const qScore = similarityRatio(normalizedUserQ, normalize(question));
    const aScore = similarityRatio(normalizedUserQ, normalize(answer));
    
    if (qScore >= 90 || aScore >= 90) {
      directAnswer = answer;
      break;
    }
  }
  
  // Check keyword map for direct matches
  if (!directAnswer) {
    for (const [keyword, questions] of Object.entries(KEYWORD_MAP)) {
      if (keywordMatched(normalizedUserQ, keyword)) {
        for (const q of questions) {
          if (qaData[q]) {
            directAnswer = qaData[q];
            break;
          }
        }
        if (directAnswer) break;
      }
    }
  }
  
  // Get related questions
  const matches = getMatches(userInput, qaData);
  const filteredMatches = matches.filter(m => qaData[m] !== directAnswer);
  
  return {
    answer: directAnswer,
    matches: filteredMatches
  };
}