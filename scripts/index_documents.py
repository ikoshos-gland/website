import os
import glob
import time
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

def generate_embedding(openai_client, text):
    """Metni vektöre çevirir."""
    response = openai_client.embeddings.create(
        input=text,
        model=EMBEDDING_DEPLOYMENT
    )
    return response.data[0].embedding

def index_files(folder_path="data"):
    """
    PDF dosyalarını indexler (semantic chunking ile).
    """
    doc_client, openai_client, search_client = init_clients()
    if not doc_client:
        return

    pdf_files = glob.glob(os.path.join(folder_path, "*.pdf"))
    if not pdf_files:
        print(f"📂 '{folder_path}' klasöründe PDF bulunamadı.")
        return

    documents_to_upload = []

    for pdf_file in pdf_files:
        filename = os.path.basename(pdf_file)
        print(f"\n{'='*60}")
        print(f"📚 İşleniyor: {filename}")
        print(f"{'='*60}")

        # 1. PDF'ten Metin Çıkar (Document Intelligence)
        full_text, page_boundaries = extract_text_from_pdf(doc_client, pdf_file)

        if not full_text.strip():
            print(f"   ⚠️  Döküman boş, atlanıyor.")
            continue

        # 2. Semantic Chunking
        chunks = create_semantic_chunks(full_text, page_boundaries)

        # 3. Her Chunk için Embedding Oluştur
        print(f"   🔄 Embedding'ler oluşturuluyor...")
        for chunk in chunks:
            content = chunk["content"]

            # Embedding al
            vector = generate_embedding(openai_client, content)

            # Search Dokümanı Yapısı
            doc = {
                "id": f"{filename}-chunk{chunk['chunk_id']}".replace(".", "_").replace(" ", "_"),
                "content": content,
                "title": filename,
                "source": filename,
                "chunk_id": chunk["chunk_id"],
                "content_vector": vector
            }
            documents_to_upload.append(doc)

            print(f"   ✅ Chunk {chunk['chunk_id']}/{len(chunks)} | Page {chunk['page_num']} | {chunk['token_count']} tokens")
            time.sleep(0.3)  # Rate limit koruması

    # 4. Toplu Yükleme
    if documents_to_upload:
        print(f"\n{'='*60}")
        print(f"🚀 {len(documents_to_upload)} chunk Azure AI Search'e yükleniyor...")
        print(f"{'='*60}")

        # Batch upload (1000'lik gruplar halinde)
        batch_size = 100
        for i in range(0, len(documents_to_upload), batch_size):
            batch = documents_to_upload[i:i + batch_size]
            result = search_client.upload_documents(documents=batch)
            print(f"   📦 Batch {i//batch_size + 1}: {len(batch)} chunk yüklendi")

        print(f"\n✅ Tüm dökümanlar başarıyla indexlendi!")
        print(f"   📊 Toplam: {len(documents_to_upload)} semantic chunk")
    else:
        print("⚠️  Yüklenecek veri yok.")

if __name__ == "__main__":
    # 'data' klasörüne PDF atıp çalıştırın
    if not os.path.exists("data"):
        os.makedirs("data")
        print("Rehber: 'data' klasörü oluşturuldu. Lütfen PDF dosyalarınızı buraya atın.")
    else:
        index_files("data")
