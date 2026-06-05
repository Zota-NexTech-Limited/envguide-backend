import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { generateResponse } from "../util/genRes.js";

/**
 * EnviGuide Help Centre AI assistant.
 *
 * Provider-agnostic chat proxy. It auto-selects whichever provider key is
 * configured, in priority order:
 *   1. Google Gemini  (GEMINI_API_KEY)  — free tier via Google AI Studio
 *   2. Groq           (GROQ_API_KEY)    — free tier, very fast (Llama)
 *   3. Anthropic Claude (ANTHROPIC_API_KEY)
 *   4. Canned fallback (no key needed)  — keeps the widget working at zero cost
 *
 * All API keys stay server-side; the browser only ever sees the reply text.
 */

const SYSTEM_PROMPT = `You are "Eco AI", the in-app assistant for the PCF Supplier Intelligence Suite — a platform for Product Carbon Footprints (PCF), supplier sustainability questionnaires, and data-quality ratings.

Your job is to help users of the Help Centre with:
- Product Carbon Footprint (PCF) creation, calculation, and reporting workflows.
- Supplier questionnaires and resolving data-collection issues.
- Platform navigation: dashboards, manuals, API keys, team roles, metric reports.
- General ESG and carbon-accounting concepts (GHG Protocol, scopes 1/2/3, cradle-to-gate, etc.).

Style:
- Be warm, concise, and practical. Default to 2-4 short sentences; use a compact bullet list only when steps genuinely help.
- Speak as part of the product ("you can…", "in the Suite…"). Use the occasional tasteful emoji (🌱) but don't overdo it.
- When a request needs a human or account-specific action, point users to the Support form or info@enviguide.com.

Boundaries:
- Only advise on the PCF Supplier Intelligence Suite and general ESG/PCF topics. Politely decline unrelated requests.
- Never invent specific figures, emission factors, customer data, or features you're unsure exist. If you don't know, say so and suggest the manuals or Support.`;

// Default models per provider (override via env if you like).
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5";

const MAX_TOKENS = 1024;

type ChatRole = "user" | "assistant";
interface ChatMessage {
    role: ChatRole;
    content: string;
}

/** Normalise the loosely-typed body the frontend sends. */
function normaliseMessages(raw: unknown): ChatMessage[] {
    if (!Array.isArray(raw)) return [];
    const mapped: ChatMessage[] = raw
        .map((m: any) => {
            const text = typeof m?.text === "string" ? m.text : typeof m?.content === "string" ? m.content : "";
            const role: ChatRole = m?.role === "user" ? "user" : "assistant";
            return { role, content: String(text).trim() };
        })
        .filter((m) => m.content.length > 0);

    // Conversation must start with a user turn — drop the leading AI greeting.
    while (mapped.length && mapped[0].role !== "user") mapped.shift();
    return mapped;
}

// ── Google Gemini (free tier) ────────────────────────────────────────────────
async function callGemini(messages: ChatMessage[]): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const body = {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.7 },
    };
    const { data } = await axios.post<any>(url, body, {
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY as string },
        timeout: 30000,
    });
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: any) => p?.text ?? "").join("").trim();
}

// ── Groq (free tier, OpenAI-compatible) ───────────────────────────────────────
async function callGroq(messages: ChatMessage[]): Promise<string> {
    const { data } = await axios.post<any>(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model: GROQ_MODEL,
            max_tokens: MAX_TOKENS,
            temperature: 0.7,
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        },
        {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            timeout: 30000,
        }
    );
    return (data?.choices?.[0]?.message?.content ?? "").trim();
}

// ── Anthropic Claude ──────────────────────────────────────────────────────────
let claudeClient: Anthropic | null = null;
async function callClaude(messages: ChatMessage[]): Promise<string> {
    if (!claudeClient) claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY as string });
    const response = await claudeClient.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        // Cacheable system prefix (activates once it exceeds the model minimum).
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages,
    });
    return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
}

/** Canned reply used when no provider key is configured (mirrors the frontend fallback). */
function fallbackReply(text: string): string {
    const t = text.toLowerCase();
    if (/\b(hi|hello|hey|hii|yo)\b/.test(t)) {
        return "Hey! 👋 What would you like help with today — PCF reports, supplier questionnaires, or something else?";
    }
    if (t.includes("pcf") || t.includes("carbon") || t.includes("footprint") || t.includes("emission")) {
        return "For Product Carbon Footprints, the PCF Manuals walk you through every step. Want me to point you to the PCF guidance, or connect you with a Manufacturer Consultant?";
    }
    if (t.includes("questionnaire") || t.includes("supplier")) {
        return "Supplier questionnaire trouble? A Supplier Consultant can help directly — tap “Supplier Consultant” to get routed there.";
    }
    if (t.includes("api") || t.includes("key") || t.includes("token")) {
        return "You'll find API key setup under the API documentation. Need a hand generating one?";
    }
    if (t.includes("contact") || t.includes("human") || t.includes("agent") || t.includes("support") || t.includes("email")) {
        return "Of course — our team replies within 24 hours. You can use the Support form or email info@enviguide.com.";
    }
    if (t.includes("thank")) {
        return "You're very welcome! 🌿 Happy to help anytime.";
    }
    return "Got it! I can point you to the right place — pick a context below, or I can take you to our Support team for a detailed answer.";
}

/** Pick the first configured provider, in free-first priority order. */
function pickProvider(): { name: string; run: (m: ChatMessage[]) => Promise<string> } | null {
    if (process.env.GEMINI_API_KEY?.trim()) return { name: "gemini", run: callGemini };
    if (process.env.GROQ_API_KEY?.trim()) return { name: "groq", run: callGroq };
    if (process.env.ANTHROPIC_API_KEY?.trim()) return { name: "claude", run: callClaude };
    return null;
}

export async function aiChat(req: any, res: any) {
    const messages = normaliseMessages(req.body?.messages);
    if (!messages.length) {
        return res.send(generateResponse(false, "No message provided", 400, null));
    }
    const lastUser = [...messages].reverse().find((m) => m.role === "user");

    const provider = pickProvider();
    if (!provider) {
        // No key configured → free canned fallback so the widget still responds.
        return res.send(generateResponse(true, "ok", 200, { reply: fallbackReply(lastUser?.content ?? ""), source: "fallback" }));
    }

    try {
        const reply = await provider.run(messages);
        const finalReply = reply && reply.trim() ? reply : fallbackReply(lastUser?.content ?? "");
        return res.send(generateResponse(true, "ok", 200, { reply: finalReply, source: provider.name }));
    } catch (err: any) {
        console.error(`aiChat (${provider.name}) error:`, err?.response?.data || err?.message || err);
        // Provider failed → don't break the UX; serve the local fallback.
        return res.send(generateResponse(true, "ok", 200, { reply: fallbackReply(lastUser?.content ?? ""), source: "fallback" }));
    }
}
