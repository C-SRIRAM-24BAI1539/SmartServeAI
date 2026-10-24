
import { generateAIResponse } from "./ollama.service.js";
import { retrieveRelevantKnowledge } from "./rag.service.js";

const SYSTEM_PROMPT = `
You are SmartServe AI, an assistant for household maintenance services.

Use the retrieved knowledge as supporting information.
- Explain likely causes in simple language.
- Ask one useful follow-up question when appropriate.
- Never claim a diagnosis is confirmed.
- Never invent providers, prices, availability, or bookings.
- Do not recommend dangerous DIY electrical or refrigerant repairs.
- If the retrieved knowledge is insufficient, say so.
- Be concise, practical, and polite.
`;

export async function chatWithAI(req, res, next) {
  try {
    const message =
      typeof req.body.message === "string"
        ? req.body.message.trim()
        : "";

    if (message.length < 5 || message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Your message must contain 5 to 2000 characters.",
      });
    }

    // 1. Retrieve relevant knowledge using RAG.
    const passages = await retrieveRelevantKnowledge(message);

    // 2. Prepare the retrieved knowledge for the LLM.
    const context = passages
      .map(
        (item, index) =>
          `[${index + 1}] Category: ${item.category}\n${item.text}`,
      )
      .join("\n\n");

    // 3. Generate an answer grounded in that knowledge.
    const answer = await generateAIResponse([
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\nRetrieved knowledge:\n${context}`,
      },
      { role: "user", content: message },
    ]);

    if (!answer) {
      return res.status(502).json({
        success: false,
        message: "The AI returned an empty response. Please try again.",
      });
    }

    // 4. Return the answer and retrieval details.
    return res.json({
      success: true,
      answer,
      model: "llama3.2:3b",
      retrieval: passages.map((item) => ({
        id: item.id,
        category: item.category,
        score: Number(item.score.toFixed(3)),
      })),
    });
  } catch (error) {
    if (
      error.name === "AbortError" ||
      error.name === "TimeoutError" ||
      error.message.startsWith("Cannot connect to Ollama") ||
      error.message.startsWith("The AI request timed out")
    ) {
      return res.status(503).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes("Embedding request failed") ||
      error.message.includes("embedding response")
    ) {
      return res.status(503).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
}
