import { useImmer } from "use-immer";

import { useTags } from "../queries/useTags";
import { Suspense } from "react";
import TagFeed from "./TagFeed";
import classNames from "classnames";
import { useLocalStorage } from "@uidotdev/usehooks";
import { current } from "immer";

const Feed = () => {
  const {
    data: { tags },
  } = useTags();

  const [savedTags, setSavedTags] = useLocalStorage<string[]>("feed-tags", []);

  const [activeTags, setActiveTags] = useImmer<string[]>(savedTags);

  const onTagClick = (tag: string) => {
    setActiveTags((tags) => {
      tags.push(tag);
      setSavedTags(current(tags));
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 lg:col-span-1">
        <h2 className="text-xl font-semibold mb-4">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <button
              key={index}
              className={classNames(
                "px-3 py-1 rounded-full text-sm text-gray-300 cursor-pointer hover:bg-gray-600",
                {
                  "bg-slate-900": activeTags.includes(tag.name),
                  "bg-gray-700": !activeTags.includes(tag.name),
                }
              )}
              onClick={() => onTagClick(tag.name)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 lg:col-span-2">
        <Suspense fallback={<div>Loading...</div>}>
          <TagFeed activeTags={activeTags} />
        </Suspense>
      </div>
    </div>
  );
};

export default Feed;
