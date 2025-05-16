// src/components/Chatbot.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaUser, FaRobot, FaPaperPlane, FaSearch } from "react-icons/fa";

import Header from "@/components/Header";
import { useToken } from "@/context/TokenContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const BASE_URL = "http://127.0.0.1:8000";

interface ChatEntry {
  question: string;
  response: string | null;
}

const Chatbot: React.FC = () => {
  const { token } = useToken();
  const navigate = useNavigate();

  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Redirect to login if no token
  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  // Load chat history
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/get_history/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.status && Array.isArray(json.history)) {
          setHistory(json.history);
        }
      })
      .catch(console.error);
  }, [token]);

  // Auto-scroll on new messages
  useEffect(() => {
    containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
  }, [history]);

  // Send a new question + search flag
  const sendMessage = async () => {
    const question = input.trim();
    if (!question) return;

    // Push the question immediately
    setHistory((h) => [...h, { question, response: null }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/get_response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          query: question,
          search: searchMode,
        }),
      });
      const json = await res.json();

      setHistory((h) => {
        const copy = [...h];
        copy[copy.length - 1].response = json.status
          ? json.answer
          : `**Error:** ${json.message}`;
        return copy;
      });
    } catch (err: any) {
      setHistory((h) => {
        const copy = [...h];
        copy[copy.length - 1].response = `**Error:** ${err.message}`;
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle enter → send
  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50">
      <Header />

      <main className="max-w-3xl mx-auto pt-24 pb-8 px-4 flex flex-col h-[calc(100vh-6rem)]">
        <h1 className="text-2xl font-bold mb-4 text-center">AI Trend Shopper</h1>

        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Chat history */}
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-4 space-y-6 bg-white"
          >
            {history.map((entry, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-start space-x-2">
                  <FaUser className="text-blue-600 mt-1" size={20} />
                  <div className="bg-blue-100 text-blue-900 p-3 rounded-lg max-w-[75%] whitespace-pre-wrap">
                    {entry.question}
                  </div>
                </div>
                {entry.response && (
                  <div className="flex items-start space-x-2 ml-10">
                    <FaRobot className="text-gray-600 mt-1" size={20} />
                    <div className="bg-gray-100 text-gray-900 p-3 rounded-lg shadow max-w-[75%] prose prose-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {entry.response}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input & controls */}
          <div className="border-t p-4 flex items-center space-x-2">
            {/* Search toggle */}
            <button
              onClick={() => setSearchMode((sm) => !sm)}
              title={searchMode ? "Search ON" : "Search OFF"}
              className={`p-2 rounded-lg border ${
                searchMode
                  ? "border-indigo-600 bg-indigo-100 text-indigo-600"
                  : "border-gray-300 text-gray-500"
              }`}
            >
              <FaSearch size={18} />
            </button>

            {/* Textarea */}
            <textarea
              className="flex-1 p-3 border rounded-lg focus:ring focus:ring-indigo-200 resize-none h-16"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
            />

            {/* Send button */}
            <Button
              onClick={sendMessage}
              disabled={loading}
              variant="gradient"
            >
              <FaPaperPlane />
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Chatbot;
