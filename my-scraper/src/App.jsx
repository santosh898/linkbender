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
      if (!response.ok) throw new Error('Failed to scrape URL');
      const data = await response.json();
      console.log('Scraped Data:', data); // Debug log
      return data;
    } catch (error) {
      throw new Error(`Scraping failed: ${error.message}`);
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      if (isSearchMode) {
        // SEARCH MODE FLOW
        console.log('Starting search for tags:', trimmedInput);
        const searchData = await searchByTags(trimmedInput);
        
        // Map the DB structure directly to results
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
        
        // 1. Validate URL format
        try {
          new URL(trimmedInput);
        } catch {
          throw new Error('Please enter a valid URL');
        }

        // 2. Check if URL exists
        console.log('Checking URL existence...');
        const urlCheck = await checkUrl(trimmedInput);
        
        // 3. Get data based on URL check
        console.log('URL exists:', urlCheck.exists);
        const data = urlCheck.exists 
          ? await getCachedData(trimmedInput)
          : await scrapeNewUrl(trimmedInput);

        // 4. Process and set results
        console.log('Processing final data:', data);
        setResults({
          url: trimmedInput,
          summary: data.response.summary,
          grade: data.response.grade,
          tags: data.response.tags,
          is_duplicate: urlCheck.exists,
          message: data.message,
          isSearch: false
        });
      }
    } catch (err) {
      console.error('Error in submission:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
            onChange={handleInputChange}
            placeholder={isSearchMode ? 'Enter tags to search' : 'Enter URL to scrape'}
            className="flex-1 px-4 py-3 bg-white text-black 
                     border-2 border-black rounded 
                     placeholder-gray-600 font-medium"
          />
          <button  
            type="submit" 
            className="relative inline-block w-full rounded border-2 border-black bg-black px-8 py-3 
                     text-base font-bold text-white transition duration-100 
                     hover:bg-gray-900 hover:text-yellow-500 disabled:opacity-50 
                     disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white"
            disabled={loading || !input.trim()}
          >
            {loading ? 'Processing...' : (isSearchMode ? 'Search' : 'Scrape')}
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
                <h3 className="text-lg font-bold">
                  Found {results.searchResults.length} results
                </h3>
                {results.searchResults.map((result) => (
                  <div key={result.id} className="mb-4 p-4 bg-white rounded border-2 border-black">
                    <h4 className="font-bold">{result.url}</h4>
                    <p className="text-gray-700">{result.summary}</p>
                    <div className="mt-2">
                      <span className="font-bold mr-4">Grade: {result.grade}</span>
                      <span className="font-bold">Badge: {result.badge}</span>
                    </div>
                    <div className="mt-2">
                      {result.tags.map((tag, i) => (
                        <span key={i} className="mr-2 px-2 py-1 bg-gray-200 rounded">
                          #{tag}
                        </span>
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
              <h3 className="font-bold">{results.url}</h3>
              <p className="text-gray-700 mt-2">{results.summary}</p>
              {results.grade && (
                <div className="mt-2">
                  <span className="font-bold">Grade: {results.grade}</span>
                </div>
              )}
              <div className="mt-2">
                {results.tags.map((tag, i) => (
                  <span key={i} className="mr-2 px-2 py-1 bg-gray-200 rounded">
                    #{tag}
                  </span>
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