import os
import glob
import time
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.search.documents import SearchClient
from openai import AzureOpenAI

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
    """PDF'ten metin çıkarır (Sayfa sayfa)."""
    print(f"📄 Okunuyor: {file_path}...")
    with open(file_path, "rb") as f:
        poller = doc_client.begin_analyze_document("prebuilt-read", document=f)
        result = poller.result()

    pages_text = []
    for page in result.pages:
        # Her sayfanın metnini birleştir
        text = " ".join([line.content for line in page.lines])
        pages_text.append({"page_num": page.page_number, "content": text})
    
    print(f"   ✅ {len(pages_text)} sayfa okundu.")
    return pages_text

def generate_embedding(openai_client, text):
    """Metni vektöre çevirir."""
    # Metni çok uzunsa burada split etmek gerekebilir (Chunking).
    # Basitlik için sayfa bazlı yapıyoruz ama production'da 
    # LangChain TextSplitter kullanmak daha iyidir.
    response = openai_client.embeddings.create(
        input=text,
        model=EMBEDDING_DEPLOYMENT
    )
    return response.data[0].embedding

def index_files(folder_path="data"):
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
        
        # 1. Metni Çıkar
        pages = extract_text_from_pdf(doc_client, pdf_file)
        
        # 2. Vektör Oluştur ve Hazırla
        for page in pages:
            content = page["content"]
            if not content.strip(): 
                continue

            # Embedding al
            vector = generate_embedding(openai_client, content)

            # Search Dokümanı Yapısı
            doc = {
                "id": f"{filename}-{page['page_num']}".replace(".", "_").replace(" ", "_"),
                "content": content,
                "title": filename,
                "source": filename,
                "chunk_id": page["page_num"],
                "content_vector": vector
            }
            documents_to_upload.append(doc)
            print(f"   🧩 Vektör oluşturuldu: Sayfa {page['page_num']}")
            time.sleep(0.5) # Rate limit koruması

    # 3. Search'e Yükle
    if documents_to_upload:
        print(f"🚀 {len(documents_to_upload)} parça Azure AI Search'e yükleniyor...")
        result = search_client.upload_documents(documents=documents_to_upload)
        print("✅ Yükleme Tamamlandı!")
    else:
        print("Yüklenecek veri yok.")

if __name__ == "__main__":
    # 'data' klasörüne PDF atıp çalıştırın
    if not os.path.exists("data"):
        os.makedirs("data")
        print("Rehber: 'data' klasörü oluşturuldu. Lütfen PDF dosyalarınızı buraya atın.")
    else:
        index_files("data")
