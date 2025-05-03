// src/components/ChatBot.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "../lib/axios"; // make sure this instance has withCredentials:true
import { SendHorizonal } from "lucide-react";
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

  // 1) Greet once after login
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

  // 2) Play sound on every bot message & mark unread if closed
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.sender === "bot") {
      new Audio("/sounds/notify.wav").play().catch(() => {});
      if (!open) setHasUnread(true);
    }
  }, [messages, open]);

  // 3) Typing indicator dots
  useEffect(() => {
    if (!typing) return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 500);
    return () => clearInterval(id);
  }, [typing]);

  // 4) Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // 5) Reset on logout
  useEffect(() => {
    if (!user) {
      setOpen(false);
      setMessages([]);
      setHasUnread(false);
    }
  }, [user]);

  if (!user) return null; // hide if not logged in

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { sender: "user", text: input }]);
    setTyping(true);

    try {
      const { data } = await axios.post(
        "/chatbot",
        { message: input }
        // if you didn’t set withCredentials globally, uncomment this:
        // { withCredentials: true }
      );
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
    }

    setInput("");
    setTyping(false);
  };

  // 6) Add to cart
  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const toggleChat = () => {
    setOpen((o) => !o);
    if (!open) setHasUnread(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
      {open && (
        <div className="w-80 bg-slate-900 text-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 font-semibold border-b border-slate-700">
            Rocket Bay Assistant
          </div>
          <div className="h-64 overflow-y-auto p-4 space-y-2 text-sm">
            {messages.map((msg, i) => (
              <div key={i} className="space-y-2">
                <div
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl ${
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
                        className="bg-slate-800 p-3 rounded-md shadow-md border border-slate-600"
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

          <div className="border-t border-slate-700 p-2 bg-slate-800 flex gap-2">
            <input
              className="flex-grow bg-slate-700 px-2 py-1 rounded focus:outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me…"
            />
            <button
              onClick={sendMessage}
              className="p-1 bg-blue-600 rounded hover:bg-blue-700"
            >
              <SendHorizonal size={18} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={toggleChat}
        className="relative bg-slate-800 text-white p-3 rounded-full shadow-md hover:bg-slate-700 transition"
      >
        {open ? "✖" : "💬"}
        {hasUnread && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </button>
    </div>
  );
}
