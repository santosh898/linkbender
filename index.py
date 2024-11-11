# fast api server with a get endpoint to take a link and scrape the text from the page

from fastapi import FastAPI
import requests
from bs4 import BeautifulSoup
from tinydb import TinyDB
from datetime import datetime

from phi.agent import Agent
from phi.model.ollama import Ollama
from phi.embedder.ollama import OllamaEmbedder

from phi.knowledge.json import JSONKnowledgeBase
from phi.vectordb.pgvector import PgVector

knowledge_base = JSONKnowledgeBase(
    path="knowledge",
    # Table name: ai.json_documents
    vector_db=PgVector(
        table_name="scrapes",
        db_url="postgresql+psycopg://ai:ai@localhost:5532/ai",
        embedder=OllamaEmbedder(model="mxbai-embed-large",dimensions=1024),
    ),
)

knowledge_base.load(recreate=True, upsert=True)

agent = Agent(
    model=Ollama(id="llama3.2:3b"),
    knowledge=knowledge_base,
    show_tool_calls=True,
    markdown=True,
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
        
        # Store in JSON database
        doc_id = scrapes.insert({
            'url': link,
            'content': text,
            'timestamp': datetime.now().isoformat()
        })

        # knowledge_base.load(
        #    upsert=True
        # )
        
        return {
            "text": text, 
            "status": "success",
            "id": doc_id
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

