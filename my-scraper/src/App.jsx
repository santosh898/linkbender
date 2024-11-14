import { useState } from 'react';

function App() {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [input, setInput] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSearchMode) {
        const response = await fetch(`http://localhost:8000/search-by-tags?tags=${input}`);
        const data = await response.json();
        setResults(data);
      } else {
        const response = await fetch(`http://localhost:8000/scrape?link=${input}`);
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error(error);
      setResults({ error: 'An error occurred' });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-green-500 text-6xl font-bold mb-12 text-center">
          Neural Scraper
        </h1>
        
        <div className="mb-8 text-center">
          <button 
            onClick={() => setIsSearchMode(!isSearchMode)}
            className="bg-purple-500 text-white px-6 py-3 rounded hover:bg-purple-600"
          >
            {isSearchMode ? '🔍 Switch to Add Mode' : '🔍 Switch to Search Mode'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isSearchMode ? 'Enter tags to search' : 'Enter URL to scrape'}
              className="flex-1 px-4 py-3 bg-cyber-dark text-cyber-primary 
                       border-2 border-cyber-primary/50 focus:border-cyber-primary 
                       placeholder-cyber-primary/50 rounded-none"
            />
            <button 
              type="submit" 
              className="cyber-button"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isSearchMode ? 'Search' : 'Scrape')}
            </button>
          </div>
        </form>

        {loading && (
          <div className="flex justify-center items-center my-12">
            <div className="w-12 h-12 border-4 border-cyber-primary 
                          border-t-transparent rounded-full animate-spin">
            </div>
          </div>
        )}

        {results && !loading && (
          <div className="mt-8 space-y-4">
            {isSearchMode ? (
              <div>
                <h2 className="text-2xl font-bold text-cyber-secondary mb-4">
                  Search Results ({results.count})
                </h2>
                {results.results?.map((item, index) => (
                  <div key={index} className="cyber-box mb-4">
                    <h3 className="text-xl mb-2">
                      <a href={item.url} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="cyber-link">
                        {item.url}
                      </a>
                    </h3>
                    <p className="text-cyber-primary/80 mb-4">{item.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-sm 
                                               bg-cyber-secondary/20 text-cyber-secondary 
                                               border border-cyber-secondary/30">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cyber-box">
                <h3 className="text-2xl font-bold text-cyber-secondary mb-4">
                  Scrape Result
                </h3>
                <p className="text-cyber-primary/80 mb-4">{results.response?.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {results.response?.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-sm 
                                           bg-cyber-secondary/20 text-cyber-secondary 
                                           border border-cyber-secondary/30">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;