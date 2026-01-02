# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains two distinct systems:

1. **Static Portfolio Website** - React frontend deployed to Azure Static Web Apps
2. **RAG/Agentic Backend** - Python Azure Functions for AI-powered document retrieval (extensible to agentic workflows)

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

### Frontend
- Rate limit awareness with automatic retry handling
- Proper error messages for security-related failures

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
- Any `*.key` or `*.pem` files
