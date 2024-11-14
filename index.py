# fast api server with a get endpoint to take a link and scrape the text from the page

from fastapi import FastAPI
import requests
from bs4 import BeautifulSoup
from tinydb import TinyDB
from datetime import datetime
import json

from phi.agent import Agent
from phi.model.ollama import Ollama
from phi.model.openai import OpenAIChat
from phi.embedder.ollama import OllamaEmbedder

from phi.knowledge.json import JSONKnowledgeBase
from phi.vectordb.pgvector import PgVector
from dotenv import load_dotenv
import pymongo
from pymongo import MongoClient
from urllib.parse import quote_plus


load_dotenv()

# knowledge_base = JSONKnowledgeBase(
#     path="knowledge",
#     # Table name: ai.json_documents
#     vector_db=PgVector(
#         table_name="scrapes",
#         db_url="postgresql+psycopg://ai:ai@localhost:5532/ai",
#         embedder=OllamaEmbedder(model="mxbai-embed-large",dimensions=1024),
#     ),
# )

# knowledge_base.load(recreate=True, upsert=True)

agent = Agent(
    model = OpenAIChat(id="gpt-4o"),
    # knowledge=knowledge_base,
    show_tool_calls=True,
    markdown=True,
    # debug_mode=True,
)

# When tagging content, please use tags from this predefined list:
#         {chr(10).join(f"- {tag}" for tag in existing_tags)}
        
#         try to assign the most relevant tags from this list. Make up new tags if none of the existing tags fit. Make up tags even if some of the existing tags match. Our Main goal is to have tags that define the content the best.

summary_agent = Agent(
        model = OpenAIChat(id="gpt-4o"),
        show_tool_calls=True,
        structured_output=True,
        instructions=[f"""
        You are a helpful assistant that summarizes text and creates a list of tags that define the content of the text.
        try to assign the most relevant tags. Our Main goal is to have tags that define the content the best.
        
        You MUST respond with a valid JSON object in the following format:
        {{
            "summary": "your summary here",
            "tags": ["tag1", "tag2", "tag3"]
        }}
        
        The response must be pure JSON with no additional text or markdown formatting.
        """],
)

app = FastAPI()
db = TinyDB('scrape_db.json')
scrapes = db.table('scrapes')

# MongoDB connection setup
try:
    # URL encode the credentials
    username = quote_plus("chanakyabevera")
    password = quote_plus("Chanu@07041997")
    cluster = "clusterme.81rw1.mongodb.net"

    # Print the encoded values for verification
    print(f"Encoded username: {username}")
    print(f"Encoded password: {password}")

    connection_string = f"mongodb+srv://{username}:{password}@{cluster}/?retryWrites=true&w=majority"
    
    # Print the connection string (remove this in production)
    print(f"Connection string: {connection_string}")

    # Create MongoDB client
    client = MongoClient(connection_string)
    
    # Test the connection
    client.admin.command('ping')
    print("Successfully connected to MongoDB!")
    
    # Set up database and collection
    db = client['scraping_db']
    collection = db['scrapes']

except Exception as e:
    print(f"MongoDB Connection Error: {str(e)}")
    print(f"Error type: {type(e)}")

@app.get("/scrape")
async def scrape(link: str):
    try:
        print("1. Starting scrape request for:", link)
        
        # Add headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        print("2. Sending request to URL...")
        # Add headers to the request
        response = requests.get(link, headers=headers)
        response.raise_for_status()
        
        print("3. Parsing HTML content...")
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract all text while removing script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
            
        # Get text and clean it up
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        text = ' '.join(line for line in lines if line)
        
        print("4. Getting summary from agent...")
        agent_response = summary_agent.run(text)
        
        print("5. Processing agent response...")
        print("Raw response:", agent_response)
        print("Response type:", type(agent_response))
        print("Response content:", agent_response.content)
        print("Content type:", type(agent_response.content))
        
        # Handle the response based on its type
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
            
            print("6. Parsed response:", response_dict)
            
            # Store in MongoDB Atlas
            mongo_doc = {
                'url': link,
                'summary': response_dict['summary'],
                'tags': response_dict['tags'],
                'timestamp': datetime.now(),
                'content': text[:1000]  # Store first 1000 chars to save space
            }
            collection.insert_one(mongo_doc)
            
            return {
                "text": text[:500] + "...",  # Return only first 500 chars of text for brevity
                "status": "success",
                "response": response_dict
            }
            
        except json.JSONDecodeError as e:
            print("JSON Parse Error:", str(e))
            print("Failed to parse content:", agent_response.content)
            return {"error": "Failed to parse agent response", "status": "error"}
            
    except Exception as e:
        print("Error occurred:", str(e))
        return {"error": str(e), "status": "error"}
    
# Update the get_scrapes endpoint to use MongoDB
@app.get("/scrapes")
async def get_scrapes():
    scrapes_list = list(collection.find({}, {'_id': 0}))  # Exclude MongoDB _id field
    return {"scrapes": scrapes_list}

@app.post("/ask")
async def ask(question: str):
    response = agent.run(question)
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
