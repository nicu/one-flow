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

RULES FOR STRUCTURED UI RESPONSES
- When asked for a layout or component structure, PREFER returning a JSON representation that follows the OneFlow component schema. Return ONLY valid JSON (no explanation or markdown) when producing component trees. If you also include human-readable commentary, still include the JSON inside a plain code block or return the JSON as the final output.
- When returning JSON, keep property names exactly: "type", "props", "children". Styles must go under 'props.style' and any measurements that are intended as pixel values MUST include the explicit "px" unit as a string (for example, "16px"). Use strings with units for values (e.g., "100%", "360px").

STYLE GUIDELINES (important)
- Spacing: use 'gap', 'padding', and 'margin' with explicit 'px' units (e.g., "8px", "12px", "16px"). Prefer consistent spacing scales (e.g., "8px", "12px", "16px", "24px").
- Layout: include 'flexDirection', 'justifyContent', and 'alignItems' for flex containers. Use 'gridColumns' and 'minColumnWidth' for grid-like layouts; when specifying fixed column widths, include units (e.g., "240px").
- Sizes: use 'width' and 'height' as strings with explicit units; when specifying pixels include 'px' (e.g., "360px") and use percentages for fluid containers (e.g., "100%").
- Typography: use 'fontSize' as a string with 'px' units (e.g., "16px"), 'fontWeight' (400, 600, 700), and 'color' as hex strings (e.g., "#111827").
- Visuals: include 'backgroundColor' (hex or rgba), 'borderRadius' as a 'px' string (e.g., "6px"), and 'boxShadow' when helpful. Use subtle shadows for elevation: e.g. "0 4px 12px rgba(0,0,0,0.08)".

IMAGES
- Prefer Unsplash sources when including images. Use 'src' values like 'https://source.unsplash.com/random/800x600?{keyword}' or a specific Unsplash image URL. If Unsplash is not available, fallback to 'https://picsum.photos/800/600'.
- Always provide an 'alt' attribute for images.
- If you cannot find a suitable external image or the user expects a placeholder, prefer generating a placeholder URL using placehold.co with a readable text label derived from the image alt/text. Use the format:
  'https://placehold.co/{width}x{height}/{bgHex}/{fgHex}?text={urlencoded text}'
  For example, for an iPhone photo placeholder use:
  'https://placehold.co/800x600/000000/FFFFFF?text=iPhone+Photo'
  - Ensure the 'text' value is URL-encoded (spaces replaced with + or %20 and special characters encoded).
  - Use sensible defaults for colors (e.g., black background '000000' and white foreground 'FFFFFF') and for width/height when the model mentions size use those values (include 'px' units elsewhere per style rules).
  - Set the component's 'props.alt' to the same descriptive text.

COLOR / THEME
- Use hex color values. When simulating an existing site, attempt to pick likely primary/secondary colors and set 'backgroundColor' and 'color' appropriately. Use muted greys for secondary text (e.g., "#6b7280") and stronger accents for calls-to-action (e.g., "#2563eb").

RESPONSIVENESS
- When appropriate, include responsive hints: use "width: 100%" for fluid containers and explicit pixel widths for fixed panels (e.g., "360px"). For component variants, prefer layouts that degrade gracefully to narrow widths.

JSON OUTPUT REQUIREMENTS
- If producing a single top-level component, return an object with 'type', 'props', and 'children'.
- If producing multiple top-level components, return an array or a root object with 'type: "fragment"' and a 'children' array.
- DO NOT include any explanatory text outside the JSON. If the user asked for commentary, provide it in a separate message — but when the user asks specifically for a component tree, return JSON only.

EXAMPLE SCHEMA (use this as a strict guide):
{
  "type": "form",
  "props": {
    "style": {
      "padding": "24px",
      "width": "360px",
      "backgroundColor": "#ffffff",
      "borderRadius": "8px",
      "boxShadow": "0 4px 14px rgba(0,0,0,0.08)"
    }
  },
  "children": [
    { "type": "text", "props": { "content": "Sign in", "fontSize": "20px", "fontWeight": 600, "marginBottom": "8px" } },
    { "type": "column", "props": { "gap": "12px" }, "children": [
      { "type": "input", "props": { "name": "email", "placeholder": "you@example.com" } },
      { "type": "input", "props": { "name": "password", "type": "password", "placeholder": "••••••••" } },
      { "type": "button", "props": { "type": "submit", "content": "Sign in", "style": { "width": "100%", "padding": "12px", "backgroundColor": "#2563eb", "color": "#fff", "borderRadius": "6px" } } }
    ] }
  ]
}

ADDITIONAL INSTRUCTIONS
- When adding images, set 'props.src' to an Unsplash or Picsum URL and include 'props.style' with 'width', 'height', 'objectFit' (e.g., "cover"), and 'borderRadius' when needed.
- Use specific 'gap'/'padding' values with explicit units (e.g., prefer 'gap: "12px"' not 'small gap').
- Where color names are ambiguous, prefer hex codes.
- Aim to replicate the spacing and visual hierarchy of existing sites: group related controls with 'column' or 'row' + 'gap', make primary actions visually prominent (bg color, white text), and add small 'borderRadius' ("4px"–"8px") to UI elements.

Available components: flex, grid, row, column, text, image, button, input, dropdown, form, tabs, datagrid, chip, breadcrumbs.

