// src/components/ChatBot.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "../lib/axios";
import { SendHorizontal, X } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [dots, setDots] = useState(".");
  const [hasUnread, setHasUnread] = useState(false);

  const bottomRef = useRef(null);
  const user = useUserStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addToCart);

  // greet once after login
  useEffect(() => {
    if (user && messages.length === 0) {
      setTimeout(() => {
        setMessages([
          {
            sender: "bot",
            text: `Hi ${
              user.name || "there"
            }! 👋 Ask me about any product you're looking for.`,
          },
        ]);
      }, 5000);
    }
  }, [user, messages.length]);

  // play sound & mark unread *only* when new messages array changes
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.sender === "bot") {
      new Audio("/sounds/notify.wav").play().catch(() => {});
      if (!open) setHasUnread(true);
    }
  }, [messages]);

  // typing “…” indicator
  useEffect(() => {
    if (!typing) return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 500);
    return () => clearInterval(id);
  }, [typing]);

  // scroll to bottom on new message or typing change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // reset on logout
  useEffect(() => {
    if (!user) {
      setOpen(false);
      setMessages([]);
      setHasUnread(false);
    }
  }, [user]);

  if (!user) return null;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { sender: "user", text }]);
    setTyping(true);
    setInput("");

    try {
      const { data } = await axios.post("/chatbot", { message: text });
      // small artificial delay
      await new Promise((r) => setTimeout(r, 300));
      setMessages((m) => [
        ...m,
        { sender: "bot", text: data.reply, products: data.products || [] },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { sender: "bot", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const toggleChat = () => {
    setOpen((o) => !o);
    if (!open) setHasUnread(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
      {/* Chat window */}
      {open && (
        <div
          className="w-full max-w-xs bg-slate-900 text-white rounded-xl shadow-2xl overflow-hidden transform transition-transform duration-300 ease-out origin-bottom-right"
          style={{ animation: "slide-up 200ms ease-out" }}
        >
          {/* Header */}
          <div className="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700">
            <span className="font-semibold">Rocket Bay Assistant</span>
            <button
              onClick={toggleChat}
              aria-label="Close chat"
              className="p-1 hover:bg-slate-700 rounded"
            >
              <X size={18} />
            </button>
          </div>

          {/* Message list */}
          <div className="h-64 overflow-y-auto p-4 flex flex-col space-y-2 text-sm">
            {messages.map((msg, i) => (
              <div key={i} className="space-y-1">
                <div
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-[80%] break-words ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-100"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
                {msg.products?.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 pl-4">
                    {msg.products.map((p, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800 p-3 rounded-md shadow border border-slate-600"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-white text-sm">
                            {p.name}
                          </span>
                          <button
                            onClick={() => handleAddToCart(p)}
                            className="bg-blue-600 px-2 py-0.5 text-xs rounded hover:bg-blue-700"
                          >
                            Add to Cart
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-1">
                          ₱{p.price.toLocaleString()}
                        </p>
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-20 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="text-slate-400 text-xs italic">
                Rocket Bay is typing{dots}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-700 p-2 bg-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me…"
              autoFocus
              className="flex-grow bg-slate-700 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={sendMessage}
              aria-label="Send message"
              className="p-2 bg-blue-600 rounded hover:bg-blue-700 transition"
            >
              <SendHorizontal size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={toggleChat}
        aria-label="Toggle chat"
        className="relative bg-slate-800 text-white p-3 rounded-full shadow-md hover:bg-slate-700 transition"
      >
        {open ? "✖" : "💬"}
        {hasUnread && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(10px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
