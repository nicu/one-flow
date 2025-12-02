import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------- ENV ----------
const PORT = Number(process.env.PORT ?? 4040);

// Ollama config
const LLM_BASE_URL = process.env.LLM_BASE_URL || "http://localhost:11434";
const LLM_MODEL = process.env.LLM_MODEL || "qwen3-coder:30b";
const LLM_API_KEY = process.env.LLM_API_KEY || ""; // not used by Ollama, but kept for symmetry

// ---------- SYSTEM PROMPT ----------
const SYSTEM_PROMPT = `You are an AI assistant for OneFlow, a visual UI builder.
Help users build UIs by suggesting component structures and properties.

When the user asks for a layout or component structure, PREFER returning a JSON representation that follows the OneFlow component schema. Return ONLY valid JSON (no explanation or markdown) when producing component trees. If you also include human-readable commentary, still include the JSON inside a plain code block or return the JSON as the final output.

Available components: flex, grid, row, column, text, image, button, input, dropdown, form, tabs, datagrid, chip, breadcrumbs.

Key properties: flexDirection, justifyContent, alignItems, gap, padding, margin, width, height, backgroundColor, borderRadius, color, fontSize, fontWeight, gridColumns, minColumnWidth.

Example minimal schema (use this as guidance):
{
  "type": "form",
  "props": { "style": { "padding": 16, "width": 360 } },
  "children": [
    { "type": "text", "props": { "content": "Sign in" } },
    { "type": "column", "children": [
      { "type": "input", "props": { "name": "email", "placeholder": "you@example.com" } },
      { "type": "input", "props": { "name": "password", "type": "password" } },
      { "type": "button", "props": { "type": "submit", "content": "Sign in" } }
    ] }
  ]
}

Give concise, actionable suggestions. When suggesting layouts, describe the component hierarchy briefly.`;

// ---------- TYPES ----------
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AssistantRequestBody {
  messages: ChatMessage[];
  model?: string;
}

// Simple component schema used by OneFlow frontend
export interface ComponentNode {
  type: string;
  props?: Record<string, unknown>;
  children?: Array<ComponentNode | string>;
}

/**
 * Try to parse LLM content as JSON describing a component tree. If parsing fails,
 * attempt to build a reasonable fallback UI when the text mentions a login/form.
 */
function parseOrBuildUI(content: string): ComponentNode | null {
  // Try fast JSON parse first (allowing responses that wrap JSON in markdown)
  const trimmed = content.trim();
  // strip triple backticks and optional language
  const codeFenceMatch = /^```(?:[a-zA-Z0-9-_]+)?\n([\s\S]*)\n```$/m.exec(
    trimmed
  );
  const maybeJson = codeFenceMatch ? codeFenceMatch[1].trim() : trimmed;

  // Try direct parse first
  try {
    const parsed = JSON.parse(maybeJson);
    if (parsed && (parsed.type || parsed.components || Array.isArray(parsed))) {
      if (Array.isArray(parsed))
        return { type: "fragment", children: parsed } as ComponentNode;
      return parsed as ComponentNode;
    }
  } catch {
    // If initial parse fails, try extracting a JSON substring (handles when model adds commentary)
    const extracted = extractJsonSubstring(maybeJson);
    if (extracted) {
      try {
        const parsed2 = JSON.parse(extracted);
        if (
          parsed2 &&
          (parsed2.type || parsed2.components || Array.isArray(parsed2))
        ) {
          if (Array.isArray(parsed2))
            return { type: "fragment", children: parsed2 } as ComponentNode;
          return parsed2 as ComponentNode;
        }
      } catch {
        // fall through to heuristics
      }
    }
  }

  const lower = content.toLowerCase();
  // If the assistant suggested a login form in plain text, synthesize a design
  if (
    lower.includes("login") ||
    lower.includes("username") ||
    lower.includes("password") ||
    lower.includes("sign in") ||
    lower.includes("sign-in")
  ) {
    const loginForm: ComponentNode = {
      type: "form",
      props: {
        style: {
          width: 360,
          padding: 24,
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        },
      },
      children: [
        {
          type: "text",
          props: {
            content: "Welcome back",
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 8,
          },
        },
        {
          type: "text",
          props: {
            content: "Please sign in to your account",
            color: "#666",
            marginBottom: 16,
          },
        },
        {
          type: "column",
          props: { gap: 12 },
          children: [
            { type: "text", props: { content: "Email" } },
            {
              type: "input",
              props: {
                name: "email",
                placeholder: "you@example.com",
                type: "email",
              },
            },
            { type: "text", props: { content: "Password" } },
            {
              type: "input",
              props: {
                name: "password",
                placeholder: "••••••••",
                type: "password",
              },
            },
            {
              type: "button",
              props: {
                type: "submit",
                style: {
                  width: "100%",
                  padding: 12,
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  borderRadius: 6,
                },
                content: "Sign in",
              },
            },
            {
              type: "row",
              props: { justifyContent: "space-between", alignItems: "center" },
              children: [
                { type: "checkbox", props: { name: "remember" } },
                { type: "text", props: { content: "Remember me" } },
                {
                  type: "text",
                  props: { content: "Forgot password?", color: "#2563eb" },
                },
              ],
            },
          ],
        },
      ],
    };

    return loginForm;
  }

  // Unknown content and not a login form — return null so caller can fall back
  return null;
}

