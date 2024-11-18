export interface ScrapeResult {
  text: string;
  status: string;
  response: {
    summary: string;
    tags: string[];
    grade: string;
    badge: string;
  };
}

export interface CustomPreferences {
  length: 'short' | 'medium' | 'detailed';
  style: 'bullet_points' | 'conversational' | 'technical';
}

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

export interface FeedItem {
  url: string;
  summary: string;
  tags: string[];
  grade: string;
  badge: 'gold' | 'silver' | 'bronze';
  timestamp: string;
  content?: string;
  preferences?: {
    length: 'short' | 'medium' | 'detailed';
    style: 'bullet_points' | 'conversational' | 'technical' | 'tenglish';
  };
}

export interface TagGroup {
  name: string;
  items: FeedItem[];
  count: number;
}

export interface PopularTag {
  name: string;
  count: number;
}

export interface FeedConfig {
  id: string;
  name: string;
  sortBy: 'tags' | 'grade' | 'recent';
  selectedTags: string[];
  items: FeedItem[];
  preferences?: {
    showContent: boolean;
    showPreferences: boolean;
    maxItems?: number;
  };
}

export interface DynamicFeedProps {
  config: FeedConfig;
  onConfigChange: (config: FeedConfig) => void;
  onDragStart: (item: FeedItem) => void;
  onDrop: (feedId: string) => void;
}