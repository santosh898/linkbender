import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Header } from "./components/Header";
import { URLInput } from "./components/URLInput";
import { ChatInterface } from "./components/ChatInterface";
import { URLFeed } from "./components/URLFeed";
import { ScrapeResult, CustomPreferences } from "./types";

const BACKEND_URL = process.env.VITE_BACKEND_URL;

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState("");
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CustomPreferences>({
    length: "medium",
    style: "conversational",
  });

  const handleScrape = async (customSummary = false) => {
    setLoading(true);
    setError("");
    try {
      const endpoint = customSummary ? "/custom-summary" : "/scrape";
      const queryParams = customSummary
        ? `?url=${encodeURIComponent(url)}&length=${preferences.length}&style=${
            preferences.style
          }`
        : `?url=${encodeURIComponent(url)}`;

      const response = await fetch(`${BACKEND_URL}${endpoint}${queryParams}`);
      const data = await response.json();

      if (data.status === "error") {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape URL");
    } finally {
      setLoading(false);
    }
  };

  const handleChatMessage = async (message: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: message }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <Header />

        <div className="max-w-3xl mx-auto">
          <URLInput
            url={url}
            loading={loading}
            showCustomize={showCustomize}
            preferences={preferences}
            onUrlChange={setUrl}
            onAnalyze={() => handleScrape(showCustomize)}
            onToggleCustomize={() => setShowCustomize(!showCustomize)}
            onPreferencesChange={setPreferences}
          />

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {result && (
            <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden mb-12">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
                <p className="text-gray-300 leading-relaxed">
                  {result.response.summary}
                </p>
              </div>

              <div className="p-6 border-t border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {result.response.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <URLFeed />
        </div>

        <ChatInterface onSendMessage={handleChatMessage} />
      </div>
    </div>
  );
}

export default App;
