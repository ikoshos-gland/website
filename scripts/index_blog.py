"""
Blog yazılarını (İngilizce .mdx) Azure AI Search 'documents-index'ine indexler.
Lundo (RAG chatbot) böylece blog içeriğine erişip kaynak gösterebilir.

PDF script'inden (index_documents.py) farkı:
  - Document Intelligence YOK — markdown zaten düz metin.
  - Sadece İngilizce dosyaları alır (.tr.mdx / .de.mdx atlanır).
  - Frontmatter ve <Bileşen /> etiketleri temizlenir, sonra chunk + embedding + upload.

Aynı index, aynı şema, aynı embedding modeli → mevcut backend hiç değişmeden çalışır.

KULLANIM (bloglar bitince):
  cd scripts
  cp .env.example .env        # AZURE_OPENAI_API_KEY ve AZURE_SEARCH_KEY doldur
  pip install -r requirements.txt
  python index_blog.py --dry-run     # önce kuru deneme (Azure'a yazmaz, sadece gösterir)
  python index_blog.py               # gerçek index'leme (yalnız yeni/değişen yazılar)
  python index_blog.py --force       # hepsini yeniden index'le
  python index_blog.py --include-drafts   # draft:true yazıları da ekle
"""

import os
import re
import glob
import sys
import time
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from openai import AzureOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
import tiktoken

load_dotenv(override=True)

# --- Konfigürasyon (index_documents.py ile birebir aynı) ---------------------
OPENAI_ENDPOINT = "https://vectorizervascularr.cognitiveservices.azure.com"
OPENAI_KEY = os.getenv("AZURE_OPENAI_API_KEY")
EMBEDDING_DEPLOYMENT = "text-embedding-3-large-957047"

SEARCH_ENDPOINT = "https://search-rag-prod-3mktjtlo.search.windows.net"
SEARCH_KEY = os.getenv("AZURE_SEARCH_KEY")
INDEX_NAME = "documents-index"

BLOG_DIR = os.path.join(os.path.dirname(__file__), "..", "content", "blog")
SITE_URL = "https://mertoshi.online"

# --- Yardımcılar -------------------------------------------------------------

def sanitize_key(text):
    """Azure AI Search document key'i için geçerli karakterler: a-z A-Z 0-9 - _ ="""
    s = re.sub(r"[^a-zA-Z0-9\-_=]", "_", text)
    s = re.sub(r"_+", "_", s)
    return s.strip("_")


def parse_frontmatter(raw):
    """--- bloğundan title/excerpt/draft alır, gövdeyi döndürür."""
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw, flags=re.DOTALL)
    meta, body = {}, raw
    if m:
        body = m.group(2)
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip().strip('"').strip("'")
    return meta, body


def mdx_to_text(body):
    """MDX gövdesini RAG için düz metne indirger (etiketleri/markdown'ı temizler)."""
    t = body
    t = re.sub(r"\{/\*.*?\*/\}", "", t, flags=re.DOTALL)            # {/* yorum */}
    t = re.sub(r'<Aside\s+title="([^"]*)"\s*>', r"\1\n", t)          # Aside başlığını koru
    t = re.sub(r"<[A-Z][A-Za-z0-9]*\b[^>]*/>", "", t)               # <Bilesen ... /> sil
    t = re.sub(r"</?[A-Za-z][A-Za-z0-9]*\b[^>]*>", "", t)            # diğer açılış/kapanış etiketleri
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", t)                       # görseller
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t)                   # [metin](url) -> metin
    t = re.sub(r"^#{1,6}\s*", "", t, flags=re.MULTILINE)            # başlık #'leri
    t = re.sub(r"^>\s?", "", t, flags=re.MULTILINE)                 # alıntı >
    t = re.sub(r"^\s*\|.*\|\s*$", lambda mm: mm.group(0).replace("|", " "), t, flags=re.MULTILINE)  # tablo |
    t = t.replace("**", "").replace("`", "")
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def english_blog_files(include_drafts=False):
    """content/blog içindeki İngilizce (.mdx, .tr/.de değil) yazıları döndürür."""
    out = []
    for path in sorted(glob.glob(os.path.join(BLOG_DIR, "*.mdx"))):
        if re.search(r"\.(tr|de)\.mdx$", path):
            continue  # çeviriler atlanır — yalnız İngilizce
        raw = open(path, encoding="utf-8").read()
        meta, _ = parse_frontmatter(raw)
        if (meta.get("draft", "false") == "true") and not include_drafts:
            continue  # taslakları atla
        if meta.get("comingSoon", "false") == "true":
            # Sitede gizlenen metin: indekslenirse bot, okuyucunun sayfada
            # göremediği İngilizce metinden cevap verir ve o URL'yi kaynak
            # gösterir. include_drafts bunu açmaz — taslak değil, saklı.
            continue
        out.append((path, raw, meta))
    return out


