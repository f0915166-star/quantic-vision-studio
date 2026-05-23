import { useState, useRef, useEffect, useMemo } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2 } from "lucide-react";
import { useData } from "@/lib/data-store";
import { buildDashboardContext } from "@/lib/chat-context";


interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Resume el dashboard",
  "¿Qué centro de costo tiene mayor gasto?",
  "¿Qué tendencia preocupa más?",
  "Dame un resumen ejecutivo",
];

declare global {
  interface Window {
    __askDashboard__?: (q: string, c: string) => Promise<string>;
    google?: {
      script?: {
        run?: {
          withSuccessHandler: (cb: (r: string) => void) => {
            withFailureHandler: (cb: (e: unknown) => void) => {
              askAI: (question: string, context: string) => void;
            };
          };
        };
      };
    };
  }
}

async function callAI(question: string, context: string): Promise<string> {
  // Apps Script mode
  if (typeof window !== "undefined" && window.google?.script?.run) {
    return new Promise((resolve, reject) => {
      window.google!.script!.run!
        .withSuccessHandler((r: string) => resolve(r))
        .withFailureHandler((e: unknown) => reject(new Error(String(e))))
        .askAI(question, context);
    });
  }
  // Web / dev mode — provided by the host (src/routes/index.tsx)
  if (typeof window !== "undefined" && window.__askDashboard__) {
    return window.__askDashboard__(question, context);
  }
  throw new Error("Asistente no disponible en este entorno.");
}

export function ChatWidget() {
  const { filtered, filters } = useData();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const context = useMemo(() => buildDashboardContext(filtered, filters), [filtered, filters]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setMessages(m => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const answer = await callAI(q, context);
      setMessages(m => [...m, { role: "assistant", content: answer }]);
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: `⚠️ ${e instanceof Error ? e.message : "Error"}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        className="fixed z-50 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          right: 24, bottom: 24, width: 58, height: 58, borderRadius: "50%",
          background: "linear-gradient(135deg, hsl(6 80% 54%), hsl(12 78% 42%))",
          boxShadow: "0 12px 32px -8px hsl(6 72% 38% / 0.65), 0 0 0 4px hsl(6 80% 54% / 0.12)",
          color: "#fff", border: "none", cursor: "pointer",
        }}
      >
        {open ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!open && (
          <span
            className="absolute animate-ping"
            style={{ width: 14, height: 14, borderRadius: "50%", background: "hsl(42 92% 62%)", top: 4, right: 4 }}
          />
        )}
        {!open && (
          <span
            className="absolute"
            style={{ width: 10, height: 10, borderRadius: "50%", background: "hsl(42 92% 62%)", top: 6, right: 6, border: "2px solid #fff" }}
          />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed z-50 flex flex-col"
          style={{
            right: 24, bottom: 96,
            width: "min(400px, calc(100vw - 32px))",
            height: "min(600px, calc(100vh - 140px))",
            background: "hsl(25 30% 10%)",
            borderRadius: 16,
            border: "1px solid hsl(25 25% 22%)",
            boxShadow: "0 30px 60px -20px hsl(25 35% 4% / 0.7), 0 0 0 1px hsl(6 72% 48% / 0.15)",
            animation: "chatPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            overflow: "hidden",
          }}
        >
          <style>{`
            @keyframes chatPop {
              from { opacity: 0; transform: translateY(12px) scale(0.96); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes chatMsg {
              from { opacity: 0; transform: translateY(6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .chat-msg { animation: chatMsg 0.22s ease-out; }
            .chat-scroll::-webkit-scrollbar { width: 6px; }
            .chat-scroll::-webkit-scrollbar-thumb { background: hsl(25 20% 28%); border-radius: 3px; }
          `}</style>

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              background: "linear-gradient(115deg, hsl(25 45% 11%) 0%, hsl(20 50% 22%) 100%)",
              borderBottom: "1px solid hsl(6 72% 48% / 0.3)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: "linear-gradient(135deg, hsl(6 80% 54%), hsl(12 78% 42%))",
                  boxShadow: "0 4px 12px -2px hsl(6 72% 38% / 0.5)",
                }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Asistente Norlima
                </div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
                  IA · {filtered.length} registros
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ width: 32, height: 32, borderRadius: 8, color: "rgba(255,255,255,0.7)", border: "none", background: "transparent", cursor: "pointer" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "hsl(25 28% 8%)" }}>
            {messages.length === 0 && (
              <div className="space-y-3">
                <div
                  className="chat-msg px-3.5 py-3 text-[13px] leading-relaxed"
                  style={{
                    background: "hsl(25 25% 14%)",
                    color: "hsl(30 15% 85%)",
                    borderRadius: "14px 14px 14px 4px",
                    border: "1px solid hsl(25 22% 20%)",
                  }}
                >
                  ¡Hola! Soy tu asistente del dashboard. Puedo analizar tus costos, equipos, áreas y tendencias en base a los filtros activos.
                </div>
                <div className="text-[10px] uppercase tracking-wider font-semibold pt-1" style={{ color: "hsl(30 10% 50%)" }}>
                  Sugerencias
                </div>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-[12.5px] px-3 py-2 transition-all hover:translate-x-0.5"
                      style={{
                        background: "hsl(25 25% 14%)",
                        color: "hsl(30 15% 80%)",
                        border: "1px solid hsl(25 22% 22%)",
                        borderRadius: 10,
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ color: "hsl(6 80% 60%)", marginRight: 6 }}>›</span>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className="chat-msg px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap"
                style={
                  m.role === "user"
                    ? {
                        background: "linear-gradient(135deg, hsl(6 80% 54%), hsl(12 78% 44%))",
                        color: "#fff",
                        borderRadius: "14px 14px 4px 14px",
                        marginLeft: "15%",
                        boxShadow: "0 4px 10px -4px hsl(6 72% 38% / 0.5)",
                      }
                    : {
                        background: "hsl(25 25% 14%)",
                        color: "hsl(30 15% 88%)",
                        borderRadius: "14px 14px 14px 4px",
                        border: "1px solid hsl(25 22% 20%)",
                        marginRight: "10%",
                      }
                }
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div
                className="chat-msg inline-flex items-center gap-2 px-3.5 py-2.5 text-[12px]"
                style={{
                  background: "hsl(25 25% 14%)",
                  color: "hsl(30 10% 60%)",
                  borderRadius: "14px 14px 14px 4px",
                  border: "1px solid hsl(25 22% 20%)",
                }}
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "hsl(6 80% 60%)" }} />
                Analizando datos…
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 px-3 py-3"
            style={{ background: "hsl(25 30% 10%)", borderTop: "1px solid hsl(25 22% 18%)" }}
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Pregunta sobre tus datos…"
              disabled={loading}
              className="flex-1 text-[13px] outline-none"
              style={{
                background: "hsl(25 25% 14%)",
                color: "hsl(30 15% 90%)",
                border: "1px solid hsl(25 22% 22%)",
                borderRadius: 10,
                padding: "9px 12px",
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar"
              className="flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: "linear-gradient(135deg, hsl(6 80% 54%), hsl(12 78% 42%))",
                color: "#fff", border: "none", cursor: "pointer",
                boxShadow: "0 4px 10px -3px hsl(6 72% 38% / 0.5)",
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
