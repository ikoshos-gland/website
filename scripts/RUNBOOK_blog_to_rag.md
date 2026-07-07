# RUNBOOK — Blogları Lundo'ya (RAG) indexle  ▶ "oku ve yap" dosyası

> Bu dosya CLAUDE/agent içindir. Mert "blogları RAG'e ekle / bu runbook'u oku ve yap"
> dediğinde, bu dosyayı oku ve aşağıdaki adımları **baştan sona** uygula. Sohbet
> geçmişine ihtiyaç yok — gereken tüm bağlam burada.

## 0) Amaç
İngilizce blog yazılarını Azure AI Search **`documents-index`**'ine ekleyip RAG chatbot
**Lundo**'nun blog içeriğine erişip kaynak göstermesini sağlamak. Backend'e kod değişikliği
GEREKMEZ (aynı index/şema/embedding). Hazır script: **`scripts/index_blog.py`**.

## 1) Sabit bağlam (doğrulanmış)
- Repo: `C:\Users\pc\Claude\website` (GitHub `ikoshos-gland/website`).
- Bloglar: `content/blog/*.mdx`. İngilizce = dil eki YOK; çeviriler `*.tr.mdx` / `*.de.mdx`.
- Index: `documents-index`  ·  Search endpoint: `https://search-rag-prod-3mktjtlo.search.windows.net`
- OpenAI endpoint: `https://vectorizervascularr.cognitiveservices.azure.com`  ·  embedding deployment: `text-embedding-3-large-957047`  ·  api_version `2024-12-01-preview`
- Chunk şeması: `{id, content, title, source, chunk_id, content_vector}` (3072-dim vektör)
- Key Vault: `kv-rag-prod-3mktjtlo` (RG `rg-rag-prod`) — anahtarlar burada.
- Chat API (doğrulama için): `https://func-rag-prod-3mktjtlolzx3q.azurewebsites.net/api/chat`
- Karar varsayılanları (Mert onayladı): **yalnız İngilizce**, `documents-index`, draft atla, sadece yeni yazılar.

## 2) Ön kontrol
1. `python scripts/index_blog.py` var mı? Yoksa bu runbook'taki "EK: script" bölümünden oluştur.
2. Hangi yazılar index'lenecek? `content/blog/` içindeki dil-eki olmayan, `draft: false` `.mdx`'ler.
   - `000-deneme.mdx` bir taslaktır → atlanır (draft:true). Gerçek yazılar genelde `001..` ve üstü.
3. Mert'e index'lenecek yazıların listesini söyle, onayını al (yanlış/yarım yazı index'lenmesin).

## 3) Anahtarları al (iki yol — biri yeter)
**Tercih A — Key Vault'tan (Azure erişimi varsa):**
```bash
az account show            # giriş yoksa: az login --tenant 636ba279-5da2-496e-9e37-bb31a88adcf7
az keyvault secret list --vault-name kv-rag-prod-3mktjtlo -o table
# OpenAI ve Search admin key secret adlarını bul, değerleri çek:
export AZURE_OPENAI_API_KEY="$(az keyvault secret show --vault-name kv-rag-prod-3mktjtlo --name <openai-secret-adi> --query value -o tsv)"
export AZURE_SEARCH_KEY="$(az keyvault secret show --vault-name kv-rag-prod-3mktjtlo --name <search-secret-adi> --query value -o tsv)"
```
(Search admin key alternatifi: `az search admin-key show --service-name search-rag-prod-3mktjtlo --resource-group rg-rag-prod --query primaryKey -o tsv`)

**Tercih B — scripts/.env dosyası:** `scripts/.env` içinde `AZURE_OPENAI_API_KEY` ve `AZURE_SEARCH_KEY` doluysa script onları otomatik okur (load_dotenv). Yoksa Mert'ten iste veya Tercih A'yı kullan.

> ⚠️ Anahtarları ASLA commit etme / log'a basma. `scripts/.env` zaten .gitignore'da.

## 4) Bağımlılıklar
```bash
cd C:/Users/pc/Claude/website/scripts
python -m pip install -r requirements.txt   # openai, azure-search-documents, langchain-text-splitters, tiktoken, python-dotenv
```
Python yoksa: PATH'te `python`/`py` bul; gerekiyorsa `py -3` kullan. (api/ Python 3.11 ile çalışıyor.)

## 5) ÇALIŞTIR (önce kuru deneme!)
```bash
cd C:/Users/pc/Claude/website/scripts
python index_blog.py --dry-run     # Azure'a YAZMAZ — neyin index'leneceğini ve örnek chunk'ı gösterir
# çıktı doğruysa:
python index_blog.py               # gerçek index'leme (yalnız yeni/değişen yazılar)
```
Bayraklar: `--force` (hepsini yeniden) · `--include-drafts` (taslakları da). 
Mert onaylamadıkça `--include-drafts` KULLANMA.

## 6) Doğrula
```bash
# A) Index'te blog chunk'ı var mı (source filtresi):
#    Azure portal > search-rag-prod > documents-index > Search explorer:  search=*  filter: search.ismatch('blog','source')
# B) Chat gerçekten blogdan cevap veriyor mu:
curl -s -X POST "https://func-rag-prod-3mktjtlolzx3q.azurewebsites.net/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"What is the difference between FFN and LSD segmentation?","conversation_history":[]}' | python -m json.tool
# -> cevap blog içeriğinden gelmeli ve citations içinde mertoshi.online/blog/... görünmeli
```
Lundo arayüzünde (localhost veya canlı) bir blog sorusu sorup kaynak rozetini de kontrol et.

## 7) Opsiyonel ince ayar
- Kapsamı artır: `api/function_app.py` → `get_data_source_config()` → `"top_n_documents": 5` → `8`.
  Değiştirirsen backend'i yeniden yayınla: `cd api && func azure functionapp publish func-rag-prod-3mktjtlolzx3q`.
- Yeni blog ekleyince: tekrar `python index_blog.py` (sadece yeniyi ekler). Chunk stratejisi değişirse `--force`.

## 8) Sorun giderme
- "AZURE_*_KEY boş" → Adım 3 (Key Vault veya .env).
- "model/deployment not found" → embedding deployment adı `text-embedding-3-large-957047` mi, endpoint doğru mu.
- "Rate limit" → script'te `time.sleep(0.3)` değerini 0.5'e çıkar.
- Vektör boyutu/şema hatası → index şeması `content_vector` 3072-dim bekliyor; embedding modeli text-embedding-3-large olmalı.
- Çok dilli isteniyorsa → `index_blog.py` içindeki `english_blog_files()` filtresini gevşet, `source`'a dil etiketi ekle.

## EK: script yoksa yeniden oluştur
`scripts/index_blog.py` mevcut. Silinmişse: İngilizce `.mdx`'leri oku → frontmatter + `<Bileşen/>`
etiketlerini temizle (`{/* */}`, `<Aside title="X">`→X, self-closing ve paired JSX sil, `![..]()` sil,
`[t](u)`→t, başlık #'leri, `>` ve tablo `|` temizle, `**`/`` ` `` kaldır) → RecursiveCharacterTextSplitter
(chunk_size=1000, overlap=200, tiktoken len) → her chunk'a `text-embedding-3-large-957047` ile embedding →
`documents-index`'e `{id:"blog-<slug>-chunkN", content, title, source:"https://mertoshi.online/blog/<slug>", chunk_id, content_vector}` yükle. Detaylı kullanım: `scripts/BLOG_RAG.md`.
