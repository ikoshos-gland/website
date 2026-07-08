# Blog Yazım Kılavuzu (MDX Sıfırdan)

Bu kılavuz, **ömründe hiç MDX yazmamış** birinin bu sitedeki blogun **bütün**
özelliklerini kullanabilmesi için yazıldı. Baştan sona oku, ya da ihtiyacın olan
bölüme atla. Her şeyin kopyala-yapıştır örneği var.

İçindekiler:

1. [MDX nedir, 30 saniyede](#1-mdx-nedir-30-saniyede)
2. [Sistem nasıl çalışıyor (büyük resim)](#2-sistem-nasıl-çalışıyor)
3. [İlk yazın: 3 adım](#3-i̇lk-yazın-3-adım)
4. [Frontmatter (üst bilgi) referansı](#4-frontmatter-referansı)
5. [Markdown temelleri](#5-markdown-temelleri)
6. [Kod blokları](#6-kod-blokları)
7. [Matematik (LaTeX / KaTeX)](#7-matematik)
8. [Özel bileşenler (asıl güç burada)](#8-özel-bileşenler)
9. [Resimler nasıl çalışıyor](#9-resimler-nasıl-çalışıyor)
10. [Animasyonlar nasıl çalışıyor](#10-animasyonlar-nasıl-çalışıyor)
11. [Yeni bir animasyon eklemek](#11-yeni-bir-animasyon-eklemek)
12. [Çok dillilik (TR / EN / DE)](#12-çok-dillilik)
13. [Taslak ve yayına alma](#13-taslak-ve-yayına-alma)
14. [Baştan sona tam örnek yazı](#14-tam-örnek-yazı)
15. [Atıflar ve kaynakça (Zotero)](#15-atıflar-ve-kaynakça)
16. [Sık yapılan hatalar](#16-sık-yapılan-hatalar)

---

## 1. MDX nedir, 30 saniyede

**Markdown** = düz metinle biçimli yazı yazma yöntemi. `**kalın**`, `## başlık`,
`- madde` gibi. HTML bilmene gerek yok.

**MDX** = Markdown + React bileşenleri. Yani normal Markdown yazarken, araya
`<SlurmFlow />` gibi **canlı, interaktif bileşenler** koyabilirsin. Markdown'ın
kolaylığı + bir web uygulamasının gücü, aynı dosyada.

Bir MDX dosyası şuna benzer:

```mdx
## Bu bir başlık

Bu normal bir paragraf, içinde **kalın** ve *italik* var.

<SlurmFlow />

Yukarıda canlı bir animasyon var. Aşağıda kod:

​```bash
sbatch job.sbatch
​```
```

Bu kadar. Gerisi detay.

---

## 2. Sistem nasıl çalışıyor

Tek bir kural var: **`content/blog/` klasörüne bir `.mdx` dosyası koyarsan, o
otomatik olarak bir blog yazısı olur.** Başka hiçbir yeri kaydetmen, listeye
eklemen gerekmez. Sistem klasörü kendi tarar (`blog/posts.ts` bunu yapıyor).

### Dosya adı kuralları

Dosya adı şu kalıptadır: **`NNN-slug.dil.mdx`**

| Parça | Ne işe yarar | Örnek |
|---|---|---|
| `NNN` | Sıra numarası (sadece dosyaları düzenli tutmak için) | `002` |
| `slug` | URL'de görünecek ad | `slurm-on-truba` |
| `.dil` | Dil eki (`en` yoksa İngilizce sayılır) | `.tr`, `.de` |

Örnekler:

```
content/blog/002-slurm-on-truba.mdx        → İngilizce (varsayılan), URL: /blog/slurm-on-truba
content/blog/002-slurm-on-truba.tr.mdx     → Türkçe
content/blog/002-slurm-on-truba.de.mdx     → Almanca
```

**Önemli:** URL'deki adres, dosya adından `NNN-` ön eki ve `.dil` eki atılarak
bulunur. Yani üç dil dosyası da **aynı** URL'i (`/blog/slurm-on-truba`) paylaşır,
sadece sitedeki dil değiştiriciyle hangisinin gösterileceği belirlenir. Bir dilin
dosyası yoksa İngilizce'ye düşer.

### Lab yazısı mı, tez bölümü mü?

İki tür var:

- **Lab Günlükleri** (`/blog` → "Lab Logs"): normal yazılar.
- **Tez** (`/thesis`): özel, sıralı bir okuma yolu. Hangi yazıların teze ait
  olduğu `blog/BlogIndex.tsx` içindeki `THESIS_SLUGS` listesinde tanımlı. Yeni
  bir yazı varsayılan olarak Lab tarafında görünür.

---

## 3. İlk yazın: 3 adım

**Adım 1 — Dosyayı oluştur.** `content/blog/` altında `010-merhaba.mdx` adında
bir dosya aç.

**Adım 2 — İçini doldur.** En üste bir **frontmatter** (üç tire arasındaki üst
bilgi) koy, sonra yaz:

```mdx
---
title: Merhaba Dünya
date: 2026-07-07
contentType: lesson
tags: [deneme]
excerpt: İlk blog yazım. Sistemi deniyorum.
draft: true
---
<DropCap>M</DropCap>erhaba! Bu benim ilk MDX yazım.

## Bir başlık

Buraya **kalın** ve *italik* yazabiliyorum.
```

**Adım 3 — Gör.** Geliştirme sunucusu açıksa (`npm run dev`), `localhost:3000/blog`
adresine git. `draft: true` olan yazılar **sadece geliştirme ortamında** görünür,
canlıda görünmez. Böylece hazır olmadan yayınlamazsın.

---

## 4. Frontmatter referansı

Her yazının en üstünde, üç tire (`---`) arasında yer alan üst bilgi. Alanlar:

```yaml
---
title: Kuyruktan GPU İstemek           # Zorunlu. Başlık.
date: 2026-06-23                        # Zorunlu. YYYY-AA-GG. Sıralama buna göre.
contentType: compute                    # 'compute' | 'lab' | 'lesson' (renkli etiket)
tags: [SLURM, HPC, TRUBA]               # Köşeli parantez, virgülle. İlki kicker'da görünür.
excerpt: Kısa özet, liste sayfasında ve giriş animasyonunda görünür.
cover: /img/case-4.webp                 # Kapak görseli yolu (aşağıya bak)
draft: false                            # true = sadece geliştirmede görünür
---
```

Notlar:

- **`contentType`** yazının renkli rozetini belirler: `compute` (gümüş), `lab`
  (altın), `lesson` (yeşil-limon).
- **`tags`** dizisinin **ilk** elemanı, başlığın üstündeki küçük "kicker"
  satırında `contentType · ilk-tag` şeklinde görünür.
- **`excerpt`** iki yerde kullanılır: `/blog` liste sayfasındaki özet, ve bir
  yazı açıldığındaki sinematik giriş animasyonunda (başlığın altında beliren
  metin). Kısa ve çarpıcı tut.
- **`cover`** şu an frontmatter'da **saklanıyor ama sayfada gösterilmiyor**
  (ileride kart/sosyal görsel için hazır duruyor). Yine de doğru bir yol vermen
  iyi olur.
- **`draft: true`** → canlıda gizli, geliştirmede görünür. Yayına almak için
  `false` yap.

---

## 5. Markdown temelleri

Bunların hepsi düz metin. Öğrenmesi 5 dakika.

```md
## İkinci düzey başlık   (sayfada büyük bölüm başlığı olur)
### Üçüncü düzey başlık   (alt başlık)

Normal paragraf. **kalın**, *italik*, `satır-içi kod`.

- Madde işaretli liste
- İkinci madde

1. Numaralı liste
2. İkinci

[Bir bağlantı](https://mertoshi.online)

> Bu bir alıntı kutusu.
```

### "Ders" kutusu deseni

Bu blogda alıntı kutuları özellikle şık görünür. İçine **kalın bir etiketle**
başlarsan (örneğin `**Ders:**`), etiket altın renkli, mono fontla, vurgulu çıkar:

```md
> **Ders:** JAX/absl ile eğitim kaybı stderr'e yazılır, stdout'a değil.
```

> **Stil notu:** Bu blogda **em dash (—)** ve **noktalı virgül (;)** kullanma.
> Yerine nokta, virgül, iki nokta veya parantez kullan. Kod bloklarındaki
> gerçek kod (Python `;`, `--flag` çift tireleri) elbette dokunulmaz.

### Tablolar

```md
| Bölüm | Ne için | Sınır |
|---|---|---|
| akya-cuda | GPU eğitimi | Sık dolu |
| debug | Hızlı test | Maks ~4 saat |
```

### Yatay çizgi

```md
---
```

---

## 6. Kod blokları

Üç ters-tırnak (`` ``` ``) arasına, dil adı vererek:

````md
```bash
sbatch -p debug job.sbatch
```

```python
import jax
print(jax.device_count())
```
````

Satır-içi kod için tek ters-tırnak: `` `sbatch` `` → `sbatch`.

Dil adı (`bash`, `python`, `text`...) sözdizimi rengini/etiketini belirler.

---

## 7. Matematik

LaTeX destekleniyor (KaTeX ile). İki türlü:

```md
Satır içi: kütle-enerji ilişkisi $E = mc^2$ şeklindedir.

Blok (ortalı, kendi kutusunda):

$$
\text{global batch} = \text{per\_device\_batch} \times N_\text{GPU}
$$
```

`$...$` satır içi, `$$...$$` blok. Karmaşık formüller, kesirler, toplamlar hepsi
çalışır.

---

## 8. Özel bileşenler

Asıl fark burada. Bunlar MDX'e gömebileceğin hazır React bileşenleri. **Hiçbirini
import etmen gerekmez** — hepsi her yazıda otomatik hazır (`blog/mdxComponents.tsx`
içinde tanımlılar). Sadece etiketini yaz.

### DropCap — büyük ilk harf

Paragrafın ilk harfini gazete gibi büyütür. Genelde yazının ilk cümlesinde:

```mdx
<DropCap>K</DropCap>uyruk sistemini ilk kez gördüğümde...
```

### Pull — vurgu cümlesi (pull quote)

Ortalı, büyük, italik bir vurgu. Bölüm aralarında nefes aldırır:

```mdx
<Pull>Bir program çalıştıran kullanıcı değilsin. Sipariş veren bir müşterisin.</Pull>
```

### Aside — kenar notu

Ana metnin yanına (geniş ekranda sağa) düşen küçük not:

```mdx
<Aside title="İpucu">
debug bölümü ~4 saatle sınırlı ama hemen başlar.
</Aside>
```

### Console — terminal kutusu

Terminal çıktısını sahici gösterir (üç renkli nokta + başlık). `body` içine
çok satırlı metin yazabilirsin (tırnak içinde satır atlayarak):

```mdx
<Console title="squeue -u avural" body="JOBID    ST  TIME
1234567  PD  0:00
1234568   R  0:42" />
```

### Figure — altyazılı resim

Resmi çerçeveli ve altyazılı gösterir (aşağıdaki [Resimler](#9-resimler-nasıl-çalışıyor)
bölümüne de bak):

```mdx
<Figure src="/img/case-4.webp" alt="GPU kümesi" caption="TRUBA'nın GPU düğümleri." />
```

### Term — sözlük terimi (hover'da tanım)

Metindeki bir terimin altına noktalı çizgi çeker, üstüne gelince (dile göre)
tanımını gösterir. Tanımlar `blog/glossary.ts` içinde. Mevcut anahtarlardan
bazıları: `connectome`, `synapse`, `voxel`, `segmentation`.

```mdx
Beyni bir <Term k="connectome">konnektom</Term> olarak modelliyoruz.
```

Anahtar sözlükte yoksa bileşen sessizce sadece metni gösterir (bir şey bozulmaz).
Yeni terim eklemek için `blog/glossary.ts`'e `en/tr/de` tanımıyla bir giriş ekle.

---

## 9. Resimler nasıl çalışıyor

Çok basit bir kural: **resimler `public/img/` klasöründe durur, MDX'te `/img/...`
diye çağrılır.**

**Adım 1 — Resmi koy.** Dosyayı `public/img/` altına at. Format olarak **`.webp`**
tercih et (küçük boyut, hızlı). Mevcut örnekler: `case-1.webp` … `case-6.webp`.

**Adım 2 — Çağır.** İki yol:

Basit Markdown resmi:

```md
![Açıklama metni](/img/benim-resmim.webp)
```

Ya da çerçeveli + altyazılı (önerilen) `Figure` bileşeni:

```mdx
<Figure src="/img/benim-resmim.webp" alt="Açıklama" caption="Altyazı burada." />
```

**Neden `/img/...`?** `public/` klasöründeki her şey sitenin köküne kopyalanır.
Yani `public/img/x.webp` dosyası, tarayıcıda `/img/x.webp` adresinden servis edilir.
Yola `public` yazma, doğrudan `/img/...` ile başla.

**Resimler tembel (lazy) yüklenir** — `Figure` ve normal resimler ekrana gelene
kadar indirilmez, böylece sayfa hızlı açılır. Bunu sen ayarlamıyorsun, otomatik.

> Not: `cover:` frontmatter alanı da bir resim yolu alır ama şu an sayfada
> gösterilmiyor (ileride kart görseli için ayrılmış). Yazının içinde görsel
> istiyorsan `Figure` ya da `![]()` kullan.

---

## 10. Animasyonlar nasıl çalışıyor

Animasyonlar da birer bileşen. MDX'e etiketini koyarsın, gerisini kendi halleder.
Hepsi:

- **interaktiftir** (tıkla, kaydır, üstüne gel),
- **üç dillidir** (kendi altyazılarını TR/EN/DE taşırlar, sen çeviri yazmazsın),
- **hareket-azaltma** ayarına saygılıdır (kullanıcı sisteminde "reduce motion"
  açıksa sakinleşir).

### Hazır animasyonlar

Tek yapman gereken etiketi yazmak. Örnek: `<SlurmFlow />`

**Genel amaçlı / TRUBA (bu yazıda kullanılıyor):**

| Etiket | Ne gösterir |
|---|---|
| `<SlurmFlow />` | Bir işin yolculuğu: dizüstü → login → kuyruk → compute |
| `<PartitionQueue />` | `squeue` panosu: dolu akya-cuda vs boş debug, tıkla-gönder |
| `<WallClock />` | `--time` giyotini: bütçe yetersizse iş ortada ölür |
| `<InodeContainer />` | pip'in binlerce dosyası vs tek `.sif`, inode kotası |

**Tez / laboratuvar temalı (mevcut, istersen kullan):**

| Etiket | Ne gösterir |
|---|---|
| `<ExpansionMicro />` | Genişletme mikroskopisi: numune sabit lensle büyür |
| `<ScaleEscalation />` | Konnektomik ölçek duvarı: nöron sayıları, petabayt |
| `<FFNFlood />` | FFN taşkın-doldurma segmentasyonu |
| `<DiffractionLimit />` | Işık kırınımı sınırı |
| `<ExpansionChemistry />` | Genişletme jeli kimyası |
| `<SplitMerge />` | Bölme/birleştirme düzeltmesi (proofreading) |
| `<FFNvsLSD />` | FFN ile LSD yönteminin karşılaştırması |
| `<LabPipeline />` | Laboratuvar iş akışı adımları |
| `<GloveBoxGelation />` | Glove box'ta jelleşme |
| `<ClaheHistogram />` | CLAHE histogram eşitleme |
| `<SofimaMontage />` | SOFIMA ile montaj/dikişleme |

Kullanımı hepsinde aynı, kendi kendine kapanan bir etiket:

```mdx
Aşağıda kuyruğun nasıl işlediği:

<SlurmFlow />

Gördüğün gibi hiçbir iş sırayı atlamıyor.
```

### Perde arkası (nasıl çalışıyor)

Her animasyon `blog/` klasöründe bir React bileşenidir (`blog/SlurmFlow.tsx` gibi).
Üç şeyle bağlanır:

1. **Dosya:** `blog/SlurmFlow.tsx` — çizim + etkileşim mantığı burada.
2. **Kayıt:** `blog/mdxComponents.tsx` içinde import edilip listeye eklenir.
   Sadece burada kayıtlı bileşenler MDX'te etiketle çağrılabilir.
3. **Kullanım:** MDX'te `<SlurmFlow />` yazarsın.

Çoğu animasyon SVG değil, **DOM + CSS** ile yapılır (daha güvenli, her yerde
çalışır). Stiller `blog/blog.css` içinde `blg-` önekli sınıflarda.

---

## 11. Yeni bir animasyon eklemek

Diyelim yepyeni bir `<MyThing />` animasyonu istiyorsun. Üç adım:

**Adım 1 — Bileşeni yaz.** `blog/MyThing.tsx` oluştur. Mevcut bir tanesini
(`blog/WallClock.tsx` iyi bir şablon) kopyalayıp uyarla. Uyulacak desen:

```tsx
import React, { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// Görünen bütün metinleri üç dilde tut (sen MDX'te çeviri yazmayasın diye).
const STR = {
  en: { caption: 'What this shows.' },
  tr: { caption: 'Bunun gösterdiği şey.' },
  de: { caption: 'Was das zeigt.' },
};

export default function MyThing() {
  const t = STR[(useLang().lang || 'en') as 'en' | 'tr' | 'de'];
  const [on, setOn] = useState(false);
  return (
    <figure className="blg-mything">
      <button className="blg-btn" onClick={() => setOn(!on)}>{on ? 'Açık' : 'Kapalı'}</button>
      <figcaption>{t.caption}</figcaption>
    </figure>
  );
}
```

**Adım 2 — Kaydet.** `blog/mdxComponents.tsx` içine ekle:

```tsx
import MyThing from './MyThing';
// ...
export const mdxComponents = {
  // ...mevcutlar...
  MyThing,
};
```

**Adım 3 — Stil (isteğe bağlı).** `blog/blog.css`'e `.blg-mything { ... }` ekle.
Renkler için hazır değişkenler var: `var(--gold-a)`, `var(--lime)`, `var(--hair)`,
`var(--ink-bright)` vb.

Sonra herhangi bir MDX'te `<MyThing />` yazman yeterli. Üç dilde de çalışır.

**Kural:** Görünen metinleri bileşenin içindeki `STR` nesnesinde üç dilde tut,
`prefers-reduced-motion`'a saygı göster (ağır animasyon varsa sakinleştir).

---

## 12. Çok dillilik

Bir yazıyı üç dile de vermek için üç dosya:

```
content/blog/010-merhaba.mdx       # İngilizce (varsayılan, mutlaka olmalı)
content/blog/010-merhaba.tr.mdx    # Türkçe
content/blog/010-merhaba.de.mdx    # Almanca
```

Kurallar:

- **İngilizce dosya kanoniktir.** Bir dilin dosyası yoksa, o dilde İngilizce'ye
  düşülür. Yani en azından `.mdx` (İngilizce) olsun.
- Üç dosyada da **aynı animasyon etiketlerini aynı yerlere** koy ki her dilde
  aynı görsel akış olsun. Animasyonların altyazıları zaten kendi içinde çevrili,
  sen sadece etiketi koyarsın.
- Frontmatter'daki `title` ve `excerpt`'i o dilde yaz. `date`, `tags`,
  `contentType`, `cover` aynı kalabilir.

---

## 13. Taslak ve yayına alma

**Taslak:** Frontmatter'da `draft: true`. Yazı geliştirmede (`npm run dev`)
görünür ama canlıda gizlidir. Hazır olunca `draft: false` yap.

**Tamamen gizlemek:** Bir yazıyı hiç taranmasın istiyorsan `.mdx` dosyasını
`content/blog/` dışına, örneğin `content/_blog_drafts/` klasörüne taşı. O klasör
taranmaz ve yayına gitmez (git'te de yok sayılır). Geri getirmek için tekrar
`content/blog/` içine taşı.

**Yayınlama:** Değişiklikleri `main` dalına push'la. GitHub Actions otomatik
derleyip Azure Static Web Apps'e deploy eder. Birkaç dakika sonra
`www.mertoshi.online/blog` üzerinde canlı olur. Ayrı bir "yayınla" düğmesi yok,
**push = yayın.**

---

## 14. Tam örnek yazı

Aşağıdaki tek dosya, kılavuzdaki neredeyse her özelliği kullanıyor. Kopyala,
`content/blog/999-ornek.mdx` yap, `localhost:3000/blog/ornek` adresinden gör.

```mdx
---
title: Her Şeyi Kullanan Örnek Yazı
date: 2026-07-07
contentType: lesson
tags: [demo, mdx]
excerpt: Bu yazı DropCap, Pull, kod, matematik, resim ve bir animasyon kullanır.
cover: /img/case-1.webp
draft: true
---
<DropCap>B</DropCap>u yazı, sistemdeki bütün araçları tek yerde gösteriyor.
Amacım, sen kendi yazını yazarken buraya bakıp kopyalayabilmen.

## Metin araçları

Paragraf içinde **kalın**, *italik* ve `satır-içi kod` var. Bir de
<Term k="connectome">konnektom</Term> gibi sözlük terimi.

<Pull>En iyi belge, çalışan bir örnektir.</Pull>

- Madde bir
- Madde iki

> **Ders:** Alıntı kutusuna kalın etiketle başlarsan vurgulu görünür.

## Kod ve matematik

​```bash
sbatch -p debug job.sbatch
​```

Global batch, GPU sayısıyla ölçeklenir: $b_\text{global} = b_\text{device} \times N$.

## Resim

<Figure src="/img/case-1.webp" alt="Örnek" caption="public/img içindeki bir görsel." />

## Animasyon

<SlurmFlow />

Gördüğün gibi etiketi koymak yeterli, gerisi kendiliğinden çalışıyor.
```

---

## 15. Atıflar ve kaynakça

Akademik yazılar için "Zotero gibi" bir atıf sistemi kurulu. Metne bir **atıf
anahtarı** yazarsın, yazının sonundaki numaralı **kaynakça kendiliğinden**
oluşur. Motor `rehype-citation`, stil **IEEE** (köşeli parantez, `[1]`).

### Yazıda atıf vermek

Kaynak verisi `content/references.bib` dosyasında durur. Oradaki her girişin bir
**anahtarı** vardır (örn. `januszewski2018`). Metinde köşeli parantez + `@` +
anahtar yazarsın:

```mdx
Taşkın-doldurma ağları nöronları çıkarır [@januszewski2018].

İki kaynağı birleştir [@januszewski2018; @sheridan2023].

Sayfa sabitle [@chen2015, p. 544].
```

Sırasıyla `[1]`, `[1], [2]` ve `[3, p. 544]` olarak render olur. Atıfın üstüne
gelince tam kaynak künyesi tooltip olarak çıkar (`<Term>` gibi).

### Kaynakçayı yerleştirmek

Kaynakçanın çıkmasını istediğin yere, kendi satırında **küçük harfle** `[^ref]`
koy. Üstüne bir başlık yazarsan o dile göre çevir:

```mdx
## Kaynakça

[^ref]
```

`[^ref]` koymazsan liste yazının en sonuna eklenir. Her dil dosyası (`.mdx`,
`.tr.mdx`, `.de.mdx`) kendi başlığını taşır; atıf anahtarları üç dilde de aynıdır.

### Kaynak dosyaları (iki tane, birleştiriliyor)

Kaynakça iki `.bib` dosyasından beslenir, build sırasında `content/_bibliography.bib`
olarak birleştirilir (bu üretilen dosyayı elleme, git'e de girmez):

- **`content/zotero.bib`** — Zotero'nun otomatik dışa aktarımı. **Zotero'ya aittir**,
  her değişiklikte komple yeniden yazılır, elle düzenleme.
- **`content/references.bib`** — Zotero'da olmayan **manuel** girişler (demo ya da
  tek seferlik kaynaklar). Kütüphaneni yeniden dışa aktarınca bunlar hayatta kalır.

### Zotero ile senkron (asıl kolaylık)

`zotero.bib`'i elle düzenlemezsin, Zotero doldurur:

1. Zotero'da **Better BibTeX** eklentisini kur.
2. Sol panelde **My Library**'ye (ya da bir koleksiyona) sağ tıkla → **Export Library...**
   (Not: sağ tıktaki "Better BibTeX >" alt menüsü BUNUN İÇİN DEĞİL, o başka şeyler için.)
3. Açılan pencerede Format **Better BibTeX**, **Keep updated** kutusunu işaretle.
4. Hedef dosya olarak `website/content/zotero.bib` seç.

Artık Zotero'ya bir kaynak eklediğinde `zotero.bib` kendiliğinden güncellenir; sen
`git add content/zotero.bib` ile commit'lersin. Atıf anahtarı (`[@anahtar]`'daki
anahtar) = Better BibTeX'in her kaynağa verdiği **"citation key"**. Bir kaynağın
anahtarını görmek için Zotero'da kaynağa tıkla (sağ panelde "Citation key" görünür,
ya da liste görünümüne "Citation Key" sütunu ekle). Anahtar biçimini sadeleştirmek
istersen: Zotero Ayarlar → Better BibTeX → Citation keys.

### Stili değiştirmek

`vite.config.ts` içindeki `rehypeCitation` ayarında `csl` alanı. Yerleşik
seçenekler: `'apa'`, `'vancouver'`, `'chicago'`, `'mla'`, `'harvard1'`. Ya da
şu andaki gibi yerel bir `.csl` dosyası yolu (`content/ieee.csl`).

> **Not:** Atıftan kaynakçaya tıkla-zıpla bağlantısı bilerek kapalı
> (`linkCitations: false`), çünkü `[@x, p. 544]` gibi rakamlı sayfa atıflarında
> eklentinin o kod yolu çöküyor. Tooltip zaten künyeyi gösterdiği için kayıp yok.

Canlı örnek: `content/blog/999-citations.mdx` (taslak, sadece geliştirmede
görünür). Silebilir ya da şablon olarak tutabilirsin.

---

## 16. Sık yapılan hatalar

- **Bileşeni import etmeye çalışmak.** Gerek yok. `mdxComponents.tsx`'te kayıtlı
  olanlar (DropCap, Pull, SlurmFlow ...) her yazıda hazır. Sadece etiketi yaz.
- **Bileşen etiketini kapatmamak.** İçi boş bileşenler kendi kendine kapanmalı:
  `<SlurmFlow />` (sonundaki `/` şart). İçi dolu olanlarda: `<Aside>...</Aside>`.
- **Bileşenin etrafında boş satır bırakmamak.** Bir bileşeni kendi satırına, üstünde
  ve altında birer boş satır bırakarak koy. Paragrafın ortasına gömme.
- **Resim yoluna `public` yazmak.** Yanlış: `public/img/x.webp`. Doğru: `/img/x.webp`.
- **`.webp` yerine dev PNG/JPG koymak.** Boyut şişer, sayfa yavaşlar. `.webp` kullan.
- **İngilizce dosyayı unutmak.** Sadece `.tr.mdx` koyarsan İngilizce dilde yazı
  boş görünür. Kanonik `.mdx` (İngilizce) mutlaka olsun.
- **Em dash / noktalı virgül kullanmak.** Bu blogun stili bunları istemiyor
  (kod hariç). Nokta, virgül, iki nokta, parantez kullan.
- **`draft: true` bırakıp "neden canlıda yok" diye şaşırmak.** Canlıya çıkmadan
  önce `false` yapmayı unutma.
- **`[^Ref]`'i büyük harfle yazmak.** Kaynakça işaretçisi küçük harf `[^ref]`
  olmalı, yoksa liste oraya değil yazının en sonuna düşer.
- **`references.bib` içine `@` ile başlayan yorum yazmak.** BibTeX ayrıştırıcısı
  `@article{...}` gibi metni gerçek kayıt sanıp derlemeyi kırar. `.bib`'e sadece
  gerçek girişleri koy, açıklamayı buraya (AUTHORING) yaz.
- **Var olmayan bir atıf anahtarı kullanmak.** `[@yanlisAnahtar]` sessizce boş
  render olur. Anahtarın `references.bib`'te olduğundan emin ol.

---

Bu kadar. Takıldığın yerde en iyi yol, `content/blog/002-slurm-on-truba.mdx`
dosyasına bakmak — bu kılavuzdaki her özelliğin gerçek kullanımını orada
görebilirsin.
