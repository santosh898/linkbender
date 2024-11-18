import React from 'react';
import { Tag, Award } from 'lucide-react';
import { FeedItem } from '../types';

interface KanbanColumnProps {
  title: string;
  items: FeedItem[];
  onTagClick: (tag: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, items, onTagClick }) => (
  <div className="flex-1 min-w-[350px] bg-gray-800/50 rounded-lg p-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <span className="px-2 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
        {items.length}
      </span>
    </div>

    <div className="space-y-4 h-[calc(100vh-250px)] overflow-y-auto">
      {items.map((item, index) => (
        <div key={index} className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              {new URL(item.url).hostname}
            </a>
            {item.badge && (
              <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs">
                <Award size={12} />
                {item.badge}
              </span>
            )}
          </div>
          
          <p className="text-gray-300 text-sm mb-3 line-clamp-3">{item.summary}</p>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag, tagIndex) => (
                  <button
                    key={tagIndex}
                    onClick={() => onTagClick(tag)}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-gray-300 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-gray-400">
              Grade: {item.grade}/10
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);