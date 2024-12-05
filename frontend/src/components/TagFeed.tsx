import { useTagFeed } from "../queries/useFeed";

const TagFeed = ({ activeTags }: { activeTags: string[] }) => {
  const { data: feedData } = useTagFeed(activeTags);

  return (
    <div>
      {feedData.map((item, index) => (
        <div key={index} className="bg-gray-700 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-2">{item.url}</h3>
          <p>{item.summary}</p>
        </div>
      ))}
    </div>
  );
};

export default TagFeed;