/**
 * Extract a JSON substring (object or array) from noisy text.
 * It finds the first '{' or '[' and attempts to find the matching closing bracket
 * by scanning and counting nested brackets. Returns the substring or null.
 */
function extractJsonSubstring(text: string): string | null {
  if (!text) return null;
  const startIdx = Math.min(
    ...[text.indexOf("{"), text.indexOf("[")].filter((i) => i >= 0)
  );
  // If neither found, bail
  if (startIdx === Infinity || startIdx < 0) return null;
  const openChar = text[startIdx];
  const closeChar = openChar === "{" ? "}" : "]";

  let depth = 0;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (ch === openChar) depth++;
    else if (ch === closeChar) depth--;

    if (depth === 0) {
      const candidate = text.slice(startIdx, i + 1).trim();
      // quick sanity check
      if (candidate.startsWith(openChar) && candidate.endsWith(closeChar))
        return candidate;
    }
  }

  return null;
}

// When the assistant returns plain text, ask the model to reformat that
// reply into the expected JSON component schema. This helper sends a
// follow-up instruction asking explicitly for JSON-only output and an
// example schema to follow.
async function requestStructuredUI(
  originalReply: string,
  modelOverride?: string
) {
  const schemaExample = `Example schema (reply must be valid JSON):
{
  "type": "form",
  "props": { "style": { "padding": 16, "width": 360 } },
  "children": [
    { "type": "text", "props": { "content": "Sign in" } },
    { "type": "column", "children": [
      { "type": "input", "props": { "name": "email", "placeholder": "you@example.com" } },
      { "type": "input", "props": { "name": "password", "type": "password", "placeholder": "••••••••" } },
      { "type": "button", "props": { "type": "submit", "content": "Sign in" } }
    ] }
  ]
}`;

  const instruction = `You will be given an assistant reply (plain text). Convert the reply into a JSON object that follows the component schema used by OneFlow. Only return valid JSON — do NOT include any explanation, markdown, or surrounding text. Use the following schema example as a guide and keep property names like "type", "props" and "children". If the reply suggests multiple top-level components, return an array or a root object with "type": "fragment" and a "children" array.

${schemaExample}

Assistant reply:

${originalReply}`;

  const messages: ChatMessage[] = [{ role: "user", content: instruction }];

  // callLLM will prepend the SYSTEM_PROMPT; pass modelOverride if provided
  return await callLLM(messages, modelOverride);
}

