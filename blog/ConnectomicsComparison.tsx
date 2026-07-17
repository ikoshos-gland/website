import React from 'react';

// Üç panel, üç farklı soru. Görsellerin en-boy oranları ve zeminleri birbirini
// tutmadığı için her panel kendi `fit` ve `bg` değerini taşır: ortak bir cover
// kuralı, iki panelli fonksiyonel şekli tam ortasından keserdi.
const panels = [
  {
    kind: 'İşlevsel konnektomik',
    question: 'Hangi bölgeler birlikte çalışıyor?',
    src: '/img/blog/functional-connectivity-network.webp',
    alt: 'Üstte cam beyin üzerinde renkli düğümler ve onları birbirine bağlayan kenarlardan oluşan ağ; altta kortikal yüzeyde mavi-kırmızı ölçekli işlevsel bağlantı gücü haritaları.',
    fit: 'contain' as const,
    bg: '#ffffff',
    description:
      'fMRG gibi yöntemlerle bölgelerin etkinlikleri arasındaki zamansal ve istatistiksel ilişki ölçülür. Çizgiler anatomik lifleri değil, birlikte değişen sinyalleri gösterir; iki bölge arasında doğrudan bir bağlantı olması gerekmez.',
  },
  {
    kind: 'Makro ölçekli yapısal konnektomik',
    question: 'Hangi yol nereye gidiyor?',
    src: '/img/blog/structural-connectivity-macro-tractography.webp',
    alt: 'Solda difüzyon MR traktografisiyle çıkarılmış, renklerle yönlendirilmiş beyaz madde demetleri; sağda aynı demetlerin koronal kesit üzerindeki anatomik çizimi.',
    fit: 'contain' as const,
    bg: '#ffffff',
    description:
      'Difüzyon MR ve traktografi ile beyaz madde demetleri bütün beyin ölçeğinde izlenir. Çözünürlük milimetre düzeyinde kaldığı için tek tek aksonlar değil, demetlerin izlediği güzergâh görünür.',
  },
  {
    kind: 'Mikro ölçekli yapısal konnektomik',
    question: 'Hangi nöron, hangisine, hangi sinapsla?',
    src: '/img/blog/structural-connectivity-micro-em.webp',
    alt: 'Elektron mikroskobu verisinden segmente edilmiş, her biri ayrı renkte gösterilen yoğun nöron uzantıları ve hücre gövdeleri.',
    fit: 'cover' as const,
    bg: '#000000',
    description:
      'Elektron mikroskobu ve genişletme mikroskopisiyle nöronlar tek tek ayrıştırılır. Nanometre çözünürlükte her uzantı ve her sinaps izlenebilir, ama görüntülenebilen hacim milimetre küp mertebesinde kalır.',
  },
];

// `children` taşır kaynak satırını: alıntılar MDX'te kalmalı, çünkü rehype-citation
// yalnızca MDX üzerinde çalışır. Buraya düz yazılan bir [@key] numara almaz ve
// kaynakçaya girmez.
const ConnectomicsComparison: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <figure className="blg-connectomics-compare" aria-labelledby="connectomics-compare-caption">
    <div className="blg-connectomics-grid">
      {panels.map((panel, index) => (
        <section className="blg-connectomics-card" key={panel.kind}>
          <div className="blg-connectomics-image" style={{ background: panel.bg }}>
            <img src={panel.src} alt={panel.alt} loading="lazy" decoding="async" style={{ objectFit: panel.fit }} />
            <span aria-hidden="true">0{index + 1}</span>
          </div>
          <div className="blg-connectomics-copy">
            <p className="blg-connectomics-kind">{panel.kind}</p>
            <h3>{panel.question}</h3>
            <p>{panel.description}</p>
          </div>
        </section>
      ))}
    </div>
    <figcaption id="connectomics-compare-caption">
      <b>Aynı beyin, üç farklı harita.</b> İşlevsel bağlantısallık birlikte değişen etkinlik örüntülerini, yapısal bağlantısallık ise fiziksel bağlantının kendisini gösterir. Ama yapısal olan, hangi ölçekte baktığınıza göre bambaşka iki resme ayrılır: makro ölçekte bütün beyni görürsünüz, tek tek aksonları değil; mikro ölçekte her sinapsı görürsünüz, ama yalnızca minik bir hacimde. Etkin bağlantısallık bunlara dördüncü bir soru ekler: Bir bölgenin diğerini etkilediğini hangi nedensel model açıklayabilir?
      {children && <span className="blg-connectomics-src">{children}</span>}
    </figcaption>
  </figure>
);

export default ConnectomicsComparison;
