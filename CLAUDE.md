# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Quick Reference for Claude Code

### When Making Changes:
1. ✅ **Always read files before editing** (use Read tool)
2. ✅ **Test changes locally** when possible
3. ✅ **Follow git workflow** (see Git Workflow section below)
4. ✅ **Update documentation** if architecture changes
5. ✅ **Check security** - never commit secrets

### Key Resources:
- **Function App**: `func-rag-prod-3mktjtlolzx3q`
- **Resource Group**: `rg-rag-prod`
- **Key Vault**: `kv-rag-prod-3mktjtlo`
- **Search Index**: `documents-index`
- **OpenAI Endpoint**: `https://vectorizervascularr.cognitiveservices.azure.com`

---

## Project Overview

This repository contains two distinct systems:

1. **Static Portfolio Website** - React frontend deployed to Azure Static Web Apps
2. **RAG/Agentic Backend** - Python Azure Functions for AI-powered document retrieval with semantic search

---

# Part 1: Static Portfolio Website

A React-based portfolio website featuring interactive 3D elements via Spline. Communicates with the backend via REST API calls only.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run preview      # Preview production build
```

## Architecture

### Tech Stack
- React 19 with TypeScript
- Vite 6 for builds
- Tailwind CSS for styling
- Spline for 3D elements (@splinetool/react-spline)
- Lucide React for icons

### Key Files
- `App.tsx` - Orchestrates loading, lazy-loading, and chat widget state
- `components/Hero.tsx` - Above-the-fold with Spline 3D scene (unloads when out of viewport)
- `components/ChatWidget.tsx` - Chat UI that calls the RAG backend
- `hooks/useRagChat.ts` - React hook for backend API communication

### Performance Patterns

**Smart Loading** (`App.tsx`): Preloads fonts, critical images, and Spline scene (3s timeout fallback) before revealing content.

**Lazy Loading**: All below-the-fold components use React.lazy. Only Hero, Navbar, and ChatWidget are eager-loaded.

**Code Splitting** (`vite.config.ts`): Separate chunks for `vendor-react` and `vendor-3d`.

### Environment Variables

Set in `.env.local`:
- `VITE_RAG_API_URL` - Backend API endpoint (defaults to `http://localhost:7071`)
- `GEMINI_API_KEY` - Optional, accessible via `process.env.API_KEY`

### Styling
- Background: `#0E0F11`
- Text: `#A1A1A6`
- Container max-width: `1600px`

### Types
`types.ts` contains interfaces for NavLink, CaseStudy, Testimonial, ProcessStep.

---

# Part 2: RAG/Agentic Backend

Python Azure Functions backend for AI-powered chat. Currently implements RAG (Retrieval-Augmented Generation) with Azure OpenAI "On Your Data". Designed to be extended into an agentic architecture.

## Development Commands

```bash
cd api
pip install -r requirements.txt
func start                              # Start local function at localhost:7071
func azure functionapp publish <name>   # Deploy to Azure
```

## Infrastructure Deployment

```bash
az deployment group create \
  --resource-group rg-rag-dev \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam
```

See `infra/README.md` for full deployment guide and resource details.

## Architecture

### Current Flow (RAG)
```
User Query → Azure Function → Azure OpenAI "On Your Data" → Azure AI Search → Response
```

### Tech Stack
- Python 3.11 with Azure Functions v2
- Azure OpenAI (GPT + embeddings)
- Azure AI Search (vector + semantic hybrid search)
- Azure Key Vault for secrets

### API Endpoints (`api/function_app.py`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | RAG chat - retrieves from documents |
| `/api/chat-simple` | POST | Direct GPT chat (no retrieval) |
| `/api/health` | GET | Health check |
| `/api/init-index` | POST | One-time search index setup |

### Environment Variables

Set in `api/local.settings.json` locally or Azure portal for production:

| Variable | Description |
|----------|-------------|
| `AZURE_OPENAI_API_KEY` | Azure OpenAI key |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint |
| `AZURE_OPENAI_DEPLOYMENT` | Chat model deployment name |
| `AZURE_EMBEDDING_DEPLOYMENT` | Embedding model deployment name |
| `AZURE_SEARCH_ENDPOINT` | Azure AI Search endpoint |
| `AZURE_SEARCH_KEY` | Azure AI Search admin key |
| `AZURE_SEARCH_INDEX` | Index name (default: `documents-index`) |

## Extending to Agentic Architecture

The current RAG system can be evolved into an agentic structure:

### Potential Extensions
- **Tool Use**: Add function calling to let the LLM invoke tools (search, calculate, fetch data)
- **Multi-step Reasoning**: Implement ReAct or similar patterns for complex queries
- **Memory**: Add conversation persistence beyond session
- **Orchestration**: Use LangChain, Semantic Kernel, or custom agent loops
- **Multiple Data Sources**: Extend beyond document search to APIs, databases, web

