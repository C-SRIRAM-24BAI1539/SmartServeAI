
import { knowledgeBase } from "./knowledge-base.js";

const OLLAMA_URL = "http://127.0.0.1:11434/api/embed";
const EMBEDDING_MODEL = "nomic-embed-text";

let embeddingCachePromise;

async function createEmbeddings(input) {
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(
      `Embedding request failed (${response.status}). Ensure nomic-embed-text is installed.`,
    );
  }

  const data = await response.json();

  if (
    !Array.isArray(data.embeddings) ||
    data.embeddings.length !== input.length
  ) {
    throw new Error("Ollama returned an invalid embedding response.");
  }

  return data.embeddings;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getKnowledgeEmbeddings() {
  if (!embeddingCachePromise) {
    embeddingCachePromise = createEmbeddings(
      knowledgeBase.map((item) => item.text),
    ).catch((error) => {
      embeddingCachePromise = null;
      throw error;
    });
  }

  return embeddingCachePromise;
}

export async function retrieveRelevantKnowledge(query, limit = 3) {
  const [knowledgeEmbeddings, queryEmbeddings] = await Promise.all([
    getKnowledgeEmbeddings(),
    createEmbeddings([query]),
  ]);

  const queryVector = queryEmbeddings[0];

  return knowledgeBase
    .map((item, index) => ({
      ...item,
      score: cosineSimilarity(queryVector, knowledgeEmbeddings[index]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
