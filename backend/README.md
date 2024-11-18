# RAG with PHI

## Start PGVector Database - Optional - For Future Use

1. Start the PGVector database using Docker Compose:

   ```sh
   docker compose -f pgvector.yml up -d
   ```

   You should see the `pgvector` container running on port 5532.

## Start Ollama and pull required models - Optional - For Future Use

```sh
# Start Ollama (if not already running)

# In a new terminal, pull the required models
ollama pull mxbai-embed-large
ollama pull llama3.2:3b
```

Verify the models are downloaded by running:

```sh
ollama list
```

## Installation

1. Install Poetry (macOS):

   ```sh
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. Add Poetry to your PATH:

   ```sh
   export PATH="$HOME/.local/bin:$PATH"
   ```

   Note: You may want to add this line to your `~/.zshrc` or `~/.bash_profile`

3. Verify installation:

   ```sh
   poetry --version
   ```

4. Install dependencies:
   ```sh
   poetry install
   ```

## Run

Activate the shell:

```sh
poetry shell
```

Run the FastAPI server:

```sh
uvicorn index:app --reload
```

Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) to view the API docs.