### Suggested Structure for Agents
```
api/
├── function_app.py      # HTTP endpoints (keep thin)
├── agents/
│   ├── orchestrator.py  # Main agent loop
│   ├── tools/           # Tool implementations
│   │   ├── search.py
│   │   ├── calculator.py
│   │   └── web.py
│   └── memory/          # Conversation/context management
├── prompts/             # System prompts and templates
└── requirements.txt
```

### Key Considerations
- Keep `function_app.py` as a thin HTTP layer
- Implement agent logic in separate modules
- Use structured outputs for tool calls
- Add observability (logging, tracing) for debugging agent behavior

---

# Security

## Implemented Protections

### Backend (`api/security.py`)
- **Rate Limiting**: 10 requests/minute for chat, 20 for general endpoints
- **IP Blocking**: Automatic 10-minute block after 5 rate limit violations
- **CORS Whitelisting**: Only allows requests from configured origins
- **Request Validation**: Input sanitization, length limits, type checking
- **HMAC Signing**: Optional request signing for admin endpoints
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection

### Infrastructure (`infra/main.bicep`)
- **TLS 1.2 minimum** on all services
- **HTTPS only** on Function App
- **FTPS disabled**
- **Key Vault** for all secrets with RBAC authorization
- **Purge protection** enabled on Key Vault
- **Application Insights** for monitoring
- **Managed Identity** enabled on Function App

### Authentication (Managed Identity)
- **Azure OpenAI**: Uses Managed Identity with `DefaultAzureCredential`
- **Azure AI Search**: Uses Managed Identity for production, API key for local dev
- **Key Vault**: Automatic access via Managed Identity RBAC
- **Zero Secrets**: No hardcoded API keys in production environment

```python
# api/function_app.py - Managed Identity Implementation
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

def get_openai_client() -> AzureOpenAI:
    api_key = os.environ.get("AZURE_OPENAI_API_KEY", "")

    if api_key and not api_key.startswith("@Microsoft.KeyVault"):
        # Local development with API key
        return AzureOpenAI(api_key=api_key, ...)
    else:
        # Production: Use Managed Identity
        credential = DefaultAzureCredential()
        token_provider = get_bearer_token_provider(
            credential, "https://cognitiveservices.azure.com/.default"
        )
        return AzureOpenAI(azure_ad_token_provider=token_provider, ...)
```

### Frontend
- Rate limit awareness with automatic retry handling
- Proper error messages for security-related failures
- No secrets in frontend code or environment variables

## Environment Variables (Security)

| Variable | Description |
|----------|-------------|
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |
| `RATE_LIMIT_WINDOW` | Rate limit window in seconds (default: 60) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window (default: 20) |
| `RATE_LIMIT_CHAT_MAX` | Max chat requests per window (default: 10) |
| `API_SECRET_KEY` | HMAC secret for request signing (optional) |

## Rotating Compromised Keys

If keys are exposed, rotate immediately:

```bash
# Azure OpenAI - regenerate in Azure Portal
az cognitiveservices account keys regenerate \
  --name <openai-resource> \
  --resource-group <rg> \
  --key-name key1

# Azure Search - regenerate admin key
az search admin-key renew \
  --service-name <search-name> \
  --resource-group <rg> \
  --key-type primary

# Update Key Vault secrets after regeneration
az keyvault secret set \
  --vault-name <vault> \
  --name azure-openai-key \
  --value "<new-key>"
```

## Files to Never Commit

See `.gitignore` - critical files:
- `api/local.settings.json` (contains secrets for local dev)
- `.env`, `.env.local` (environment variables)
- `scripts/.env` (indexing script secrets)
- Any `*.key` or `*.pem` files

---

# Document Intelligence & Semantic Chunking

## Overview

This project uses Azure Document Intelligence (Form Recognizer) for PDF text extraction and LangChain for semantic chunking. This is a **two-stage offline process** for indexing academic papers.

## Architecture

```
PDF Documents (scripts/data/)
    ↓
Azure Document Intelligence (prebuilt-read OCR)
    ↓
Full Text Extraction
    ↓
LangChain RecursiveCharacterTextSplitter
    ↓
Semantic Chunks (~750-800 tokens each)
    ↓
Azure OpenAI Embeddings (text-embedding-3-large)
    ↓
Azure AI Search Index (vector + metadata)
```

## Why Semantic Chunking?

### ❌ Old Approach (Page-Based)
```
Page 1: Introduction + Methods beginning
Page 2: Methods end + Results beginning
→ Context lost, GPT confused
```

