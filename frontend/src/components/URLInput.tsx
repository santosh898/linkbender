import React from 'react';
import { Search, Settings } from 'lucide-react';
import { CustomPreferences } from '../types';

interface URLInputProps {
  url: string;
  loading: boolean;
  showCustomize: boolean;
  preferences: CustomPreferences;
  onUrlChange: (url: string) => void;
  onAnalyze: () => void;
  onToggleCustomize: () => void;
  onPreferencesChange: (preferences: CustomPreferences) => void;
}

export const URLInput: React.FC<URLInputProps> = ({
  url,
  loading,
  showCustomize,
  preferences,
  onUrlChange,
  onAnalyze,
  onToggleCustomize,
  onPreferencesChange,
}) => (
  <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
    <div className="flex gap-4 mb-4">
      <input
        type="url"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="Enter URL to analyze..."
        className="flex-1 px-4 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
      />
      <button
        onClick={onAnalyze}
        disabled={loading || !url}
        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
        ) : (
          <>
            <Search size={20} />
            Analyze
          </>
        )}
      </button>
    </div>

    <button
      onClick={onToggleCustomize}
      className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
    >
      <Settings size={16} />
      {showCustomize ? 'Hide' : 'Show'} Advanced Options
    </button>

    {showCustomize && (
      <div className="mt-4 p-4 bg-gray-700 rounded-md">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Summary Length</label>
            <select
              value={preferences.length}
              onChange={(e) => onPreferencesChange({ ...preferences, length: e.target.value as CustomPreferences['length'] })}
              className="w-full bg-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Style</label>
            <select
              value={preferences.style}
              onChange={(e) => onPreferencesChange({ ...preferences, style: e.target.value as CustomPreferences['style'] })}
              className="w-full bg-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bullet_points">Bullet Points</option>
              <option value="conversational">Conversational</option>
              <option value="technical">Technical</option>
            </select>
          </div>
        </div>
      </div>
    )}
  </div>
);