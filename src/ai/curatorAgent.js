// AI Curator Agent — provider-agnostic interface.
//
// Day 3 work: implement callLLM() for whichever provider you get a key for
// (Gemini/OpenAI/Anthropic all use a simple fetch to a REST endpoint), then
// build the higher-level functions below on top of it. Nothing else in the
// app should need to change when you swap providers - only this file.

const PROVIDER = import.meta.env.VITE_LLM_PROVIDER ?? 'gemini';
const API_KEY = import.meta.env.VITE_LLM_API_KEY;

async function callLLM(prompt) {
  if (!API_KEY) {
    console.warn('No API key set - curator running in offline stub mode');
    return null;
  }

  if (PROVIDER === 'gemini') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  }

  // Add 'openai' / 'anthropic' branches here later if you switch providers.
  throw new Error(`Unknown LLM provider: ${PROVIDER}`);
}

// Summarize the workspace when the user returns for a new session.
export async function summarizeSessionStart(objects) {
  if (objects.length === 0) return 'The space is empty. Start by placing your first object.';
  const summary = objects.map((o) => `${o.type}: ${o.label}`).join('; ');
  const prompt = `You are a spatial workspace curator AI. In 1-2 short sentences, welcome the user back and mention what's in their space so far: ${summary}`;
  const result = await callLLM(prompt);
  return result ?? `Welcome back. Your space has ${objects.length} objects.`;
}

// Suggest which existing objects should be linked together based on
// semantic similarity of their labels.
export async function suggestClusters(objects) {
  if (objects.length < 2) return [];
  const list = objects.map((o) => `${o.id}: ${o.label}`).join('\n');
  const prompt = `Given these knowledge objects in a spatial workspace:\n${list}\n\nReturn ONLY a JSON array of pairs of ids that are semantically related and should be linked, like [["id1","id2"]]. No other text.`;
  const result = await callLLM(prompt);
  if (!result) return [];
  try {
    return JSON.parse(result.replace(/```json|```/g, '').trim());
  } catch {
    return [];
  }
}
