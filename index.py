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

custom_summary_agent = Agent(
    model=xAI(id="grok-beta"),
    show_tool_calls=True,
    structured_output=True,
    instructions=["""
        Analyze the following link's content and provide a customized summary based on user preferences.

        Length preferences:
        - short: 1-2 sentences
        - medium: 3-4 sentences
        - detailed: 5-6 sentences

        Style preferences:
        - bullet_points: Present key points in bullet format
        - conversational: Casual, easy-to-read tone
        - technical: Detailed technical analysis,relatable to the content of the url

        Format the response in a clean JSON object:
        {
            "summary": "Customized summary based on preferences",
            "tags": ["tag1", "tag2"],
            "grade": "1-10",
            "badge": "gold/silver/bronze",
            "metadata": {
                "length": "short/medium/detailed",
                "style": "bullet_points/conversational/technical"
            }
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
connection_string = f"mongodb+srv://{username}:{
    password}@clusterme.81rw1.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(connection_string, connect=False)
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

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        for script in soup(["script", "style"]):
            script.decompose()

        text = ' '.join(line.strip()
                        for line in soup.get_text().splitlines() if line.strip())

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
                "tags": [str(tag) for tag in response_data.get("tags", ["error"])],
                "grade": str(response_data.get("grade", "error")),
                "badge": str(response_data.get("badge", "error"))
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
                'url': url,
                'summary': response_data['summary'],
                'grade': response_data['grade'],
                'badge': response_data['badge'],
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
                "text": text[:500] if text else "",
                "status": "error",
                "error": "Failed to parse agent response",
                "response": {
                    "summary": str(agent_response.content)[:200] if agent_response else "Error parsing response",
                    "tags": ["error"],
                    "grade": "0",
                    "badge": "none"
                }
            }

    except requests.RequestException as e:
        return {
            "status": "error",
            "error": f"Failed to fetch URL: {str(e)}",
            "text": "",
            "response": {
                "summary": "Failed to fetch URL",
                "tags": ["error"],
                "grade": "0",
                "badge": "none"
            }
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "text": text[:500] if text else "",
            "response": {
                "summary": "none",
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
                # First 200 chars of content
                'content': {'$substr': ['$content', 0, 200]}
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
                # First 200 chars as preview
                'content': {'$substr': ['$content', 0, 200]}
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
            # Suggest up to 5 related tags
            "related_tags": list(related_tags)[:5]
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


@app.get("/custom-summary")
async def get_custom_summary(
    url: str,
    length: str = "medium",
    style: str = "conversational"
):
    try:
        # Validate preferences
        valid_lengths = ["short", "medium", "detailed"]
        valid_styles = ["bullet_points", "conversational", "technical"]
        
        if length not in valid_lengths:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid length. Must be one of: {valid_lengths}"
            )
        
        if style not in valid_styles:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid style. Must be one of: {valid_styles}"
            )

        # Reuse existing URL validation and fetching logic
        if not url:
            raise HTTPException(status_code=422, detail="URL is required")

        # Normalize URL
        parsed_url = urlparse(url)
        if not parsed_url.scheme:
            url = f"https://{url}"

        # Fetch and parse content (reusing existing logic)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        for script in soup(["script", "style"]):
            script.decompose()

        text = ' '.join(line.strip() 
                       for line in soup.get_text().splitlines() if line.strip())

        # Add preferences to the text for the agent
        context = f"""
        PREFERENCES:
        Length: {length}
        Style: {style}

        CONTENT:
        {text}
        """

        # Get custom summary
        agent_response = custom_summary_agent.run(context)

        # Process response (similar to existing logic)
        if isinstance(agent_response.content, dict):
            response_data = agent_response.content
        else:
            clean_response = (
                agent_response.content
                .replace('```json', '')
                .replace('```', '')
                .strip()
            )
            response_data = json.loads(clean_response)

        # Store in MongoDB with preferences
        mongo_doc = {
            'url': url,
            'summary': response_data['summary'],
            'tags': response_data['tags'],
            'grade': response_data['grade'],
            'badge': response_data['badge'],
            'preferences': {
                'length': length,
                'style': style
            },
            'timestamp': datetime.now(),
            'content': text[:1000]  # Store first 1000 chars
        }
        collection.insert_one(mongo_doc)

        return {
            "status": "success",
            "response": response_data,
            "preferences": {
                "length": length,
                "style": style
            }
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "response": {
                "summary": "Failed to generate custom summary",
                "tags": ["error"],
                "grade": "0",
                "badge": "none"
            }
        }
