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

# Simplified agent setup
summary_agent = Agent(
    model=xAI(id="grok-beta"),
    show_tool_calls=True,
    structured_output=True,
    instructions=["""
    Summarize the text and create relevant tags. Respond with JSON:
    {
        "summary": "your summary here",
        "tags": ["tag1", "tag2", "tag3"]
    }
    """]
)

app = FastAPI()

# MongoDB setup
username = quote_plus("chanakyabevera")
password = quote_plus("Chanu@07041997")
connection_string = f"mongodb+srv://{username}:{password}@clusterme.81rw1.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(connection_string)
db = client['scraping_db']
collection = db['scrapes']

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
        response_data = agent_response.content if isinstance(agent_response.content, dict) else json.loads(agent_response.content)
        
        # Store in MongoDB
        mongo_doc = {
            'url': link,
            'summary': response_data['summary'],
            'tags': response_data['tags'],
            'timestamp': datetime.now(),
            'content': text[:1000]
        }
        collection.insert_one(mongo_doc)
        
        return {
            "text": text[:500],
            "status": "success",
            "response": response_data
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