// ---------- OLLAMA CALL ----------
async function callLLM(messages: ChatMessage[], modelOverride?: string) {
  const model = modelOverride || LLM_MODEL;
  const url = `${LLM_BASE_URL}/api/chat`;

  // prepend system prompt as a system message
  const fullMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  console.log("[LLM] POST", url, "model:", model);
  console.log(
    "[LLM] messages:",
    fullMessages.map((m) => ({ role: m.role, len: m.content.length }))
  );

  const body = {
    model,
    messages: fullMessages,
    stream: false,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Ollama doesn't need Authorization, but keep hook if you ever proxy something else
      ...(LLM_API_KEY ? { Authorization: `Bearer ${LLM_API_KEY}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("[LLM] HTTP error", resp.status, text);
    throw new Error(`LLM HTTP ${resp.status}: ${text}`);
  }

  const data = await resp.json();

  // Ollama /api/chat shape:
  // {
  //   model: string,
  //   message: { role: "assistant", content: string },
  //   ...
  // }
  const content: string =
    data.message?.content ??
    data.response ?? // older /api/generate style
    "[no content from LLM]";

  console.log("[LLM] reply length:", content.length);
  return content;
}

// ---------- ROUTES ----------
app.post("/api/assistant", async (req: Request, res: Response) => {
  try {
    const { messages, model } = req.body as AssistantRequestBody;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }

    const content = await callLLM(messages, model);
    return res.json({ content });
  } catch (err) {
    console.error("[assistant] unexpected error:", err);
    return res.status(502).json({ error: String(err) });
  }
});

app.post("/api/assistant/ui", async (req: Request, res: Response) => {
  try {
    const { messages, model } = req.body as AssistantRequestBody;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }

    const content = await callLLM(messages, model);

    const ui = parseOrBuildUI(content);

    if (ui) {
      return res.json({ ui, raw: content });
    }

    // Try to ask the model to reformat the plain-text assistant reply into JSON.
    // We'll perform a small retry loop to improve chances of receiving valid JSON.
    let reformatted: string | null = null;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        reformatted = await requestStructuredUI(content, model);
        if (reformatted) {
          // First try normal parse
          let ui2 = parseOrBuildUI(reformatted);
          if (!ui2) {
            // If still not parsed, attempt to extract JSON substring and parse again
            const extracted = extractJsonSubstring(reformatted);
            if (extracted) {
              try {
                const parsed = JSON.parse(extracted);
                if (
                  parsed &&
                  (parsed.type || parsed.components || Array.isArray(parsed))
                ) {
                  ui2 = Array.isArray(parsed)
                    ? ({ type: "fragment", children: parsed } as ComponentNode)
                    : (parsed as ComponentNode);
                }
              } catch {
                // ignore
              }
            }
          }
          if (ui2) {
            return res.json({ ui: ui2, raw: content, reformatted, attempt });
          }
        }
      } catch (err) {
        console.warn(`[assistant/ui] reformat attempt ${attempt} failed:`, err);
      }
    }

    // no structured UI produced even after reformat attempt — return raw content for frontend fallback
    return res.json({
      ui: null,
      raw: content,
      reformatted,
      message: "No structured UI detected; returned raw assistant text.",
    });
  } catch (err) {
    console.error("[assistant/ui] unexpected error:", err);
    return res.status(502).json({ error: String(err) });
  }
});

// LLM / Ollama health endpoint — checks base URL and lists available models
app.get("/api/llm/health", async (req: Request, res: Response) => {
  try {
    const url = `${LLM_BASE_URL}/api/models`;
    console.log("[LLM] health check", url);
    const resp = await fetch(url, { method: "GET" });
    if (!resp.ok) {
      const text = await resp.text();
      return res
        .status(502)
        .json({ ok: false, status: resp.status, error: text });
    }
    const data = await resp.json();
    return res.json({
      ok: true,
      baseUrl: LLM_BASE_URL,
      model: LLM_MODEL,
      models: data,
    });
  } catch (err) {
    console.error("[LLM] health check failed:", err);
    return res.status(502).json({ ok: false, error: String(err) });
  }
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`🤖 Assistant proxy running on http://localhost:${PORT}`);
  console.log(`   Ollama base URL: ${LLM_BASE_URL}`);
  console.log(`   LLM model:       ${LLM_MODEL}`);
});
