import { useState, useCallback } from "react";
import aiToBuilder from "../utils/aiToBuilder";
import type { BuilderComponent } from "../types";

export interface ChatMessage {
  role: "user" | "assistant"; // server also accepts "system", but we don't need to send it
  content: string;
}

const PROXY_URL = "/api/assistant";

export function useAIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (
      userMessage: string,
      context?: string,
      options?: {
        autoInsert?: boolean;
        onInsert?: (components: BuilderComponent[]) => void;
        stream?: boolean;
      }
    ) => {
      if (!userMessage.trim()) return;

      const userMsg: ChatMessage = { role: "user", content: userMessage };

      // optimistic update
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      // build payload for server
      // server already prepends SYSTEM_PROMPT internally, so we just send convo
      const baseMessages: ChatMessage[] = [...messages, userMsg];

      const payloadMessages: ChatMessage[] =
        context && messages.length === 0
          ? [
              {
                role: "user",
                content: `Context: ${context}`,
              },
              ...baseMessages,
            ]
          : baseMessages;

      try {
        if (options?.autoInsert) {
          // call the UI endpoint which may return structured UI
          const res = await fetch("/api/assistant/ui", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: payloadMessages }),
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || `HTTP ${res.status}`);
          }

          const data = await res.json();

          // If structured UI returned, convert and call onInsert
          if (data.ui && options.onInsert) {
            try {
              const components = aiToBuilder(data.ui) as BuilderComponent[];
              if (components && components.length > 0) {
                options.onInsert(components);
                // acknowledge insertion with a simple 'Done' message
                const assistantMsg: ChatMessage = {
                  role: "assistant",
                  content: "Done",
                };
                setMessages((prev) => [...prev, assistantMsg]);
              } else {
                const assistantContent =
                  data.text || data.raw || "No structured UI produced";
                const assistantMsg: ChatMessage = {
                  role: "assistant",
                  content: String(assistantContent),
                };
                setMessages((prev) => [...prev, assistantMsg]);
              }
            } catch {
              const assistantContent =
                data.text || data.raw || "No structured UI produced";
              const assistantMsg: ChatMessage = {
                role: "assistant",
                content: String(assistantContent),
              };
              setMessages((prev) => [...prev, assistantMsg]);
            }
          } else {
            // fallback: no structured UI, just show raw assistant text
            const assistantContent = data.text || data.raw || "No response";
            const assistantMsg: ChatMessage = {
              role: "assistant",
              content: String(assistantContent),
            };
            setMessages((prev) => [...prev, assistantMsg]);
          }
        } else {
          const res = await fetch(PROXY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: payloadMessages }),
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || `HTTP ${res.status}`);
          }

          const data = await res.json();
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: data.content || "No response",
          };

          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