### ✅ New Approach (Semantic)
```
Chunk 1: Introduction (complete section)
Chunk 2: Methods - Data Collection
Chunk 3: Methods - Analysis
→ Each chunk is meaningful, GPT accurate
```

## Semantic Chunking Configuration

```python
# scripts/index_documents.py
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,           # ~750-800 tokens
    chunk_overlap=200,          # Context preservation
    length_function=lambda t: len(tiktoken.encode(t)),  # Token-based
    separators=[
        "\n\n",                 # Paragraph (highest priority)
        "\n",                   # Line
        ". ",                   # Sentence
        " ",                    # Word
        ""                      # Character (fallback)
    ]
)
```

### Key Parameters:
- **chunk_size**: 1000 characters (~750-800 tokens for GPT-4o)
- **chunk_overlap**: 200 characters (ensures context not lost at boundaries)
- **Token counting**: Uses `tiktoken` for accurate token estimation
- **Separator hierarchy**: Tries to split on paragraphs first, then lines, sentences, etc.

## Document Intelligence Usage

**Model**: `prebuilt-read` (OCR for digital & scanned PDFs)

**Why prebuilt-read?**
- ✅ Academic papers are mostly text
- ✅ Works on both digital and scanned PDFs
- ✅ Fast and cost-effective (~$1.50 per 1000 pages)
- ❌ No need for `prebuilt-layout` (tables not critical for RAG)

```python
# Extract text from PDF
poller = doc_client.begin_analyze_document("prebuilt-read", document=file)
result = poller.result()

# Combine all pages
full_text = ""
for page in result.pages:
    page_text = " ".join([line.content for line in page.lines])
    full_text += page_text + "\n\n"
```

## Indexing Workflow

### Step 1: Setup Environment
```bash
cd scripts
cp .env.example .env
# Fill in:
# - AZURE_FORM_RECOGNIZER_ENDPOINT
# - AZURE_FORM_RECOGNIZER_KEY
# - AZURE_OPENAI_API_KEY
# - AZURE_SEARCH_KEY
```

### Step 2: Add PDFs
```bash
cp my_academic_paper.pdf data/
```

### Step 3: Run Indexing
```bash
python index_documents.py
```

**Output:**
```
============================================================
📚 İşleniyor: paper.pdf
============================================================
📄 Okunuyor: data/paper.pdf...
   ✅ 15 sayfa okundu, toplam 45231 karakter.
   🧩 12 semantic chunk oluşturuldu (avg ~3769 char/chunk)
   🔄 Embedding'ler oluşturuluyor...
   ✅ Chunk 1/12 | Page 1 | 782 tokens
   ✅ Chunk 2/12 | Page 2 | 795 tokens
   ...
============================================================
🚀 12 chunk Azure AI Search'e yükleniyor...
============================================================
   📦 Batch 1: 12 chunk yüklendi

✅ Tüm dökümanlar başarıyla indexlendi!
   📊 Toplam: 12 semantic chunk
```

## Chunk Structure

Each chunk uploaded to Azure AI Search contains:

```python
{
    "id": "paper_pdf-chunk1",              # Unique ID
    "content": "Full text of the chunk...", # Actual content
    "title": "paper.pdf",                  # Source document
    "source": "paper.pdf",                 # Source file
    "chunk_id": 1,                         # Chunk number
    "content_vector": [0.123, ...]         # 3072-dim embedding
}
```

## Performance Comparison

| Metric | Page-Based | Semantic |
|--------|-----------|----------|
| Avg Chunk Size | 500-2000 tokens (variable) | 750-800 tokens (stable) |
| Context Preservation | ❌ Poor | ✅ Excellent |
| RAG Answer Quality | 6/10 | 9/10 |
| Citation Accuracy | 5/10 | 9/10 |

## Cost Estimation

**For 10 academic papers (~150 pages total):**
- Document Intelligence: ~$0.22 (150 pages × $1.50/1000)
- OpenAI Embeddings: ~$0.15 (assuming 120K tokens)
- **Total**: ~$0.37 per indexing run

## Troubleshooting

**Issue**: "Module not found: tiktoken"
```bash
cd scripts
pip install -r requirements.txt
```

**Issue**: "Rate limit exceeded"
- Script has `time.sleep(0.3)` between embeddings
- If still failing, increase to `time.sleep(0.5)`

**Issue**: Token count too high
- Reduce `chunk_size=800` instead of 1000
- Check with: `len(tiktoken.encode(chunk))`

## Updating Chunking Strategy

If you need to change chunking parameters:

1. Update `scripts/index_documents.py`:
```python
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,  # Smaller chunks
    chunk_overlap=150,
    ...
)
```

2. **Delete old index** (chunks will have different structure):
```bash
az search index delete \
  --name documents-index \
  --service-name search-rag-prod-3mktjtlo
```

