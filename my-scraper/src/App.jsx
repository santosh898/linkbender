import { useState } from 'react';
import './App.css';

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
        // Search by tags
        const response = await fetch(`http://localhost:8000/search-by-tags?tags=${input}`);
        const data = await response.json();
        setResults(data);
      } else {
        // Add new link
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

  console.log(results);

  return (
    <div className="container">
      <h1>Web Scraper</h1>
      
      <div className="toggle-container">
        <button 
          onClick={() => setIsSearchMode(!isSearchMode)}
          className="toggle-button"
        >
          {isSearchMode ? 'Switch to Add Mode' : 'Switch to Search Mode'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isSearchMode ? 'Enter tags (comma-separated)' : 'Enter URL to scrape'}
          className="search-input"
        />
        <button type="submit" className="submit-button">
          {loading ? 'Loading...' : (isSearchMode ? 'Search' : 'Scrape')}
        </button>
      </form>

      {results && (
        <div className="results">
          {isSearchMode ? (
            // Display search results
            <div>
              <h2>Search Results ({results.count})</h2>
              {results.results?.map((item, index) => (
                <div key={index} className="result-card">
                  <h3><a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a></h3>
                  <p>{item.summary}</p>
                  <div className="tags">
                    {item.tags.map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Display scrape results
            <div className="result-card">
              <h3>Scrape Result</h3>
              <p>{results.response?.summary}</p>
              <div className="tags">
                {results.response?.tags.map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;