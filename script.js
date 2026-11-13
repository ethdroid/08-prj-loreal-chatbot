/* Paste your Cloudflare Worker URL here after you deploy it */
const WORKER_URL = "https://loreal-chatbot.ethdroid.workers.dev/";

/* Get the page elements we need */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const latestQuestion = document.getElementById("latestQuestion");
const sendBtn = document.getElementById("sendBtn");

/* The system prompt tells the AI how to behave */
const systemPrompt = `You are the L'Oréal Smart Routine & Product Advisor, a friendly beauty expert.

Only help with:
- L'Oréal products and brands (L'Oréal Paris, Lancôme, Maybelline, Garnier, CeraVe, La Roche-Posay, Kiehl's, Kérastase, Redken, NYX, Yves Saint Laurent Beauté, and others in the L'Oréal family)
- Skincare, makeup, haircare, and fragrance routines and recommendations
- General beauty questions that relate to those topics

If the user asks about anything else (like math, coding, sports, news, or other companies' products), politely say you can only help with L'Oréal products and beauty routines, then offer a beauty-related question they could ask instead.

Remember details the user shares, like their name, skin type, or hair type, and use them in later answers.

Keep answers warm, clear, and under 150 words. Use a few emojis. Do not use markdown symbols like ** or #.`;

/* Conversation history. The system prompt always goes first (LevelUp) */
const messages = [{ role: "system", content: systemPrompt }];

/* Adds a chat bubble to the window and returns it */
function addMessage(text, sender) {
  const bubble = document.createElement("div");
  bubble.classList.add("msg", sender);
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

/* Greeting shown when the page loads */
addMessage(
  "👋 Bonjour! I'm your L'Oréal beauty advisor. Ask me about skincare, makeup, haircare, or fragrance, and I'll help you build the perfect routine.",
  "ai"
);

/* Runs when the user sends a message */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const question = userInput.value.trim();
  if (!question) return;

  // Show the latest question above the chat (resets each time)
  latestQuestion.textContent = `You asked: "${question}"`;
  latestQuestion.classList.add("show");

  // Show the user's bubble, save it to history, and clear the input
  addMessage(question, "user");
  messages.push({ role: "user", content: question });
  userInput.value = "";
  sendBtn.disabled = true;

  // Placeholder bubble while we wait for the AI
  const loadingBubble = addMessage("Thinking… 💭", "ai");
  loadingBubble.classList.add("loading");

  try {
    // Send the whole conversation to the Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    });

    const data = await response.json();

    // If OpenAI sent back an error, show it in the console
    if (data.error) {
      throw new Error(data.error.message);
    }

    const reply = data.choices[0].message.content;

    // Replace the placeholder with the real reply and save it to history
    loadingBubble.textContent = reply;
    loadingBubble.classList.remove("loading");
    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    console.error(error);
    loadingBubble.textContent =
      "Sorry, something went wrong. Please try again in a moment.";
    loadingBubble.classList.remove("loading");
  }

  sendBtn.disabled = false;
  userInput.focus();
  chatWindow.scrollTop = chatWindow.scrollHeight;
});
