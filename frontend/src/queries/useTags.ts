import { useSuspenseQuery } from "@tanstack/react-query";

const BACKEND_URL = process.env.VITE_BACKEND_URL;

interface Tag {
  count: number;
  created_at: string;
  name: string;
}

export const useTags = () => {
  return useSuspenseQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/tags`);
      const data = await response.json();
      return data as { tags: Tag[] };
    },
  });
};
