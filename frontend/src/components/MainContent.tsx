import React from "react";
import { URLInput } from "./URLInput";
import { ChatInterface } from "./ChatInterface";
import { ScrapeResult, CustomPreferences } from "../types";
import { AlertCircle } from "lucide-react";

interface MainContentProps {
  activeTab: "analyze" | "talk" | "feed";
  url: string;
  loading: boolean;
  showCustomize: boolean;
  preferences: CustomPreferences;
  result: ScrapeResult | null;
  error: string;
  onUrlChange: (url: string) => void;
  onAnalyze: (customSummary: boolean) => void;
  onToggleCustomize: () => void;
  onPreferencesChange: (preferences: CustomPreferences) => void;
  onSendMessage: (message: string) => Promise<string>;
}

const MainContent: React.FC<MainContentProps> = ({
  activeTab,
  url,
  loading,
  showCustomize,
  preferences,
  result,
  error,
  onUrlChange,
  onAnalyze,
  onToggleCustomize,
  onPreferencesChange,
  onSendMessage,
}) => {
  return (
    <div className="max-w-3xl mx-auto h-full">
      {activeTab === "analyze" && (
        <>
          <URLInput
            url={url}
            loading={loading}
            showCustomize={showCustomize}
            preferences={preferences}
            onUrlChange={onUrlChange}
            onAnalyze={() => onAnalyze(showCustomize)}
            onToggleCustomize={onToggleCustomize}
            onPreferencesChange={onPreferencesChange}
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
        </>
      )}

      {activeTab === "talk" && <ChatInterface onSendMessage={onSendMessage} />}

      {activeTab === "feed" && (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Feed Section</h2>
          <p className="text-gray-300">
            This is where the feed content will go.
          </p>
        </div>
      )}
    </div>
  );
};

export default MainContent;
