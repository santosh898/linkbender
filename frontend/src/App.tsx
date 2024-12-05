import React, { useState } from "react";
import { Header } from "./components/Header";
import TabNavigation from "./components/TabNavigation";
import MainContent from "./components/MainContent";
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
  const [activeTab, setActiveTab] = useState<"analyze" | "talk" | "feed">(
    "analyze"
  );

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
      const response = await fetch(
        `${BACKEND_URL}/talk?query=${encodeURIComponent(message)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
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
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <MainContent
          activeTab={activeTab}
          url={url}
          loading={loading}
          showCustomize={showCustomize}
          preferences={preferences}
          result={result}
          error={error}
          onUrlChange={setUrl}
          onAnalyze={handleScrape}
          onToggleCustomize={() => setShowCustomize(!showCustomize)}
          onPreferencesChange={setPreferences}
          onSendMessage={handleChatMessage}
        />
      </div>
    </div>
  );
}

export default App;
