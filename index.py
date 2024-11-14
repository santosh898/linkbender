# fast api server with a get endpoint to take a link and scrape the text from the page

from fastapi import FastAPI
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json
from phi.agent import Agent
from phi.model.xai import xAI
from pymongo import MongoClient
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

# Store tags globally for now
saved_tags = set(["AI", "machine learning", "technology"])

def get_saved_tags():
    """Returns a list of all unique tags that have been saved from previous scrapes.
    
    Returns:
        list[str]: A sorted list of unique tags previously extracted from scraped content.
        
    Example:
        >>> get_saved_tags()
        ['AI', 'machine learning', 'technology']
    """
    return json.dumps(sorted(list(saved_tags)))

def update_saved_tags(new_tags: list[str]) -> None:
    """Updates the global set of tags with new tags from a scrape.
    
    Args:
        new_tags (list[str]): A list of new tags to add to the global tags set.
        
    Example:
        >>> update_saved_tags(['AI', 'neural networks'])
        # Adds 'AI' and 'neural networks' to the tags set
    """
    saved_tags.update(new_tags)
    
summary_agent = Agent(
    name="summary_agent",
    model=xAI(id="grok-beta"),
    show_tool_calls=True,
    tools=[get_saved_tags],
    instructions=["""
    You will receive a text to analyze.
    
    STEP 1: Get the current tags using get_saved_tags()
    STEP 2: For EACH existing tag returned by get_saved_tags(), check if it's relevant to the content and use it in the return value
    STEP 3: Add any new tags needed to fully categorize the content. These tags will be reused in the future. Be thorough.
    
    IMPORTANT: You MUST include ALL relevant existing tags before adding new ones. YOU WILL BE REWARDED IF YOU DO THIS.
    
    Respond with JSON:
    {
        "summary": "your summary here",
        "tags": ["tag1", "tag2", "tag3"]
    }
    """]
)

# MongoDB setup
username = quote_plus("chanakyabevera")
password = quote_plus("Chanu@07041997")
connection_string = f"mongodb+srv://{username}:{password}@clusterme.81rw1.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(connection_string, connect=False)
db = client['scraping_db']
collection = db['scrapes']

app = FastAPI()

@app.get("/scrape")
async def scrape(link: str):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(link, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        for script in soup(["script", "style"]):
            script.decompose()
            
        text = ' '.join(line.strip() for line in soup.get_text().splitlines() if line.strip())
        
        # Simplified agent response handling
        agent_response = summary_agent.run(text)
        try:
            if isinstance(agent_response.content, dict):
                response_dict = agent_response.content
            elif isinstance(agent_response.content, str):
                # Remove any potential markdown formatting or extra whitespace
                cleaned_content = agent_response.content.strip()
                if cleaned_content.startswith('```json'):
                    # Remove markdown code blocks if present
                    cleaned_content = cleaned_content.replace('```json', '').replace('```', '').strip()
                response_dict = json.loads(cleaned_content)
            else:
                raise ValueError(f"Unexpected response type: {type(agent_response.content)}")
        except Exception as e:
            return {"error": str(e), "status": "error"}
        
        print(agent_response)
        
        try:
                    # Store in MongoDB
            mongo_doc = {
                'url': link,
                'summary': response_dict['summary'],
                'tags': response_dict['tags'],
                'timestamp': datetime.now(),
                'content': text[:1000]
            }
            collection.insert_one(mongo_doc)
        except Exception as e:
            return {
            "text": text[:500],
            "status": "success",
            "response": response_dict
        }  
        
        return {
            "text": text[:500],
            "status": "success",
            "response": response_dict
        }
            
    except Exception as e:
        return {"error": str(e), "status": "error"}

@app.get("/scrapes")
async def get_scrapes():
    scrapes_list = list(collection.find({}, {'_id': 0}))  # Exclude MongoDB _id field
    return {"scrapes": scrapes_list}

@app.post("/ask")
async def ask(question: str):
    response = summary_agent.run(question)
    return response.content

@app.get("/test-db")
async def test_db():
    try:
        # Try to insert a test document
        test_doc = {
            "test": "connection",
            "timestamp": datetime.now()
        }
        result = collection.insert_one(test_doc)
        
        return {
            "status": "success",
            "message": "Successfully connected to MongoDB",
            "inserted_id": str(result.inserted_id)
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