def slug_of(path):
    name = os.path.basename(path).replace(".mdx", "")
    return re.sub(r"^\d+[-_]", "", name)


def make_chunks(text):
    enc = tiktoken.encoding_for_model("text-embedding-3-large")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=200,
        length_function=lambda s: len(enc.encode(s)),
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_text(text)


def get_indexed_sources(search_client):
    try:
        results = search_client.search(search_text="*", select="source", top=2000)
        return {r["source"] for r in results if "source" in r}
    except Exception as e:
        print(f"   ⚠️  Mevcut index okunamadı: {e}")
        return set()


# --- Ana akış ----------------------------------------------------------------

def run(force=False, include_drafts=False, dry_run=False):
    posts = english_blog_files(include_drafts=include_drafts)
    if not posts:
        print("📂 İngilizce blog yazısı bulunamadı (content/blog/*.mdx).")
        return

    print(f"📚 {len(posts)} İngilizce yazı bulundu" + (" (taslaklar dahil)" if include_drafts else ""))

    openai_client = search_client = None
    indexed = set()
    if not dry_run:
        if not OPENAI_KEY or not SEARCH_KEY:
            print("❌ HATA: .env içinde AZURE_OPENAI_API_KEY ve AZURE_SEARCH_KEY dolu olmalı.")
            return
        openai_client = AzureOpenAI(api_key=OPENAI_KEY, api_version="2024-12-01-preview", azure_endpoint=OPENAI_ENDPOINT)
        search_client = SearchClient(SEARCH_ENDPOINT, INDEX_NAME, AzureKeyCredential(SEARCH_KEY))
        if not force:
            indexed = get_indexed_sources(search_client)

    docs = []
    for path, raw, meta in posts:
        slug = slug_of(path)
        title = meta.get("title", slug)
        source = f"{SITE_URL}/blog/{slug}"

        if source in indexed and not force:
            print(f"   ⏭️  atlanıyor (zaten index'li): {title}")
            continue

        body = parse_frontmatter(raw)[1]
        text = mdx_to_text(body)
        # Her chunk'ın bağlamı bilmesi için başlığı başa ekle
        text = f"Blog post: {title}\n\n{text}"
        chunks = make_chunks(text)
        print(f"   🧩 {title}: {len(chunks)} chunk")

        for i, chunk in enumerate(chunks, 1):
            doc = {
                "id": sanitize_key(f"blog-{slug}-chunk{i}"),
                "content": chunk,
                "title": title,
                "source": source,
                "chunk_id": i,
            }
            if not dry_run:
                doc["content_vector"] = openai_client.embeddings.create(
                    input=chunk, model=EMBEDDING_DEPLOYMENT
                ).data[0].embedding
                time.sleep(0.3)  # rate limit
            docs.append(doc)

    print(f"\n📦 Toplam {len(docs)} chunk hazır.")

    if dry_run:
        print("🧪 DRY-RUN: Azure'a hiçbir şey yazılmadı. (gerçek için --dry-run'ı kaldır)")
        if docs:
            print(f"   Örnek chunk:\n   ---\n   {docs[0]['content'][:300]}...\n   ---")
        return

    if not docs:
        print("✅ Yeni/değişen yazı yok.")
        return

    for i in range(0, len(docs), 100):
        batch = docs[i:i + 100]
        search_client.upload_documents(documents=batch)
        print(f"   🚀 Batch {i // 100 + 1}: {len(batch)} chunk yüklendi")
    print(f"\n✅ {len(docs)} blog chunk'ı 'documents-index'e indexlendi!")


if __name__ == "__main__":
    run(
        force="--force" in sys.argv,
        include_drafts="--include-drafts" in sys.argv,
        dry_run="--dry-run" in sys.argv,
    )
