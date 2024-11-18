import React, { useState, useEffect } from "react";
import { Tag, Award, Filter } from "lucide-react";
import { FeedItem, TagGroup, PopularTag } from "../types";
import { KanbanColumn } from "./KanbanColumn";

const BACKEND_URL = process.env.VITE_BACKEND_URL;

export const URLFeed: React.FC = () => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<number | null>(null);

  useEffect(() => {
    fetchFeed();
    fetchPopularTags();
  }, [selectedTag]);

  useEffect(() => {
    if (feed.length > 0) {
      organizeByTags();
    }
  }, [feed, gradeFilter]);

  const fetchFeed = async () => {
    try {
      const endpoint = selectedTag
        ? `${BACKEND_URL}/search-by-tags?tags=${selectedTag}`
        : `${BACKEND_URL}/scrapes`;
      const response = await fetch(endpoint);
      const data = await response.json();
      setFeed(data.scrapes || data.results || []);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    }
  };

  const fetchPopularTags = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/tags`);
      const data = await response.json();
      setPopularTags(
        data.tags
          .sort((a: PopularTag, b: PopularTag) => b.count - a.count)
          .slice(0, 10)
      );
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const organizeByTags = () => {
    const groups = new Map<string, FeedItem[]>();

    feed.forEach((item) => {
      if (gradeFilter && parseInt(item.grade) < gradeFilter) {
        return;
      }

      item.tags.forEach((tag) => {
        if (!groups.has(tag)) {
          groups.set(tag, []);
        }
        groups.get(tag)?.push(item);
      });
    });

    const sortedGroups: TagGroup[] = Array.from(groups.entries())
      .map(([name, items]) => ({
        name,
        items,
        count: items.length,
      }))
      .sort((a, b) => b.count - a.count);

    setTagGroups(sortedGroups);
  };

  return (
    <div className="mt-12">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Content Feed</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Filter size={16} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Grade
                </label>
                <select
                  value={gradeFilter || ""}
                  onChange={(e) =>
                    setGradeFilter(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full bg-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Grade</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}+ / 10
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Popular Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {popularTags.slice(0, 5).map((tag) => (
                    <button
                      key={tag.name}
                      onClick={() =>
                        setSelectedTag(
                          selectedTag === tag.name ? null : tag.name
                        )
                      }
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedTag === tag.name
                          ? "bg-blue-500 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6">
        {tagGroups.map((group) => (
          <KanbanColumn
            key={group.name}
            title={`${group.name} (${group.count})`}
            items={group.items}
            onTagClick={setSelectedTag}
          />
        ))}
      </div>
    </div>
  );
};
