import React from "react";

interface TabNavigationProps {
  activeTab: "analyze" | "talk" | "feed";
  onTabChange: (tab: "analyze" | "talk" | "feed") => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="mb-4 flex justify-center space-x-4">
      <button
        onClick={() => onTabChange("analyze")}
        className={`px-4 py-2 rounded-lg ${
          activeTab === "analyze" ? "bg-blue-500" : "bg-gray-700"
        } transition-colors`}
      >
        Analyze
      </button>
      <button
        onClick={() => onTabChange("talk")}
        className={`px-4 py-2 rounded-lg ${
          activeTab === "talk" ? "bg-blue-500" : "bg-gray-700"
        } transition-colors`}
      >
        Talk
      </button>
      <button
        onClick={() => onTabChange("feed")}
        className={`px-4 py-2 rounded-lg ${
          activeTab === "feed" ? "bg-blue-500" : "bg-gray-700"
        } transition-colors`}
      >
        Feed
      </button>
    </div>
  );
};

export default TabNavigation;
