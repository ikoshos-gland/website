# Blogları Lundo'ya (RAG) ekleme — yol haritası

Amaç: İngilizce blog yazılarını Azure AI Search `documents-index`'ine ekleyip
chatbot Lundo'nun blog içeriğine erişip **kaynak göstermesini** sağlamak.

Script hazır: `scripts/index_blog.py`. **Backend'e dokunmaya gerek yok** — aynı index,
aynı şema, aynı embedding modeli. Bloglarını bitirince aşağıdaki adımları izle.

## Ne zaman çalıştırmalı
- Yazıların **bitince** (ve `draft: false` olunca). Yeni/değişen bir yazı ekledikçe
  tekrar çalıştır; script sadece **yeni** yazıları ekler (mevcutları atlar).

## Adımlar

```bash
cd scripts

# 1) Anahtarlar (bir kez):
cp .env.example .env
#   .env içine doldur:  AZURE_OPENAI_API_KEY=...   ve   AZURE_SEARCH_KEY=...
#   (Bu script Document Intelligence kullanmaz; o iki anahtar yeter.)

# 2) Bağımlılıklar (bir kez):
pip install -r requirements.txt

# 3) Önce KURU DENEME — Azure'a yazmaz, sadece neyin index'leneceğini gösterir:
python index_blog.py --dry-run

# 4) Gerçek index'leme (yalnız yeni/değişen yazılar):
python index_blog.py
```

İsteğe bağlı bayraklar:
- `--force` → tüm yazıları yeniden index'le (chunk stratejisini değiştirdiysen)
- `--include-drafts` → `draft: true` yazıları da ekle (test için)

## Ne yapıyor (özet)
1. `content/blog/*.mdx` içinden **yalnız İngilizce** dosyaları alır (`.tr.mdx`/`.de.mdx` atlanır).
2. Frontmatter ve `<Bileşen />` etiketlerini temizleyip düz metne indirir.
3. ~750 token'lık parçalara böler, her parçayı embed eder.
4. `documents-index`'e şu şemayla yükler: `{id, content, title, source, chunk_id, content_vector}`
   — `source` = `https://mertoshi.online/blog/<slug>` (Lundo kaynak olarak gösterir).

## Doğrulama (index'ledikten sonra)
Lundo'ya bir blog sorusu sor, örn:
> "FFN ile LSD segmentasyon arasındaki fark ne?"

Cevap blog içeriğinden gelmeli ve kaynakta blog yazısı görünmeli.

## İnce ayar (opsiyonel, sonra)
- Daha geniş kapsam istiyorsan `api/function_app.py` içinde `top_n_documents` 5 → 8.
- Maliyet çok düşük (5 yazı için embedding ~birkaç sent).

## Çok dilli not
- Şimdilik yalnız İngilizce index'leniyor (en kapsamlı/temiz kaynak). Lundo İngilizce
  kaynaktan her dilde cevap verebilir. İleride TR/DE de istersen `index_blog.py` içindeki
  `english_blog_files()` filtresini gevşetip dile göre `source` etiketi eklemen yeter.
