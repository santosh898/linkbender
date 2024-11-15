import { useState, useCallback } from 'react';

function App() {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [input, setInput] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // STEP 1: URL CHECK FUNCTION
  const checkUrl = async (url) => {
    try {
      const response = await fetch(`http://localhost:8000/check-url?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('Failed to check URL');
      const data = await response.json();
      console.log('URL Check Response:', data); // Debug log
      return data;
    } catch (error) {
      throw new Error(`URL check failed: ${error.message}`);
    }
  };

  // STEP 2A: GET CACHED DATA
  const getCachedData = async (url) => {
    try {
      const response = await fetch(`http://localhost:8000/get-cached?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('Failed to get cached data');
      const data = await response.json();
      console.log('Cached Data:', data); // Debug log
      return data;
    } catch (error) {
      throw new Error(`Cache retrieval failed: ${error.message}`);
    }
  };

  // STEP 2B: SCRAPE NEW URL
  const scrapeNewUrl = async (url) => {
    try {
      const response = await fetch(`http://localhost:8000/scrape?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      console.log('Scrape response:', data); // Debug log

      if (!response.ok || data.status === 'error') {
        throw new Error(data.error || 'Failed to scrape URL');
      }
      
      return data;
    } catch (error) {
      console.error('Scraping error:', error);
      if (error.response) {
        const errorData = await error.response.json();
        throw new Error(errorData.error || 'Failed to scrape URL');
      }
      throw error;
    }
  };

  // STEP 3: SEARCH FUNCTION
  const searchByTags = async (tags) => {
    try {
      const response = await fetch(`http://localhost:8000/search-by-tags?tags=${encodeURIComponent(tags)}`);
      if (!response.ok) throw new Error('Failed to search tags');
      const data = await response.json();
      console.log('Search Results:', data); // Debug log
      return data;
    } catch (error) {
      throw new Error(`Tag search failed: ${error.message}`);
    }
  };

  // MAIN SUBMISSION HANDLER
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      if (isSearchMode) {
        console.log('Starting search for tags:', trimmedInput);
        const searchData = await searchByTags(trimmedInput);
        
        setResults({
          searchResults: searchData.results.map(result => ({
            id: result._id,
            url: result.url,
            summary: result.summary,
            grade: result.grade,
            badge: result.badge,
            tags: result.tags,
            timestamp: result.timestamp
          })),
          count: searchData.results.length,
          isSearch: true
        });
      } else {
        // SCRAPE MODE FLOW
        console.log('Starting scrape for URL:', trimmedInput);
        
        try {
          new URL(trimmedInput);
        } catch {
          throw new Error('Please enter a valid URL');
        }

        // Check if URL exists
        console.log('Checking URL existence...');
        const urlCheck = await checkUrl(trimmedInput);
        
        // Get data based on URL check
        console.log('URL exists:', urlCheck.exists);
        let data;
        try {
          data = urlCheck.exists 
            ? await getCachedData(trimmedInput)
            : await scrapeNewUrl(trimmedInput);
          
          console.log('Processing final data:', data);
          
          setResults({
            url: trimmedInput,
            summary: data.response.summary,
            grade: data.response.grade,
            badge: data.response.badge,
            tags: data.response.tags,
            is_duplicate: urlCheck.exists,
            message: data.message,
            isSearch: false
          });
        } catch (scrapeError) {
          console.error('Scraping/Cache error:', scrapeError);
          throw new Error(`Failed to process URL: ${scrapeError.message}`);
        }
      }
    } catch (err) {
      console.error('Error in submission:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [input, isSearchMode]);

  // MODE SWITCH HANDLER
  const handleModeChange = useCallback((checked) => {
    console.log('Switching mode to:', checked ? 'Search' : 'Scrape');
    setIsSearchMode(checked);
    setInput('');
    setResults(null);
    setError(null);
  }, []);

  // INPUT CHANGE HANDLER
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
    setError(null);
  }, []);

  // Add a new handler function near your other handlers
  const handleTagClick = useCallback((tag) => {
    setIsSearchMode(true);  // Switch to search mode
    setInput(tag);         // Set the tag as input
    handleSubmit(new Event('submit')); // Trigger search
  }, [handleSubmit]);

  // Update the tag display in both search results and scrape results
  const TagDisplay = ({ tag }) => (
    <span 
      key={tag} 
      className="relative mr-2 mb-2 inline-block cursor-pointer" 
      onClick={() => handleTagClick(tag)}
      title={`Click to search for #${tag}`}
    >
      <span className="absolute top-0 left-0 mt-1 ml-1 h-full w-full rounded bg-gray-700"></span>
      <span className="fold-bold relative inline-block h-full w-full rounded border-2 
                     border-black bg-black px-3 py-1 text-base font-bold text-white 
                     transition duration-100 hover:bg-gray-900 hover:text-yellow-500">
        #{tag}
      </span>
    </span>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Mode Toggle */}
      <div className="mb-8 text-center">
        <div className="flex flex-col items-center">
          <label className="relative inline-block cursor-pointer mb-2">
            <input 
              type="checkbox" 
              checked={isSearchMode}
              onChange={(e) => handleModeChange(e.target.checked)}
              className="sr-only" 
            />
            <div className="relative">
              <span className="absolute top-0 left-0 mt-0.5 ml-0.5 h-full w-full rounded-full bg-gray-700"></span>
              <div className="relative h-8 w-16 rounded-full border-2 border-black bg-white transition-colors duration-200 ease-in-out">
                <div className={`absolute top-1 ${isSearchMode ? 'left-8' : 'left-1'} h-5 w-5 rounded-full border-2 border-black bg-black transition-all duration-200 ease-in-out`}></div>
              </div>
            </div>
          </label>
          <span className="text-sm font-bold text-white">
            {isSearchMode ? 'Search Mode' : 'Scrape Mode'}
          </span>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isSearchMode ? 'Enter tags to search' : 'Enter URL to scrape'}
            className="flex-1 px-4 py-3 bg-white text-black 
                     border-2 border-black rounded 
                     placeholder-gray-600 font-medium"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="relative"
          >
            <span className="absolute top-0 left-0 mt-1 ml-1 h-full w-full rounded bg-gray-700"></span>
            <span className={`fold-bold relative inline-block h-full w-full rounded border-2 
                           border-black bg-black px-8 py-3 text-base font-bold text-white 
                           transition duration-100 hover:bg-gray-900 hover:text-yellow-500
                           ${(loading || !input.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center gap-2 justify-center">
                  <div className="relative w-4 h-4">
                    <div className="absolute top-0 left-0 mt-0.5 ml-0.5 h-full w-full rounded-full bg-gray-700"></div>
                    <div className="relative w-full h-full border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  Processing...
                </div>
              ) : (
                isSearchMode ? 'Search' : 'Scrape'
              )}
            </span>
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 border-2 border-red-500 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Results Display */}
      {results && !loading && (
        <div className="mt-8">
          {results.isSearch ? (
            // Search Results Display
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-black">
                  Found {results.searchResults.length} results
                </h3>
                {results.searchResults.map((result) => (
                  <div key={result.id} className="mb-4 p-4 bg-white rounded border-2 border-black">
                    <h4 className="font-bold text-black">{result.url}</h4>
                    <p className="text-gray-700">{result.summary}</p>
                    <div className="mt-2">
                      <span className="font-bold text-black mr-4">Grade: {result.grade}</span>
                      <span className="font-bold text-black">Badge: {result.badge}</span>
                    </div>
                    <div className="mt-2">
                      {result.tags.map((tag) => (
                        <TagDisplay key={tag} tag={tag} />
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Added: {new Date(result.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Scrape Results Display
            <div className="p-4 bg-white rounded border-2 border-black">
              <h3 className="font-bold text-black">{results.url}</h3>
              <p className="text-gray-700 mt-2">{results.summary}</p>
              {(results.grade || results.badge) && (
                <div className="mt-2">
                  <span className="font-bold text-black mr-4">Grade: {results.grade}</span>
                  <span className="font-bold text-black">Badge: {results.badge}</span>
                </div>
              )}
              <div className="mt-2">
                {results.tags.map((tag) => (
                  <TagDisplay key={tag} tag={tag} />
                ))}
              </div>
              {results.is_duplicate && (
                <div className="mt-2 text-gray-600">
                  (Retrieved from cache)
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;