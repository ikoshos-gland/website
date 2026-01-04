import os
import glob
import time
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.search.documents import SearchClient
from openai import AzureOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
import tiktoken

# .env dosyasını yükle (API anahtarları için)
load_dotenv(override=True)

# -------------------------------------------------------------------------
# KONFIGÜRASYON
# -------------------------------------------------------------------------

# 1. Document Intelligence (Yeni Oluşturduğunuz)
DOC_INTEL_ENDPOINT = os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT")
DOC_INTEL_KEY = os.getenv("AZURE_FORM_RECOGNIZER_KEY")

# 2. Azure OpenAI (Embedding & Chat)
OPENAI_ENDPOINT = "https://vectorizervascularr.cognitiveservices.azure.com"
OPENAI_KEY = os.getenv("AZURE_OPENAI_API_KEY") # 84ga... olan
EMBEDDING_DEPLOYMENT = "text-embedding-3-large-957047"

# 3. Azure AI Search
SEARCH_ENDPOINT = "https://search-rag-prod-3mktjtlo.search.windows.net"
SEARCH_KEY = os.getenv("AZURE_SEARCH_KEY")
INDEX_NAME = "documents-index"

def sanitize_key(text):
    """
    Azure AI Search document key'i için geçerli karakterlere dönüştürür.
    Allowed: letters, digits, underscore (_), dash (-), equal sign (=)
    """
    # Replace invalid characters with underscore
    # Keep only: a-z, A-Z, 0-9, -, _, =
    sanitized = re.sub(r'[^a-zA-Z0-9\-_=]', '_', text)

    # Remove consecutive underscores
    sanitized = re.sub(r'_+', '_', sanitized)

    # Remove leading/trailing underscores
    sanitized = sanitized.strip('_')

    return sanitized

def init_clients():
    """Tüm client'ları başlat."""
    if not all([DOC_INTEL_ENDPOINT, DOC_INTEL_KEY, OPENAI_KEY, SEARCH_KEY]):
        print("HATA: Lütfen .env dosyasını tüm anahtarlarla doldurun!")
        return None, None, None

    # Document Intelligence Client
    doc_client = DocumentAnalysisClient(
        endpoint=DOC_INTEL_ENDPOINT, 
        credential=AzureKeyCredential(DOC_INTEL_KEY)
    )

    # OpenAI Client
    openai_client = AzureOpenAI(
        api_key=OPENAI_KEY,
        api_version="2024-12-01-preview",
        azure_endpoint=OPENAI_ENDPOINT
    )

    # Search Client
    search_client = SearchClient(
        endpoint=SEARCH_ENDPOINT,
        index_name=INDEX_NAME,
        credential=AzureKeyCredential(SEARCH_KEY)
    )

    return doc_client, openai_client, search_client

def extract_text_from_pdf(doc_client, file_path):
    """PDF'ten metin çıkarır (Tüm döküman birleştirilmiş)."""
    print(f"📄 Okunuyor: {file_path}...")
    with open(file_path, "rb") as f:
        poller = doc_client.begin_analyze_document("prebuilt-read", document=f)
        result = poller.result()

    # Tüm sayfaları birleştir (semantic chunking için)
    full_text = ""
    page_boundaries = []  # Her sayfanın başlangıç pozisyonunu tut

    for page in result.pages:
        page_start = len(full_text)
        page_boundaries.append({
            "page_num": page.page_number,
            "start_pos": page_start
        })

        # Sayfanın metnini ekle
        page_text = " ".join([line.content for line in page.lines])
        full_text += page_text + "\n\n"  # Sayfa aralarına boşluk

    print(f"   ✅ {len(result.pages)} sayfa okundu, toplam {len(full_text)} karakter.")
    return full_text, page_boundaries

def create_semantic_chunks(text, page_boundaries):
    """
    Metni semantic chunking ile böler (akademik makaleler için optimize edilmiş).

    Args:
        text: Tüm döküman metni
        page_boundaries: Her sayfanın başlangıç pozisyonu

    Returns:
        List of chunks with metadata
    """
    # Token counter (OpenAI embedding modeli için)
    encoding = tiktoken.encoding_for_model("text-embedding-3-large")

    # Semantic Text Splitter (akademik makaleler için optimize)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,           # ~750-800 token (güvenli limit)
        chunk_overlap=200,          # Context korunması için overlap
        length_function=lambda t: len(encoding.encode(t)),  # Token bazlı
        separators=[
            "\n\n",                 # Paragraf (en önemli)
            "\n",                   # Satır
            ". ",                   # Cümle
            " ",                    # Kelime
            ""                      # Karakter (fallback)
        ],
        is_separator_regex=False
    )

    # Chunking yap
    chunks = text_splitter.split_text(text)

    print(f"   🧩 {len(chunks)} semantic chunk oluşturuldu (avg ~{len(text)//len(chunks) if chunks else 0} char/chunk)")

    # Her chunk için sayfa numarasını bul
    chunks_with_metadata = []
    current_pos = 0

    for i, chunk in enumerate(chunks):
        # Bu chunk hangi sayfada başlıyor?
        chunk_page = 1
        for boundary in page_boundaries:
            if current_pos >= boundary["start_pos"]:
                chunk_page = boundary["page_num"]

        chunks_with_metadata.append({
            "content": chunk,
            "chunk_id": i + 1,
            "page_num": chunk_page,
            "token_count": len(encoding.encode(chunk))
        })

        # Bir sonraki chunk'ın pozisyonunu tahmin et (overlap düşülerek)
        current_pos += len(chunk) - 200  # overlap kadar geri git

    return chunks_with_metadata

