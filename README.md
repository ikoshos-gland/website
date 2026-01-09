# 🌐 Mertoshi - AI-Powered Personal Portfolio

> Modern, interaktif ve yapay zeka destekli kişisel portfolio sitesi. React frontend, Azure Functions backend ve Semantic Kernel agent mimarisi ile güçlendirilmiştir.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Azure Functions](https://img.shields.io/badge/Azure%20Functions-Python%203.11-0062AD?logo=azure-functions&logoColor=white)
![Semantic Kernel](https://img.shields.io/badge/Semantic%20Kernel-1.27+-512BD4?logo=microsoft&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)

## 📑 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Mimari](#-mimari)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Frontend](#-frontend)
- [Backend (RAG/Agent API)](#-backend-ragagent-api)
- [Agent Sistemi](#-agent-sistemi)
- [Altyapı (IaC)](#-altyapı-iac)
- [Doküman İndeksleme](#-doküman-indeksleme)
- [Kurulum](#-kurulum)
- [Ortam Değişkenleri](#-ortam-değişkenleri)
- [Geliştirme](#-geliştirme)
- [Deployment](#-deployment)
- [Güvenlik](#-güvenlik)
- [Performans](#-performans)
- [Proje Yapısı](#-proje-yapısı)

---

## 🎯 Genel Bakış

Bu proje iki ana bileşenden oluşur:

1. **Statik Portfolio Web Sitesi** - 3D elementler ve modern animasyonlarla zenginleştirilmiş React frontend
2. **RAG/Agentic Backend** - AI destekli doküman arama, web araştırması ve akıllı sohbet yetenekleri

### ✨ Öne Çıkan Özellikler

| Özellik | Açıklama |
|---------|----------|
| 🤖 **Agentic Chat** | Semantic Kernel ile orkestre edilen çok araçlı AI asistan |
| 📚 **RAG (Retrieval-Augmented Generation)** | Azure AI Search üzerinde vektör + semantik hibrit arama |
| 🌐 **Gerçek Zamanlı Web Arama** | Tavily API ile güncel bilgi erişimi |
| 🎨 **3D İnteraktif Elementler** | Spline ile oluşturulmuş 3D sahneler |
| ⚡ **Akıllı Yükleme** | Lazy loading, code splitting ve preloading stratejileri |
| 🔒 **Enterprise Güvenlik** | Rate limiting, Managed Identity, CORS koruması |
| 📊 **Performans İzleme** | Application Insights ile detaylı metrikler |

---

## 🏗 Mimari

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │   React 19 + Vite + TypeScript + Tailwind CSS                   │    │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │    │
│  │   │  Navbar  │  │   Hero   │  │ Sections │  │ ChatWidget   │   │    │
│  │   └──────────┘  │ (Spline) │  │  (Lazy)  │  │ (AI Agent)   │   │    │
│  │                 └──────────┘  └──────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │ REST API                            │
└────────────────────────────────────┼────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │            Azure Functions (Python 3.11)                        │    │
│  │   ┌───────────────────────────────────────────────────────┐    │    │
│  │   │              Semantic Kernel Agent                     │    │    │
│  │   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │    │    │
│  │   │   │   RAG    │ │   Web    │ │ DateTime │ │ AboutMe │  │    │    │
│  │   │   │  Plugin  │ │  Search  │ │  Plugin  │ │ Plugin  │  │    │    │
│  │   │   └────┬─────┘ └────┬─────┘ └──────────┘ └─────────┘  │    │    │
│  │   └────────┼────────────┼─────────────────────────────────┘    │    │
│  └────────────┼────────────┼──────────────────────────────────────┘    │
│               │            │                                            │
└───────────────┼────────────┼────────────────────────────────────────────┘
                │            │
       ┌────────▼───┐   ┌────▼────┐
       │ Azure AI   │   │  Tavily │
       │   Search   │   │   API   │
       │ (Vectors)  │   │  (Web)  │
       └────────────┘   └─────────┘
                │
       ┌────────▼────────┐
       │   Azure OpenAI  │
       │  (GPT-4o, Ada)  │
       └─────────────────┘
```

---

## 🛠 Teknoloji Yığını

### Frontend
| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **React** | 19.2.3 | UI framework |
| **TypeScript** | 5.8 | Tip güvenliği |
| **Vite** | 6.2 | Build tool ve dev server |
| **Tailwind CSS** | 3.4 | Utility-first CSS |
| **Spline** | 4.1 | 3D interaktif elementler |
| **Lucide React** | 0.562 | İkon kütüphanesi |
| **React Markdown** | 10.1 | Markdown rendering |

### Backend
| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Python** | 3.11 | Runtime |
| **Azure Functions** | v2 | Serverless compute |
| **Semantic Kernel** | 1.27+ | Agent orchestration |
| **Azure OpenAI** | - | LLM (GPT-4o) ve Embeddings |
| **Azure AI Search** | - | Vektör + semantik arama |
| **Tavily** | 0.5+ | Web arama API |

### Altyapı
| Teknoloji | Kullanım Amacı |
|-----------|----------------|
| **Azure Static Web Apps** | Frontend hosting |
| **Azure Function App** | Backend hosting |
| **Azure Key Vault** | Secret management |
| **Azure Application Insights** | Monitoring |
| **Bicep** | Infrastructure as Code |
| **GitHub Actions** | CI/CD |

---

## 💻 Frontend

### Temel Dosyalar

```
├── App.tsx              # Ana uygulama, state yönetimi, lazy loading
├── index.tsx            # React entry point
├── index.html           # HTML template, preload direktifleri
├── index.css            # Global stiller
├── vite.config.ts       # Vite yapılandırması, code splitting
├── tailwind.config.js   # Tailwind özelleştirmeleri
└── types.ts             # TypeScript type tanımları
```

### Bileşenler (`components/`)

| Bileşen | Açıklama | Yükleme |
|---------|----------|---------|
| `Navbar.tsx` | Navigasyon ve chat tetikleyici | Eager |
| `Hero.tsx` | 3D Spline sahne, CTA butonları | Eager |
| `ChatWidget.tsx` | AI agent sohbet arayüzü | Eager |
| `Categories.tsx` | Kategori grid | Lazy |
| `MyStory.tsx` | Hikaye bölümü | Lazy |
| `CaseStudies.tsx` | Proje kartları | Lazy |
| `Philosophy.tsx` | Yayınlar ve felsefe | Lazy |
| `Process.tsx` | Çalışma süreci | Lazy |
| `Testimonials.tsx` | Referanslar | Lazy |
| `Footer.tsx` | Alt bilgi | Lazy |
| `Loader.tsx` | Yükleme animasyonu | Eager |
| `ScrambleText.tsx` | Metin animasyonu | Utility |

### Performans Optimizasyonları

1. **Akıllı Yükleme (Smart Loading)**
   - Font'lar ve kritik görseller preload edilir
   - Spline 3D sahne bağımsız yüklenir (non-blocking)
   - Minimum 500ms loader animasyonu

2. **Lazy Loading**
   - Hero altındaki tüm bileşenler `React.lazy()` ile yüklenir
   - `Suspense` ile fallback UI sağlanır

3. **Code Splitting** (`vite.config.ts`)
   ```javascript
   manualChunks: {
     'vendor-react': ['react', 'react-dom'],
     'vendor-3d': ['@splinetool/react-spline', '@splinetool/runtime']
   }
   ```

### Stil Kılavuzu

```css
/* Temel Renkler */
--background: #0E0F11
--text-primary: #A1A1A6
--container-max: 1600px
```

---

## 🔌 Backend (RAG/Agent API)

### API Endpoint'leri

| Endpoint | Method | Açıklama | Rate Limit |
|----------|--------|----------|------------|
| `/api/agent` | POST | Agentic chat (önerilen) | 10/dk |
| `/api/agent-stream` | POST | Streaming agent chat | 10/dk |
| `/api/chat` | POST | Basit RAG chat | 10/dk |
| `/api/chat-simple` | POST | Direkt GPT (RAG olmadan) | 10/dk |
| `/api/health` | GET | Sağlık kontrolü | 20/dk |
| `/api/init-index` | POST | Arama indeksi oluşturma | 5/dk |

### Request/Response Formatı

**Agent Chat Request:**
```json
{
  "message": "Mert'in nörobilim araştırmaları hakkında bilgi ver",
  "conversation_history": [
    {"role": "user", "content": "Merhaba"},
    {"role": "assistant", "content": "Merhaba! Size nasıl yardımcı olabilirim?"}
  ]
}
```

**Agent Chat Response:**
```json
{
  "answer": "Mert'in nörobilim araştırmaları...",
  "tool_calls": [
    {
      "tool": "RAG-search_documents",
      "status": "success",
      "message": "Document search complete"
    }
  ],
  "citations": [
    {
      "title": "Connectome Analysis Paper",
      "source": "neuroscience-research.pdf",
      "content": "..."
    }
  ],
  "timing": {
    "total_ms": 7725,
    "openai_search_ms": 7717,
    "processing_ms": 8
  },
  "usage": {
    "prompt_tokens": 8085,
    "completion_tokens": 404,
    "total_tokens": 8489
  }
}
```

### Dosya Yapısı

```
api/
├── function_app.py       # HTTP endpoint'leri ve routing
├── security.py           # Rate limiting, CORS, validasyon
├── host.json             # Azure Functions host konfigürasyonu
├── local.settings.json   # Yerel geliştirme ortam değişkenleri
├── requirements.txt      # Python bağımlılıkları
└── agent/
    ├── __init__.py
    ├── agent_service.py  # Agent orkestrasyon servisi
    ├── kernel_setup.py   # Semantic Kernel konfigürasyonu
    └── plugins/          # AI agent araçları
        ├── __init__.py
        ├── rag_plugin.py         # Doküman arama
        ├── web_search_plugin.py  # Web arama (Tavily)
        ├── datetime_plugin.py    # Tarih/saat araçları
        └── about_me_plugin.py    # Kişisel bilgiler
```

---

## 🤖 Agent Sistemi

### Semantic Kernel Mimarisi

Agent sistemi Microsoft Semantic Kernel kullanılarak inşa edilmiştir. Her plugin, agent'ın kullanabileceği bir "araç" (tool) olarak çalışır.

### Mevcut Plugin'ler

#### 1. RAG Plugin (`rag_plugin.py`)
```python
@kernel_function(name="search_documents")
def search_documents(self, query: str) -> str:
    """
    Mert'in kişisel bilgi tabanında arama yapar.
    - Azure AI Search ile vektör + semantik hibrit arama
    - Otomatik citation extraction
    - top_n_documents: 5, strictness: 3
    """
```

#### 2. Web Search Plugin (`web_search_plugin.py`)
```python
@kernel_function(name="search_web")
def search_web(self, query: str, max_results: int = 5) -> str:
    """
    Tavily API ile gerçek zamanlı web araması.
    - Güncel haberler ve olaylar
    - Doküman aramasında bulunmayan bilgiler
    - AI-generated quick answers
    """
```

#### 3. DateTime Plugin (`datetime_plugin.py`)
```python
@kernel_function(name="get_current_time")
def get_current_time(self, timezone: str = "UTC") -> str

@kernel_function(name="calculate_date")
def calculate_date(self, date: str, days: int) -> str

@kernel_function(name="days_until")
def days_until(self, target_date: str) -> str
```

#### 4. AboutMe Plugin (`about_me_plugin.py`)
```python
@kernel_function(name="get_personal_info")
def get_personal_info(self) -> str
"""Mert hakkında temel bilgileri döndürür."""
```

### Agent Çalışma Akışı

```
[Kullanıcı Mesajı]
      │
      ▼
┌─────────────────────┐
│   AgentService      │
│  (invoke_with_status)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Semantic Kernel    │
│   Chat Completion   │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │  Tool Seçimi │ ← GPT-4o karar verir
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │ Plugin Çağrı│
    │  (Paralel)  │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │ Final Cevap │
    │ Oluşturma   │
    └──────┬──────┘
           │
           ▼
     [JSON Response]
```

### Tool Durum Mesajları

Frontend'de gösterilen durum mesajları:

| Tool | Çalışıyor | Tamamlandı |
|------|-----------|------------|
| `RAG-search_documents` | "Searching documents..." | "Document search complete" |
| `WebSearch-search_web` | "Browsing the web..." | "Web search complete" |
| `AboutMe-get_personal_info` | "Getting personal info..." | "Info retrieved" |
| `DateTime-get_current_time` | "Checking the time..." | "Time retrieved" |

---

## 🏛 Altyapı (IaC)

### Bicep ile Kaynak Yönetimi

Tüm Azure kaynakları `infra/main.bicep` dosyasında tanımlıdır.

### Dağıtılan Kaynaklar

| Kaynak | SKU | Amaç |
|--------|-----|------|
| **Azure OpenAI** | S0 | GPT-4o ve embedding modelleri |
| **Azure AI Search** | Basic | Vektör indeks ve semantik arama |
| **Azure Function App** | Consumption | Python 3.11 backend |
| **Azure Key Vault** | Standard | API key'leri güvenli saklama |
| **Application Insights** | Pay-as-you-go | Logging ve monitoring |
| **Storage Account** | Standard LRS | Function App state |

### Deployment Komutları

```bash
# 1. Resource Group oluştur
az group create --name rg-rag-prod --location eastus

# 2. Altyapıyı deploy et
az deployment group create \
  --resource-group rg-rag-prod \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam

# 3. Function App'i deploy et
cd api
func azure functionapp publish func-rag-prod-<suffix>
```

### Tahmini Maliyet (Aylık)

| Kaynak | Tahmini Maliyet |
|--------|-----------------|
| Azure OpenAI | $10-50 (kullanıma bağlı) |
| Azure AI Search (Basic) | ~$75 |
| Azure Functions (Consumption) | ~$0-5 |
| Key Vault | ~$1 |
| Application Insights | ~$2-5 |
| **Toplam** | **~$90-140** |

---

## 📄 Doküman İndeksleme

### Genel Bakış

Akademik makaleler ve belgeler Azure AI Search'e şu şekilde indekslenir:

```
PDF Dosyaları
    ↓
Azure Document Intelligence (OCR)
    ↓
LangChain RecursiveCharacterTextSplitter (Semantic Chunking)
    ↓
Azure OpenAI Embeddings (text-embedding-3-large, 3072 dim)
    ↓
Azure AI Search Index
```

### Semantic Chunking

**Neden Semantic Chunking?**

| Sayfa Bazlı (Eski) ❌ | Semantic (Yeni) ✅ |
|----------------------|-------------------|
| Context bölünür | Context korunur |
| GPT karışık cevap verir | GPT doğru cevap verir |
| 6/10 accuracy | 9/10 accuracy |

**Konfigürasyon:**
```python
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,        # ~750-800 token
    chunk_overlap=200,      # Context korunması
    separators=["\\n\\n", "\\n", ". ", " ", ""]
)
```

### İndeksleme Script'i

```bash
cd scripts

# 1. Environment hazırla
cp .env.example .env
# .env dosyasını doldur

# 2. PDF'leri data/ klasörüne koy
cp my_paper.pdf data/

# 3. Script'i çalıştır
python index_documents.py
```

**Çıktı Örneği:**
```
============================================================
📚 İşleniyor: paper.pdf
============================================================
📄 Okunuyor: data/paper.pdf...
   ✅ 15 sayfa okundu, toplam 45231 karakter.
   🧩 12 semantic chunk oluşturuldu
   🔄 Embedding'ler oluşturuluyor...
   ✅ Chunk 1/12 | 782 tokens
   ...
🚀 12 chunk Azure AI Search'e yükleniyor...
✅ Tüm dökümanlar başarıyla indexlendi!
```

---

## 🚀 Kurulum

### Gereksinimler

- **Node.js** 18+ (frontend)
- **Python** 3.11+ (backend)
- **Azure CLI** (deployment)
- **Azure Functions Core Tools** (local development)

### Hızlı Başlangıç

```bash
# 1. Repo'yu klonla
git clone https://github.com/username/website.git
cd website

# 2. Frontend bağımlılıklarını yükle
npm install

# 3. Backend bağımlılıklarını yükle
cd api
pip install -r requirements.txt
cd ..

# 4. Environment dosyalarını oluştur
cp .env.example .env
cp api/local.settings.json.example api/local.settings.json
# Dosyaları doldur

# 5. Backend'i başlat (Terminal 1)
cd api
func start

# 6. Frontend'i başlat (Terminal 2)
npm run dev
```

---

## 🔐 Ortam Değişkenleri

### Frontend (`.env`)

```env
# Backend API URL
VITE_RAG_API_URL=http://localhost:7071

# (Opsiyonel) Diğer API anahtarları
GEMINI_API_KEY=your_key_here
```

### Backend (`api/local.settings.json`)

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    
    "AZURE_OPENAI_ENDPOINT": "https://your-openai.cognitiveservices.azure.com",
    "AZURE_OPENAI_API_KEY": "your_key",
    "AZURE_OPENAI_DEPLOYMENT": "gpt-4o",
    "AZURE_EMBEDDING_DEPLOYMENT": "text-embedding-3-large",
    "AZURE_OPENAI_API_VERSION": "2024-12-01-preview",
    
    "AZURE_SEARCH_ENDPOINT": "https://your-search.search.windows.net",
    "AZURE_SEARCH_KEY": "your_key",
    "AZURE_SEARCH_INDEX": "documents-index",
    
    "TAVILY_API_KEY": "your_tavily_key",
    
    "ALLOWED_ORIGINS": "http://localhost:3000,http://localhost:5173"
  }
}
```

### İndeksleme Script'i (`scripts/.env`)

```env
AZURE_FORM_RECOGNIZER_ENDPOINT=https://your-doc-intel.cognitiveservices.azure.com/
AZURE_FORM_RECOGNIZER_KEY=your_key

AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_ENDPOINT=https://your-openai.cognitiveservices.azure.com

AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_SEARCH_KEY=your_key
```

---

## 👩‍💻 Geliştirme

### Frontend Komutları

```bash
npm run dev      # Development server (port 5173)
npm run build    # Production build
npm run preview  # Production build önizleme
```

### Backend Komutları

```bash
cd api
func start                              # Local function (port 7071)
func azure functionapp publish <name>   # Deploy to Azure
```

### Kod Stili

- **Frontend**: TypeScript strict mode, React 19 patterns
- **Backend**: Python type hints, docstrings
- **Git**: Conventional commits (`feat:`, `fix:`, `docs:`, etc.)

---

## 📦 Deployment

### GitHub Actions Workflows

#### 1. Frontend (Static Web Apps)
`.github/workflows/azure-static-web-apps-proud-grass-02ea7a610.yml`

Otomatik olarak `main` branch'e push edildiğinde tetiklenir.

#### 2. Backend (Infrastructure)
`.github/workflows/deploy-rag-infra.yml`

Manuel tetikleme veya `infra/` klasöründe değişiklik olduğunda çalışır.

### Manuel Deployment

```bash
# Frontend (Azure Static Web Apps)
npm run build
# SWA CLI veya Azure Portal ile deploy

# Backend
cd api
func azure functionapp publish func-rag-prod-<suffix>
```

---

## 🔒 Güvenlik

### Uygulanan Korumalar

#### Backend (`security.py`)

| Koruma | Açıklama |
|--------|----------|
| **Rate Limiting** | 10 req/dk chat, 20 req/dk genel |
| **IP Blocking** | 5 ihlal sonrası 10 dk blok |
| **CORS** | Whitelist tabanlı origin kontrolü |
| **Input Validation** | Uzunluk limitleri, tip kontrolleri |
| **HMAC Signing** | Admin endpoint'leri için imza doğrulama |
| **Security Headers** | X-Content-Type-Options, X-Frame-Options |

#### Altyapı (`infra/main.bicep`)

- TLS 1.2 minimum
- HTTPS only
- FTPS disabled
- Key Vault ile secret yönetimi
- Purge protection enabled
- Managed Identity authentication

### Managed Identity

Prodüksiyonda API key'ler yerine Managed Identity kullanılır:

```python
# Production: Managed Identity ile authentication
credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)
client = AzureOpenAI(azure_ad_token_provider=token_provider, ...)
```

### Commit Edilmemesi Gereken Dosyalar

```
# .gitignore'da
api/local.settings.json
.env
.env.local
scripts/.env
*.key
*.pem
```

---

## 📊 Performans

### RAG Parametreleri

| Parametre | Değer | Etki |
|-----------|-------|------|
| `top_n_documents` | 5 | Daha fazla context, daha yavaş |
| `strictness` | 3 | Orta-katı, dokümanlardan sapmaz |
| `max_tokens` | 800 | Cevap uzunluğu limiti |

### Beklenen Yanıt Süreleri

| Senaryo | Config | Süre | Kalite |
|---------|--------|------|--------|
| Hızlı cevap | top_n=3, strictness=2 | 3-4s | İyi |
| **Varsayılan** | **top_n=5, strictness=3** | **6-8s** | **Mükemmel** |
| Derin araştırma | top_n=10, strictness=4 | 12-15s | Maksimum |

### Darboğaz Analizi (7.7s tipik yanıt)

```
Azure AI Search:     ~0.5s  (6%)
Azure OpenAI:        ~7.2s  (94%)  ← Ana darboğaz
Response Processing: <0.01s (<1%)
```

### Performans Testi

```bash
cd scripts
./analyze_performance.sh

# Veya manuel:
curl -s -X POST "https://your-function.azurewebsites.net/api/agent" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test sorusu"}' | python -m json.tool
```

---

## 📁 Proje Yapısı

```
website/
├── 📁 api/                      # Backend (Azure Functions)
│   ├── function_app.py          # HTTP endpoint'leri
│   ├── security.py              # Güvenlik middleware
│   ├── requirements.txt         # Python bağımlılıkları
│   ├── host.json                # Functions host config
│   ├── local.settings.json      # Yerel ortam değişkenleri
│   └── 📁 agent/
│       ├── agent_service.py     # Agent orkestrasyon
│       ├── kernel_setup.py      # Semantic Kernel setup
│       └── 📁 plugins/
│           ├── rag_plugin.py        # Doküman arama
│           ├── web_search_plugin.py # Web arama
│           ├── datetime_plugin.py   # Tarih/saat
│           └── about_me_plugin.py   # Kişisel bilgi
│
├── 📁 components/               # React bileşenleri
│   ├── ChatWidget.tsx           # AI sohbet widget
│   ├── Hero.tsx                 # 3D hero section
│   ├── Navbar.tsx               # Navigasyon
│   └── ...                      # Diğer bileşenler
│
├── 📁 hooks/
│   └── useRagChat.ts            # RAG API hook
│
├── 📁 infra/                    # Infrastructure as Code
│   ├── main.bicep               # Azure kaynak tanımları
│   ├── main.bicepparam          # Parametre dosyası
│   └── README.md                # Deployment kılavuzu
│
├── 📁 scripts/                  # Utility script'leri
│   ├── index_documents.py       # PDF indeksleme
│   ├── test_performance.py      # Performans testi
│   ├── analyze_performance.sh   # Bash analiz script
│   └── 📁 data/                 # PDF dosyaları
│
├── 📁 public/                   # Statik dosyalar
│   └── ...
│
├── 📁 .github/workflows/        # CI/CD
│   ├── azure-static-web-apps-*.yml
│   └── deploy-rag-infra.yml
│
├── App.tsx                      # Ana React bileşeni
├── index.tsx                    # Entry point
├── index.html                   # HTML template
├── index.css                    # Global stiller
├── types.ts                     # TypeScript tipler
├── vite.config.ts               # Vite yapılandırması
├── tailwind.config.js           # Tailwind config
├── tsconfig.json                # TypeScript config
├── package.json                 # NPM bağımlılıkları
├── .env                         # Ortam değişkenleri
├── .gitignore                   # Git ignore
├── CLAUDE.md                    # AI assistant kılavuzu
└── README.md                    # Bu dosya
```

---

## 📚 Referanslar

- [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/)
- [Azure AI Search](https://learn.microsoft.com/azure/search/)
- [Semantic Kernel Documentation](https://learn.microsoft.com/semantic-kernel/)
- [Azure Functions Python](https://learn.microsoft.com/azure/azure-functions/functions-reference-python)
- [React 19 Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Spline Design](https://spline.design/)

---

## 📝 Lisans

Bu proje özel bir projedir. Tüm hakları saklıdır.

---

<div align="center">

**Built with ❤️ using AI-powered development**

[🌐 Live Demo](https://mertoshi.online) • [📧 Contact](mailto:contact@mertoshi.online)

</div>
