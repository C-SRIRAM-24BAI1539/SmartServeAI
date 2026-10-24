const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL = "llama3.2:3b";

export async function generateAIResponse(messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
        options: {
          temperature: 0.2,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama returned HTTP ${response.status}.`);
    }

    const data = await response.json();
    return data.message?.content?.trim() ?? "";
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The AI request timed out. Please try again.");
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Cannot connect to Ollama. Ensure Ollama is running locally.",
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}