def get_indexed_sources(search_client):
    """
    Azure AI Search'te zaten indexlenmiş PDF'lerin listesini döndürür.

    Returns:
        set: Indexlenmiş PDF dosya isimleri (set)
    """
    try:
        # Search'te unique source'ları al
        results = search_client.search(
            search_text="*",
            select="source",
            top=1000  # Max chunk sayısı
        )

        indexed_sources = set()
        for result in results:
            if "source" in result:
                indexed_sources.add(result["source"])

        return indexed_sources
    except Exception as e:
        print(f"   ⚠️  Mevcut indexler alınamadı: {e}")
        return set()

def generate_embedding(openai_client, text):
    """Metni vektöre çevirir."""
    response = openai_client.embeddings.create(
        input=text,
        model=EMBEDDING_DEPLOYMENT
    )
    return response.data[0].embedding

def process_single_pdf(pdf_file, doc_client, openai_client, indexed_sources, force_reindex):
    """
    Tek bir PDF'i işler (paralel execution için).

    Returns:
        tuple: (filename, documents_list, success, error_message)
    """
    filename = os.path.basename(pdf_file)

    try:
        # Skip if already indexed
        if filename in indexed_sources and not force_reindex:
            return (filename, [], True, "skipped")

        print(f"📚 İşleniyor: {filename}")

        # 1. PDF'ten Metin Çıkar (Document Intelligence)
        full_text, page_boundaries = extract_text_from_pdf(doc_client, pdf_file)

        if not full_text.strip():
            return (filename, [], False, "Döküman boş")

        # 2. Semantic Chunking
        chunks = create_semantic_chunks(full_text, page_boundaries)

        # 3. Her Chunk için Embedding Oluştur
        documents = []
        print(f"   🔄 {filename}: {len(chunks)} chunk için embedding oluşturuluyor...")

        for chunk in chunks:
            content = chunk["content"]

            # Embedding al
            vector = generate_embedding(openai_client, content)

            # Search Dokümanı Yapısı
            # Sanitize the key to remove invalid characters
            safe_filename = sanitize_key(filename.replace(".pdf", ""))
            doc = {
                "id": f"{safe_filename}-chunk{chunk['chunk_id']}",
                "content": content,
                "title": filename,
                "source": filename,
                "chunk_id": chunk["chunk_id"],
                "content_vector": vector
            }
            documents.append(doc)

            # Rate limiting (daha agresif - paralel olduğu için)
            time.sleep(0.5)

        print(f"   ✅ {filename}: {len(documents)} chunk hazır")
        return (filename, documents, True, None)

    except Exception as e:
        print(f"   ❌ {filename}: Hata - {str(e)}")
        return (filename, [], False, str(e))

