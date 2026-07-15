// AI Curator Agent — provider-agnostic interface.
//
// callLLM() is the only function that knows about a specific provider.
// Everything else builds prompts and parses responses on top of it, so
// swapping providers later is a one-line change in callLLM().

const PROVIDER = import.meta.env.VITE_LLM_PROVIDER ?? 'gemini';
const API_KEY = import.meta.env.VITE_LLM_API_KEY;

export function curatorHasKey() {
  return Boolean(API_KEY);
}

async function callLLM(prompt) {
  if (!API_KEY) {
    console.warn('No API key set - curator running in offline stub mode');
    return null;
  }

  if (PROVIDER === 'gemini') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) {
      console.error('Gemini API error', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  }

  // Add 'openai' / 'anthropic' branches here later if you switch providers.
  throw new Error(`Unknown LLM provider: ${PROVIDER}`);
}

function describeObjects(objects) {
  if (objects.length === 0) return 'The space is currently empty.';
  return objects.map((o) => `- [${o.id}] ${o.type}: "${o.label}"`).join('\n');
}

// Called once when the user enters the space each session ("contextual
// memory across sessions" behavior).
export async function summarizeSessionStart(objects, log) {
  if (objects.length === 0) return "The space is empty. Place your first object to begin.";
  const lastNote = log.length > 0 ? log[log.length - 1].text : null;
  const prompt = `You are a curator AI embedded inside a small 3D spatial knowledge workspace. In 1-2 short, warm sentences, welcome the user back and reference what's actually in their space. Current objects:\n${describeObjects(objects)}\n${lastNote ? `The last thing you noted about this space: "${lastNote}"` : ''}\nSpeak directly to the user, in character, no preamble.`;
  const result = await callLLM(prompt);
  return result ?? `Welcome back. Your space holds ${objects.length} object${objects.length === 1 ? '' : 's'}.`;
}

// Proactive semantic clustering ("autonomous decision-making" + "semantic
// understanding" behaviors). Returns pairs of ids that should be linked -
// the caller renders these as a preview before applying them.
export async function suggestClusters(objects) {
  if (objects.length < 2) return { pairs: [], note: 'Not enough objects yet to find patterns.' };
  const prompt = `Given these knowledge objects in a spatial workspace:\n${describeObjects(objects)}\n\nIdentify pairs that are semantically related and should be visually linked (skip pairs that are already obviously unrelated). Respond with ONLY valid JSON, no markdown fences, in this exact shape:\n{"pairs": [["id1","id2"]], "note": "one short sentence explaining your reasoning"}`;
  const result = await callLLM(prompt);
  if (!result) return { pairs: [], note: "I can't reach my thoughts right now." };
  try {
    const parsed = JSON.parse(result.replace(/```json|```/g, '').trim());
    return { pairs: parsed.pairs ?? [], note: parsed.note ?? '' };
  } catch {
    return { pairs: [], note: 'I had a thought but lost track of it - try again?' };
  }
}

// Free-form natural language interaction, grounded in current workspace
// state and the curator's own memory log ("conversational spatial
// assistant" + "natural-language interaction" behaviors).
export async function askCurator(userMessage, objects, log) {
  const recent = log.slice(-5).map((l) => l.text).join(' | ');
  const prompt = `You are a curator AI that lives inside a 3D spatial knowledge workspace and can see everything in it. Stay in character, be concise (1-3 sentences), and be specific about the user's actual objects when relevant rather than generic.\n\nCurrent objects:\n${describeObjects(objects)}\n\nThings you've noticed in past sessions: ${recent || 'nothing yet'}\n\nThe user says: "${userMessage}"`;
  const result = await callLLM(prompt);
  return result ?? "I can't reach my thoughts right now - check that the API key is set.";
}
