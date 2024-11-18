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
  badge: string;
  timestamp: string;
  content?: string;
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