3. **Re-index all documents**:
```bash
cd scripts
python index_documents.py
```

---

# GIT WORKFLOW for Claude Code

## 📝 When to Commit and Push

### Always Commit When:
1. ✅ Completed a logical unit of work (feature, fix, refactor)
2. ✅ Added new functionality that works
3. ✅ Fixed a bug successfully
4. ✅ Updated documentation
5. ✅ Made security improvements
6. ✅ User explicitly requests "push changes" or "commit this"

### Never Commit When:
1. ❌ Code is broken or untested
2. ❌ Contains secrets/API keys
3. ❌ Work is incomplete (unless user specifically asks)
4. ❌ You're just exploring/reading code

## 🔄 Standard Git Workflow

### Step 1: Check Status
```bash
git status
```
Review what files changed. Ensure no secrets are staged.

### Step 2: Stage Changes
```bash
# Stage specific files
git add api/function_app.py api/requirements.txt

# Or stage all (be careful!)
git add .

# Verify what's staged
git diff --staged
```

### Step 3: Commit with Descriptive Message
```bash
git commit -m "type: Brief description

- Detailed change 1
- Detailed change 2
- Detailed change 3

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Commit Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring
- `docs:` Documentation changes
- `security:` Security improvements
- `perf:` Performance improvements
- `chore:` Maintenance tasks

### Step 4: Push to GitHub
```bash
# Push to main branch
git push origin main

# Or if on feature branch
git push origin feature/branch-name
```

### Step 5: Verify
```bash
git log --oneline -3
```

## 📋 Example Commit Session

```bash
# Scenario: Just added Managed Identity and semantic chunking

# 1. Check what changed
git status

# 2. Review changes
git diff api/function_app.py
git diff scripts/index_documents.py

# 3. Stage files
git add api/function_app.py
git add api/requirements.txt
git add scripts/index_documents.py
git add scripts/requirements.txt
git add scripts/README.md
git add scripts/.env.example
git add README.md
git add CLAUDE.md

# 4. Commit with message
git commit -m "feat: Add Managed Identity and semantic chunking

Backend improvements:
- Implement Managed Identity for Azure OpenAI and AI Search
- Remove hardcoded API keys, use Key Vault references
- Add DefaultAzureCredential with fallback to API keys

Document indexing improvements:
- Implement semantic chunking with RecursiveCharacterTextSplitter
- Token-based chunking (~750-800 tokens per chunk)
- Add 200-token overlap for context preservation
- Create detailed indexing script documentation

Security:
- Azure services now authenticate via Managed Identity
- API keys stored in Key Vault (production)
- Zero exposed secrets in production environment

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 5. Push to GitHub
git push origin main

# 6. Verify
git log --oneline -3
```

## 🚨 Important Git Rules

### Rule 1: Never Force Push to Main
```bash
# ❌ NEVER do this
git push --force origin main

# ✅ If you need to fix a commit, create a new one
git commit --amend  # Only for unpushed commits
```

### Rule 2: Check for Secrets Before Committing
```bash
# Always verify no secrets are being committed
git diff --staged | grep -i "key\|secret\|password\|token"

# If found, unstage and add to .gitignore
git reset HEAD <file>
```

### Rule 3: Pull Before Push (If Working with Others)
```bash
git pull origin main
git push origin main
```

### Rule 4: Use Branches for Major Features
```bash
# Create feature branch
git checkout -b feature/new-feature

# Work on feature
git add .
git commit -m "feat: Implement new feature"

# Push branch
git push origin feature/new-feature

# Create PR via GitHub UI or gh CLI
gh pr create --title "feat: New feature" --body "Description..."
```

## 🔍 Useful Git Commands for Claude Code

```bash
# See what changed in working directory
git diff

# See what's staged for commit
git diff --staged

# See commit history
git log --oneline -10

# See specific file history
git log --oneline -- api/function_app.py

# Undo staged changes (before commit)
git reset HEAD <file>

# Undo local changes (DANGEROUS - loses work)
git checkout -- <file>

# See current branch
git branch

# See remote URL
git remote -v
```

## 📤 Deployment After Push

### Frontend (Automatic)
```
git push → GitHub Actions → Azure Static Web Apps
```
- Automatic deployment on every push to `main`
- No manual action needed
- Check: https://mertoshi.online

### Backend (Manual)
After pushing backend changes, deploy Function App:

```bash
cd api
func azure functionapp publish func-rag-prod-3mktjtlolzx3q

# Verify deployment
curl https://func-rag-prod-3mktjtlolzx3q.azurewebsites.net/api/health
```

Or use GitHub Actions:
```bash
gh workflow run deploy-rag-infra.yml
```

---
