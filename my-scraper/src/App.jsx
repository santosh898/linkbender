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
        // First, check if URL exists
        const checkResponse = await fetch(`http://localhost:8000/check-url?url=${encodeURIComponent(input)}`);
        const checkData = await checkResponse.json();

        if (checkData.exists) {
          // If URL exists, fetch the cached data
          const response = await fetch(`http://localhost:8000/get-cached?url=${encodeURIComponent(input)}`);
          const data = await response.json();
          setResults({
            ...data,
            is_duplicate: true,
            message: checkData.message
          });
        } else {
          // If URL doesn't exist, proceed with scraping
          const response = await fetch(`http://localhost:8000/scrape?link=${encodeURIComponent(input)}`);
          const data = await response.json();
          setResults({
            ...data,
            is_duplicate: false
          });
        }
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
        <h1 className="bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] inline-block text-transparent bg-clip-text text-6xl font-bold mb-12 text-center">
          Neural Scraper
        </h1>
        
        <div className="mb-8 text-center">
          <div className="flex flex-col items-center">
            <label className="relative mb-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isSearchMode}
                onChange={(e) => setIsSearchMode(e.target.checked)}
                className="peer sr-only" 
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-900 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-[#FF44EC] after:bg-gray-900 after:transition-all after:content-[''] peer-checked:bg-gradient-to-r peer-checked:from-[#44BCFF] peer-checked:via-[#FF44EC] peer-checked:to-[#FF675E] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
            </label>
            <span className="text-xs bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] inline-block text-transparent bg-clip-text font-medium">
              {isSearchMode ? 'Search Mode' : 'Scrape Mode'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isSearchMode ? 'Enter tags to search' : 'Enter URL to scrape'}
              className="flex-1 px-4 py-3 bg-gray-900 text-white 
                       border-2 border-[#FF44EC]/50 focus:border-[#FF44EC] 
                       placeholder-white/50 rounded-none"
            />
            <div className="relative inline-flex group">
              <div className="absolute transitiona-all duration-1000 opacity-70 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200 animate-tilt">
              </div>
              <button  
                type="submit" 
                className="relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !input.trim()}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing... 
                  </div>
                ) : (
                  isSearchMode ? 'Search' : 'Scrape'
                )}
              </button>
            </div>
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
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] inline-block text-transparent bg-clip-text mb-4">
                  Search Results ({results.count})
                </h2>
                {results.results?.map((item, index) => (
                  <div key={index} className="cyber-box p-6 mb-4 bg-gray-900 relative">
                    <div className="absolute transitiona-all duration-1000 opacity-30 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg">
                    </div>
                    <div className="relative">
                      <h3 className="text-xl mb-2 flex items-center gap-2">
                        <a href={item.url} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-[#44BCFF] hover:text-[#FF44EC] transition-colors">
                          {item.url}
                        </a>
                        {item.grade && (
                          <span className="px-2 py-0.5 text-sm rounded bg-[#44BCFF]/10 text-[#44BCFF] border border-[#44BCFF]/30 ml-auto">
                            Grade: {item.grade}
                          </span>
                        )}
                      </h3>
                      <p className="text-white/80 mb-4">{item.summary}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, i) => (
                          <span key={i} className="px-3 py-1 rounded-full text-sm 
                                               bg-[#FF44EC]/10 text-[#FF44EC] 
                                               border border-[#FF44EC]/30">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cyber-box p-6 bg-gray-900 relative">
                <div className="absolute transitiona-all duration-1000 opacity-30 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg">
                </div>
                <div className="relative">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] inline-block text-transparent bg-clip-text">
                      {results.is_duplicate ? 'Cached Result' : 'Scrape Result'}
                    </span>
                    {results.response?.grade && (
                      <span className="px-2 py-0.5 text-sm rounded bg-[#44BCFF]/10 text-[#44BCFF] border border-[#44BCFF]/30 ml-auto">
                        Grade: {results.response.grade}
                      </span>
                    )}
                  </h3>
                  {results.message && (
                    <p className="text-yellow-400 mb-4 italic">
                      {results.message}
                    </p>
                  )}
                  <p className="text-white/80 mb-4">{results.response?.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {results.response?.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-sm 
                                           bg-[#FF44EC]/10 text-[#FF44EC] 
                                           border border-[#FF44EC]/30">
                        #{tag}
                      </span>
                    ))}
                  </div>
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