def index_files(folder_path="data", force_reindex=False, parallel=False, max_workers=2):
    """
    PDF dosyalarını indexler (semantic chunking ile).

    Args:
        folder_path: PDF'lerin bulunduğu klasör
        force_reindex: True ise tüm dosyaları yeniden indexler
        parallel: True ise paralel processing kullan
        max_workers: Paralel processing için worker sayısı (default: 2)
    """
    doc_client, openai_client, search_client = init_clients()
    if not doc_client:
        return

    pdf_files = glob.glob(os.path.join(folder_path, "*.pdf"))
    if not pdf_files:
        print(f"📂 '{folder_path}' klasöründe PDF bulunamadı.")
        return

    # Zaten indexlenmiş dosyaları al
    if not force_reindex:
        print(f"🔍 Mevcut index kontrol ediliyor...")
        indexed_sources = get_indexed_sources(search_client)
        print(f"   ℹ️  {len(indexed_sources)} döküman zaten indexlenmiş")
    else:
        indexed_sources = set()
        print(f"🔄 Force reindex modu - tüm dosyalar yeniden işlenecek")

    # Filter out already indexed files
    files_to_process = [
        f for f in pdf_files
        if force_reindex or os.path.basename(f) not in indexed_sources
    ]

    skipped_count = len(pdf_files) - len(files_to_process)

    if skipped_count > 0:
        print(f"⏭️  {skipped_count} döküman atlanıyor (zaten indexlenmiş)")

    documents_to_upload = []
    processed_count = 0
    failed_count = 0

    if not files_to_process:
        print(f"\n✅ Hiç yeni döküman yok - tüm PDF'ler zaten indexlenmiş!")
        print(f"   💡 Yeniden indexlemek için: python index_documents.py --force")
        return

    # PARALEL İŞLEM
    if parallel and len(files_to_process) > 1:
        print(f"\n⚡ PARALEL MOD: {max_workers} worker ile {len(files_to_process)} PDF işleniyor...")
        print(f"{'='*60}\n")

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            future_to_pdf = {
                executor.submit(
                    process_single_pdf,
                    pdf_file,
                    doc_client,
                    openai_client,
                    indexed_sources,
                    force_reindex
                ): pdf_file
                for pdf_file in files_to_process
            }

            # Collect results as they complete
            for future in as_completed(future_to_pdf):
                filename, documents, success, error = future.result()

                if error == "skipped":
                    skipped_count += 1
                elif success:
                    documents_to_upload.extend(documents)
                    processed_count += 1
                else:
                    failed_count += 1
                    print(f"   ⚠️  {filename} işlenemedi: {error}")

    # SERI İŞLEM (Default)
    else:
        if parallel:
            print(f"\n📝 SERI MOD: Tek PDF var, paralel gerek yok")

        print(f"\n{'='*60}")

        for pdf_file in files_to_process:
            filename = os.path.basename(pdf_file)

            print(f"\n📚 İşleniyor ({processed_count + 1}/{len(files_to_process)}): {filename}")
            print(f"{'='*60}")

            result_filename, documents, success, error = process_single_pdf(
                pdf_file, doc_client, openai_client, indexed_sources, force_reindex
            )

            if error == "skipped":
                skipped_count += 1
            elif success:
                documents_to_upload.extend(documents)
                processed_count += 1
            else:
                failed_count += 1

    # 4. Toplu Yükleme
    print(f"\n{'='*60}")
    print(f"📊 İşlem Özeti")
    print(f"{'='*60}")
    print(f"   ✅ Başarılı: {processed_count} döküman")
    print(f"   ⏭️  Atlanan: {skipped_count} döküman")
    if failed_count > 0:
        print(f"   ❌ Başarısız: {failed_count} döküman")
    print(f"   📦 Yeni chunk: {len(documents_to_upload)}")

    if documents_to_upload:
        print(f"\n{'='*60}")
        print(f"🚀 {len(documents_to_upload)} chunk Azure AI Search'e yükleniyor...")
        print(f"{'='*60}")

        # Batch upload (100'lük gruplar halinde)
        batch_size = 100
        for i in range(0, len(documents_to_upload), batch_size):
            batch = documents_to_upload[i:i + batch_size]
            result = search_client.upload_documents(documents=batch)
            print(f"   📦 Batch {i//batch_size + 1}: {len(batch)} chunk yüklendi")

        print(f"\n✅ Yeni dökümanlar başarıyla indexlendi!")
        print(f"   📊 Toplam yeni chunk: {len(documents_to_upload)}")
    elif processed_count == 0 and skipped_count > 0:
        print(f"\n✅ Hiç yeni döküman yok - tüm PDF'ler zaten indexlenmiş!")
        print(f"   💡 Yeniden indexlemek için: python index_documents.py --force")

if __name__ == "__main__":
    import sys

    # Parse command line arguments
    force_reindex = "--force" in sys.argv or "-f" in sys.argv
    parallel = "--parallel" in sys.argv or "-p" in sys.argv

    # Get max workers if specified
    max_workers = 2  # default
    for arg in sys.argv:
        if arg.startswith("--workers="):
            try:
                max_workers = int(arg.split("=")[1])
                max_workers = max(1, min(max_workers, 5))  # Limit 1-5
            except:
                pass

    # 'data' klasörüne PDF atıp çalıştırın
    if not os.path.exists("data"):
        os.makedirs("data")
        print("📁 Rehber: 'data' klasörü oluşturuldu. Lütfen PDF dosyalarınızı buraya atın.")
    else:
        print(f"\n🚀 PDF Indexing Script")
        print(f"{'='*60}")
        if force_reindex:
            print(f"⚠️  FORCE REINDEX MODE: Tüm dosyalar yeniden işlenecek")
        else:
            print(f"✅ INCREMENTAL MODE: Sadece yeni dosyalar işlenecek")

        if parallel:
            print(f"⚡ PARALLEL MODE: {max_workers} workers")
        else:
            print(f"📝 SEQUENTIAL MODE")
        print(f"{'='*60}\n")

        index_files("data", force_reindex=force_reindex, parallel=parallel, max_workers=max_workers)

        print(f"\n{'='*60}")
        print(f"✨ İşlem tamamlandı!")
        print(f"{'='*60}")
