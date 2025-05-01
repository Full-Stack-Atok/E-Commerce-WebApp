import { useState, useRef, useEffect } from "react";
import axios from "../lib/axios";
import { SendHorizonal } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [dots, setDots] = useState(".");
  const [unreadCount, setUnread] = useState(0);
  const [lastSeenIndex, setLastSeenIndex] = useState(-1);
  const [greeted, setGreeted] = useState(false);

  const bottomRef = useRef(null);

  const user = useUserStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addToCart);

  // Greet user once after login with a delay
  useEffect(() => {
    if (user && !greeted) {
      // Delay the greeting by 2 seconds (2000ms)
      setTimeout(() => {
        setMessages([
          {
            sender: "bot",
            text: `Hi ${
              user.name || "there"
            }! 👋 Ask me about any product you're looking for.`,
          },
        ]);
        setGreeted(true);
      }, 5000); // Adjust the delay time as needed
    }
  }, [user, greeted]);

  // Play sound only for unseen bot replies
  useEffect(() => {
    if (messages.length === 0) return;

    const newIndex = messages.length - 1;
    const last = messages[newIndex];

    if (last.sender === "bot" && !open && newIndex > lastSeenIndex) {
      new Audio("/sounds/notify.wav").play().catch(() => {});
      setUnread((u) => u + 1);
    }
  }, [messages, open, lastSeenIndex]);

  // Typing dots animation
  useEffect(() => {
    if (!typing) return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 500);
    return () => clearInterval(id);
  }, [typing]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Reset on logout
  useEffect(() => {
    if (!user) {
      setOpen(false);
      setMessages([]);
      setUnread(0);
      setLastSeenIndex(-1);
      setGreeted(false);
    }
  }, [user]);

  if (!user) return null;

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setTyping(true);

    try {
      const res = await axios.post("/chatbot", { message: input });
      await new Promise((r) => setTimeout(r, 1500));
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: res.data.reply,
          products: res.data.products || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Something went wrong." },
      ]);
    }

    setInput("");
    setTyping(false);
  };

  const handleAddToCart = (p) => {
    addToCart(p);
    toast.success(`Added "${p.name}" to your cart!`);
  };

  const toggleChat = () => {
    setOpen((o) => !o);
    if (!open) {
      setUnread(0);
      setLastSeenIndex(messages.length - 1); // mark all seen
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
      {open && (
        <div className="w-80 rounded-xl shadow-xl bg-slate-900 text-white border border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-800 px-4 py-3 font-semibold text-xl border-b border-slate-700">
            Rocket Bay Assistant
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-2 text-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="space-y-2 max-w-xs">
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-100"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.products?.map((p, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800 rounded-xl p-3 shadow-md border border-slate-600"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-white">
                          {p.name}
                        </span>
                        <button
                          onClick={() => handleAddToCart(p)}
                          className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md hover:bg-blue-700"
                        >
                          Add to Cart
                        </button>
                      </div>
                      <div className="text-sm text-slate-400 mb-1">
                        ₱{p.price.toLocaleString()}
                      </div>
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-slate-300 px-4 py-2 rounded-2xl text-sm font-mono">
                  Rocket Bay is typing{dots}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-700 p-2 bg-slate-800">
            <div className="flex items-center gap-2">
              <input
                className="flex-grow p-2 rounded-xl bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about a product..."
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full text-white"
              >
                <SendHorizonal size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button with unread badge */}
      <button
        onClick={toggleChat}
        className="relative bg-slate-800 text-white p-3 rounded-full shadow-md hover:bg-slate-700 transition"
      >
        {open ? "✖" : "💬"}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
