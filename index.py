# fast api server with a get endpoint to take a link and scrape the text from the page

from fastapi import FastAPI, HTTPException
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json
from phi.agent import Agent
from phi.model.xai import xAI
from pymongo import MongoClient
from urllib.parse import quote_plus, urlparse, urljoin
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import aiohttp

load_dotenv()

summary_agent = Agent(
    model=xAI(id="grok-beta"),
    show_tool_calls=True,
    structured_output=True,
    instructions=["""
            Analyze the following link's content and provide a concise summary, relevant tags, a grade, and an optional badge. 

            For each output:
            1. Give a 2-3 sentence summary of the content.
            2. List tags based on topics covered in the link (e.g., "SEO," "content marketing").
            3. Assign a grade from 1 to 10 based on relevance and content quality.
            4. Optionally, assign a badge ("gold," "platinum," etc.) if the content is of high quality or widely recognized as an industry leader.

            Format the response in a clean JSON object, like this:
            {
                "summary": "A brief summary of the content here.",
                "tags": ["tag1", "tag2"],
                "grade": "1-10",
                "badge": "gold"
            }
    """]
)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
username = quote_plus("chanakyabevera")
password = quote_plus("Chanu@07041997")
connection_string = f"mongodb+srv://{username}:{password}@clusterme.81rw1.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(connection_string,connect=False)
db = client['scraping_db']
collection = db['scrapes']
tags_collection = db['tags']

@app.get("/scrape")
async def scrape(url: str):
    try:
        # Validate URL
        if not url:
            raise HTTPException(status_code=422, detail="URL is required")
            
        # Normalize URL
        parsed_url = urlparse(url)
        if not parsed_url.scheme:
            url = f"https://{url}"
        
        # Check if URL is accessible
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        raise HTTPException(
                            status_code=422, 
                            detail=f"Failed to access URL: {response.status}"
                        )
                    text = await response.text()
        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=f"Failed to fetch URL: {str(e)}"
            )

        # Process the URL and return response
        try:
            # Your existing scraping logic here
            response_data = {
                "summary": "Sample summary",  # Replace with actual scraping
                "tags": ["sample"],           # Replace with actual tags
                "grade": "5",                 # Replace with actual grade
                "badge": "silver"            # Replace with actual badge
            }
            
            # Return successful response
            return {
                "status": "success",
                "response": response_data,
                "text": text[:500],  # First 500 chars of content
                "message": "Successfully scraped URL"
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=f"Failed to process URL content: {str(e)}"
            )
            
    except HTTPException as he:
        return {
            "status": "error",
            "error": str(he.detail),
            "response": {
                "summary": "Error occurred",
                "tags": ["error"],
                "grade": "0",
                "badge": "none"
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "response": {
                "summary": "Error occurred",
                "tags": ["error"],
                "grade": "0",
                "badge": "none"
            }
        }

@app.get("/scrapes")
async def get_scrapes():
    try:
        # Get all documents with all fields
        scrapes_list = list(collection.find(
            {},  # Empty query to get all documents
            {
                '_id': 0,  # Exclude MongoDB _id field
                'url': 1,
                'summary': 1,
                'tags': 1,
                'grade': 1,
                'badge': 1,
                'timestamp': 1,
                'content': {'$substr': ['$content', 0, 200]}  # First 200 chars of content
            }
        ).sort('timestamp', -1))  # Sort by newest first
        
        return {
            "status": "success",
            "scrapes": scrapes_list,
            "count": len(scrapes_list)
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

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

@app.get("/search-by-tags")
async def search_by_tags(tags: str):
    try:
        # Split tags string into list and normalize them
        tag_list = [tag.strip().lower() for tag in tags.split(',')]
        
        # Find documents that contain ANY of the provided tags
        query = {'tags': {'$in': tag_list}}
        
        # Get matching documents, include ALL fields
        results = list(collection.find(
            query,
            {
                '_id': 0,  # Exclude MongoDB _id field
                'url': 1,
                'summary': 1,
                'tags': 1,
                'grade': 1,    # Make sure grade is included
                'badge': 1,    # Make sure badge is included
                'timestamp': 1,
                'content': {'$substr': ['$content', 0, 200]}  # First 200 chars as preview
            }
        ).sort('timestamp', -1).limit(4))
        
        # Get related tags
        related_tags = set()
        for doc in results:
            related_tags.update(doc.get('tags', []))
        related_tags.difference_update(tag_list)  # Remove search tags
        
        return {
            "status": "success",
            "results": results,
            "count": len(results),
            "searched_tags": tag_list,
            "related_tags": list(related_tags)[:5]  # Suggest up to 5 related tags
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@app.get("/check-url")
async def check_url(url: str):
    try:
        # Normalize the URL
        parsed_url = urlparse(url)
        normalized_url = urljoin(url, parsed_url.path)
        
        # Check if URL exists in database
        existing_doc = collection.find_one({'url': normalized_url})
        
        if existing_doc:
            return {
                "exists": True,
                "message": f"This URL was previously scraped on {existing_doc.get('timestamp').strftime('%Y-%m-%d %H:%M:%S')}"
            }
        return {"exists": False}
    except Exception as e:
        return {"error": str(e), "status": "error"}

@app.get("/get-cached")
async def get_cached(url: str):
    try:
        # Normalize the URL
        parsed_url = urlparse(url)
        normalized_url = urljoin(url, parsed_url.path)
        
        # Get cached data with all fields explicitly
        doc = collection.find_one(
            {'url': normalized_url},
            {
                '_id': 0,
                'url': 1,
                'summary': 1,
                'tags': 1,
                'grade': 1,
                'badge': 1,  # Explicitly include badge
                'timestamp': 1,
                'content': {'$substr': ['$content', 0, 500]}
            }
        )
        
        if not doc:
            return {
                "status": "error",
                "error": "URL not found in cache"
            }

        # Format the response with all fields
        return {
            "status": "success",
            "response": {
                "url": doc.get('url'),
                "summary": doc.get('summary'),
                "tags": doc.get('tags', []),
                "grade": doc.get('grade'),
                "badge": doc.get('badge'),  # Include badge in response
                "timestamp": doc.get('timestamp')
            },
            "message": f"Retrieved from cache (scraped on {doc.get('timestamp').strftime('%Y-%m-%d %H:%M:%S')})",
            "cached": True
        }

    except Exception as e:
        return {
            "status": "error",
            "error": f"Failed to retrieve cached data: {str(e)}"
        }

@app.get("/", response_class=HTMLResponse)
async def read_items():
    return """
    <html>
        <head>
            <title>Linkbender</title>
        </head>
        <body>
            <h1></h1>
            <a href="/docs">Docs</a>
        </body>
    </html>
    """
