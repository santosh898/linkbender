import { useSuspenseQuery } from "@tanstack/react-query";

const BACKEND_URL = process.env.VITE_BACKEND_URL;

interface Result {
  url: string;
  summary: string;
  tags: string[];
  timestamp: string;
  content: string;
}

interface Response {
  status: string;
  results: Result[];
  count: number;
  searched_tags: string[];
  related_tags: string[];
}

export const useTagFeed = (tags: string[]) => {
  return useSuspenseQuery({
    queryKey: ["tag-feed", ...tags],
    queryFn: async () => {
      const response = await fetch(
        `${BACKEND_URL}/search-by-tags?tags=${tags.join(",")}`
      );
      const data = (await response.json()) as Response;

      return data.results;
    },
  });
};