Give concise, actionable suggestions. When suggesting layouts, describe the component hierarchy briefly only when the user asks for commentary.`;

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

/**
 * Extract any non-JSON text surrounding an embedded JSON blob (or code fence).
 * Returns trimmed assistant commentary (or null when none found).
 */
function extractNonJsonText(text: string): string | null {
  if (!text) return null;
  const trimmed = text.trim();

  // remove surrounding code fences first
  const fenceMatch = /^```(?:[a-zA-Z0-9-_]+)?\n([\s\S]*)\n```$/m.exec(trimmed);
  const withoutFences = fenceMatch
    ? trimmed.replace(fenceMatch[0], "").trim()
    : trimmed;

  // try to remove a JSON substring if present
  const jsonSub = extractJsonSubstring(withoutFences);
  let leftover = withoutFences;
  if (jsonSub) {
    leftover = withoutFences.replace(jsonSub, "").trim();
  }

  // If leftover still contains backticks or trivial noise, strip them
  leftover = leftover.replace(/^```+[\s\S]*```+$/m, "").trim();

  if (!leftover) return null;
  return leftover;
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

// Call LLM with streaming enabled and return the response body as a stream reader.
// The function does not attempt to parse the streamed format — the server will
// forward raw chunks to the client as-is (SSE chunks).
async function callLLMStream(messages: ChatMessage[], modelOverride?: string) {
  const model = modelOverride || LLM_MODEL;
  const url = `${LLM_BASE_URL}/api/chat`;

  // prepend system prompt as a system message
  const fullMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  console.log("[LLM] STREAM POST", url, "model:", model);

  const body = {
    model,
    messages: fullMessages,
    stream: true,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(LLM_API_KEY ? { Authorization: `Bearer ${LLM_API_KEY}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("[LLM] STREAM HTTP error", resp.status, text);
    throw new Error(`LLM HTTP ${resp.status}: ${text}`);
  }

  // Return the raw body stream (node/web ReadableStream)
  return resp.body;
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
      const assistantText = extractNonJsonText(content) ?? "Done";
      return res.json({ ui, raw: content, text: assistantText });
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
            const assistantText = extractNonJsonText(content) ?? "Done";
            return res.json({
              ui: ui2,
              raw: content,
              reformatted,
              attempt,
              text: assistantText,
            });
          }
        }
      } catch (err) {
        console.warn(`[assistant/ui] reformat attempt ${attempt} failed:`, err);
      }
    }

    // no structured UI produced even after reformat attempt — return raw content for frontend fallback
    const assistantTextFallback = extractNonJsonText(content) ?? content ?? "";
    return res.json({
      ui: null,
      raw: content,
      reformatted,
      message: "No structured UI detected; returned raw assistant text.",
      text: assistantTextFallback,
    });
  } catch (err) {
    console.error("[assistant/ui] unexpected error:", err);
    return res.status(502).json({ error: String(err) });
  }
});

// Streaming version: returns UI immediately as an SSE `ui` event, then
// streams a short human-friendly summary as `summary` events while the LLM
// generates it. Client must open the endpoint as EventSource or fetch the
// text/event-stream and parse SSE.
app.post("/api/assistant/ui/stream", async (req: Request, res: Response) => {
  try {
    const { messages, model } = req.body as AssistantRequestBody;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).write(`event: error\ndata: messages array required\n\n`);
      return res.end();
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // First perform the usual single-shot LLM call to obtain the assistant reply
    const content = await callLLM(messages, model);

    // Parse UI if possible
    const ui = parseOrBuildUI(content);

    // Send initial UI event (client should parse JSON)
    res.write(`event: ui\ndata: ${JSON.stringify({ ui, raw: content })}\n\n`);

    // Now request a short summary from the model and stream it as it arrives
    try {
      const summaryPrompt: ChatMessage[] = [
        {
          role: "user",
          content: `Summarize the assistant reply in one short sentence (no JSON):\n${content}`,
        },
      ];

      const bodyStream = await callLLMStream(summaryPrompt, model);

      if (!bodyStream) {
        res.write(`event: summary\ndata: Done\n\n`);
        res.write(`event: done\ndata: \n\n`);
        return res.end();
      }

      // Try to obtain a reader from the returned body stream. In Node >=18
      // fetch returns a WHATWG ReadableStream with .getReader().
      // Use a type-guard to avoid `any`.
      const maybeReader = bodyStream as unknown as {
        getReader?: () => ReadableStreamDefaultReader<Uint8Array>;
      };
      const reader = maybeReader.getReader
        ? maybeReader.getReader()
        : undefined;
      const decoder = new TextDecoder();

      if (!reader) {
        // If stream API not present, just send a short summary fallback
        res.write(`event: summary\ndata: Done\n\n`);
        res.write(`event: done\ndata: \n\n`);
        return res.end();
      }

      // Read chunks and forward them as summary events
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          // Send chunk as a summary event (client should concatenate)
          // Escape newlines per SSE rules
          const safe = chunk.replace(/\n/g, "\\n");
          res.write(`event: summary\ndata: ${safe}\n\n`);
        }
      }

      // signal finished
      res.write(`event: done\ndata: \n\n`);
      return res.end();
    } catch (err) {
      console.warn("[assistant/stream] summarization stream failed:", err);
      res.write(`event: summary\ndata: Done\n\n`);
      res.write(`event: done\ndata: \n\n`);
      return res.end();
    }
  } catch (err) {
    console.error("[assistant/ui/stream] unexpected error:", err);
    try {
      res.write(`event: error\ndata: ${String(err)}\n\n`);
    } catch (writeErr) {
      console.error("Failed writing error SSE", writeErr);
    }
    return res.end();
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

// Simple image proxy — restrict to known hosts to avoid open proxy abuse
// Note: image proxy removed — frontends should use direct image URLs.

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`🤖 Assistant proxy running on http://localhost:${PORT}`);
  console.log(`   Ollama base URL: ${LLM_BASE_URL}`);
  console.log(`   LLM model:       ${LLM_MODEL}`);
});
