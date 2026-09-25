import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/prompt";
import { retrieve } from "@/lib/retrieve";

export const runtime = "nodejs";
export const maxDuration = 60;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const apiKey = process.env.MISTRAL_API_KEY;
  const model = process.env.MISTRAL_MODEL ?? "mistral-small-latest";

  if (!apiKey) {
    return Response.json(
      { error: "MISTRAL_API_KEY tanımlı değil" },
      { status: 500, headers: corsHeaders },
    );
  }

  let body: { messages?: ChatMessage[]; message?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz JSON" }, { status: 400, headers: corsHeaders });
  }

  const lastUser =
    body.message ??
    [...(body.messages ?? [])].reverse().find((m) => m.role === "user")?.content;

  if (!lastUser?.trim()) {
    return Response.json({ error: "Mesaj gerekli" }, { status: 400, headers: corsHeaders });
  }

  const { contextText, cards } = retrieve(lastUser);

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: unknown) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            stream: true,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: buildUserPrompt(lastUser, contextText),
              },
            ],
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          send({ type: "error", message: `Mistral hatası: ${res.status}` });
          console.error(errText);
          controller.close();
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          send({ type: "error", message: "Stream alınamadı" });
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) send({ type: "delta", content: delta });
            } catch {
              /* ignore partial JSON */
            }
          }
        }

        send({ type: "products", items: cards });
        send({ type: "done" });
      } catch (e) {
        send({
          type: "error",
          message: e instanceof Error ? e.message : "Bilinmeyen hata",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
