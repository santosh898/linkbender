import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { FeedItem, FeedConfig } from '../types';
import { DynamicFeed } from './DynamicFeed';

const BACKEND_URL = process.env.VITE_BACKEND_URL;
const STORAGE_KEY = 'linkbender_feeds';

const defaultFeeds: FeedConfig[] = [
  { id: '1', name: 'Recent', sortBy: 'recent', selectedTags: [], items: [] },
  { id: '2', name: 'High Grade', sortBy: 'grade', selectedTags: [], items: [] },
];

export const URLFeed: React.FC = () => {
  const [feeds, setFeeds] = useState<FeedConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultFeeds;
  });
  const [draggedItem, setDraggedItem] = useState<FeedItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feeds));
  }, [feeds]);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/scrapes`);
      const data = await response.json();
      
      setFeeds(feeds.map(feed => ({
        ...feed,
        items: data.scrapes || []
      })));
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const handleConfigChange = (feedId: string, newConfig: FeedConfig) => {
    setFeeds(feeds.map(feed => 
      feed.id === feedId ? newConfig : feed
    ));
  };

  const handleDragStart = (item: FeedItem) => {
    setDraggedItem(item);
  };

  const handleDrop = (feedId: string) => {
    if (!draggedItem) return;

    setFeeds(feeds.map(feed => {
      if (feed.id === feedId) {
        return {
          ...feed,
          items: [...feed.items, draggedItem]
        };
      }
      return {
        ...feed,
        items: feed.items.filter(item => item.url !== draggedItem.url)
      };
    }));

    setDraggedItem(null);
  };

  const handleAddFeed = () => {
    if (feeds.length >= 4) return;
    
    const newFeed: FeedConfig = {
      id: Date.now().toString(),
      name: `Feed ${feeds.length + 1}`,
      sortBy: 'recent',
      selectedTags: [],
      items: []
    };
    
    setFeeds([...feeds, newFeed]);
  };

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Dynamic Feeds</h2>
        {feeds.length < 4 && (
          <button
            onClick={handleAddFeed}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} />
            Add Feed
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {feeds.map(feed => (
          <DynamicFeed
            key={feed.id}
            config={feed}
            onConfigChange={(newConfig) => handleConfigChange(feed.id, newConfig)}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
};
