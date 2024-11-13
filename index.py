# fast api server with a get endpoint to take a link and scrape the text from the page

from fastapi import FastAPI
import requests
from bs4 import BeautifulSoup
from tinydb import TinyDB
from datetime import datetime

from phi.agent import Agent
from phi.model.ollama import Ollama
from phi.model.openai import OpenAIChat
from phi.embedder.ollama import OllamaEmbedder

from phi.knowledge.json import JSONKnowledgeBase
from phi.vectordb.pgvector import PgVector
from dotenv import load_dotenv

load_dotenv()

knowledge_base = JSONKnowledgeBase(
    path="knowledge",
    # Table name: ai.json_documents
    vector_db=PgVector(
        table_name="scrapes",
        db_url="postgresql+psycopg://ai:ai@localhost:5532/ai",
        embedder=OllamaEmbedder(model="mxbai-embed-large",dimensions=1024),
    ),
)

# knowledge_base.load(recreate=True, upsert=True)

agent = Agent(
    model = OpenAIChat(id="gpt-4o"),
    knowledge=knowledge_base,
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
        You respond with a json object with the following keys:
        - summary: a summary of the text
        - tags: a list of tags that define the content of the text
        The json object should be valid and not contain any errors and parsable. I don't want any markdown in the response.
        """],
        # debug_mode=True,
    )

app = FastAPI()
db = TinyDB('scrape_db.json')
scrapes = db.table('scrapes')

@app.get("/scrape")
async def scrape(link: str):
    try:
        # Add headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        # Add headers to the request
        response = requests.get(link, headers=headers)
        response.raise_for_status()
        
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract all text while removing script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
            
        # Get text and clean it up
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        text = ' '.join(line for line in lines if line)

        response = summary_agent.run(text)

        
        # # Store in JSON database
        # doc_id = scrapes.insert({
        #     'url': link,
        #     'content': text,
        #     'timestamp': datetime.now().isoformat()
        # })

        # knowledge_base.load(
        #    upsert=True
        # )
        
        return {
            "text": text, 
            "status": "success",
            "response": response
        }
    except Exception as e:
        return {"error": str(e), "status": "error"}
    
# Optional: Add an endpoint to retrieve stored scrapes
@app.get("/scrapes")
async def get_scrapes():
    return {"scrapes": scrapes.all()}

@app.post("/ask")
async def ask(question: str):
    response = agent.run(question)
    return response.content

