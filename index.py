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

# Simplified agent setup with clearer instructions
summary_agent = Agent(
    model=xAI(id="grok-beta"),
    show_tool_calls=True,
    structured_output=True,
    instructions=["""
    You are a text analysis agent. For any given text, provide a concise summary and relevant tags.
    ONLY respond with a clean JSON object in this exact format:
    {
        "summary": "your 2-3 sentence summary here",
        "tags": ["tag1", "tag2", "tag3"]
    }
    DO NOT include any markdown formatting, code blocks, or additional text.
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
tags_collection = db['tags']

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
        
        # Clean and parse the response
        try:
            # If response is already a dict, use it directly
            if isinstance(agent_response.content, dict):
                response_data = agent_response.content
            else:
                # Clean the string response
                clean_response = (
                    agent_response.content
                    .replace('```json', '')
                    .replace('```', '')
                    .strip()
                )
                response_data = json.loads(clean_response)
            
            # Validate response structure
            if not isinstance(response_data, dict):
                raise ValueError("Response is not a dictionary")
            
            # Ensure required fields with proper types
            response_data = {
                "summary": str(response_data.get("summary", "No summary available")),
                "tags": [str(tag) for tag in response_data.get("tags", ["error"])]
            }
            
            # Before storing in MongoDB, process and update tags
            existing_tags = set(tag['name'] for tag in tags_collection.find())
            new_tags = []
            
            for tag in response_data['tags']:
                tag = tag.lower().strip()  # Normalize tag
                if tag not in existing_tags:
                    # Add new tag to tags collection
                    tags_collection.insert_one({
                        'name': tag,
                        'count': 1,
                        'created_at': datetime.now()
                    })
                    new_tags.append(tag)
                else:
                    # Increment count for existing tag
                    tags_collection.update_one(
                        {'name': tag},
                        {'$inc': {'count': 1}}
                    )
            
            # Store in MongoDB with normalized tags
            mongo_doc = {
                'url': link,
                'summary': response_data['summary'],
                'tags': [tag.lower().strip() for tag in response_data['tags']],
                'timestamp': datetime.now(),
                'content': text[:1000]
            }
            collection.insert_one(mongo_doc)
            
            return {
                "text": text[:500],
                "status": "success",
                "response": response_data,
                "new_tags": new_tags
            }
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Raw response: {agent_response.content}")
            return {
                "text": text[:500],
                "status": "error",
                "error": "Failed to parse agent response",
                "response": {
                    "summary": str(agent_response.content)[:200],
                    "tags": ["error"]
                }
            }
        except Exception as e:
            print(f"Response processing error: {e}")
            return {
                "text": text[:500],
                "status": "error",
                "error": "Failed to process agent response"
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

@app.get("/tags")
async def get_tags():
    tags_list = list(tags_collection.find({}, {'_id': 0}))
    return {"tags": tags_list}
