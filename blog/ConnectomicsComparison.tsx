import React from 'react';

const panels = [
  {
    kind: 'İşlevsel bağlantısallık',
    question: 'Birlikte çalışan bölgeler hangileri?',
    src: '/img/blog/functional-connectivity-fmri.webp',
    alt: 'fMRI verilerinden çıkarılan bağlantıların iki ve üç boyutlu beyin ağı gösterimi',
    description:
      'fMRI gibi yöntemlerle bölgelerin etkinlikleri arasındaki zamansal ve istatistiksel ilişki ölçülür. Çizgiler anatomik lifleri değil, birlikte değişen sinyalleri gösterir.',
  },
  {
    kind: 'Yapısal bağlantısallık',
    question: 'Fiziksel olarak ne, neye bağlı?',
    src: '/img/blog/structural-connectivity-brainbow.webp',
    alt: 'Brainbow yöntemiyle farklı renklerde işaretlenmiş fare korteksi nöronları',
    description:
      'Hücreler, aksonlar ve sinapslar anatomik olarak izlenir. Brainbow gibi çok renkli işaretleme yöntemleri, birbirine komşu nöronların ayrıştırılmasını kolaylaştırır.',
  },
];

const ConnectomicsComparison: React.FC = () => (
  <figure className="blg-connectomics-compare" aria-labelledby="connectomics-compare-caption">
    <div className="blg-connectomics-grid">
      {panels.map((panel, index) => (
        <section className="blg-connectomics-card" key={panel.kind}>
          <div className="blg-connectomics-image">
            <img src={panel.src} alt={panel.alt} loading="lazy" decoding="async" />
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
      <b>Aynı beyin, iki farklı harita.</b> Yapısal bağlantısallık anatomik bağlantıları, işlevsel bağlantısallık ise birlikte değişen etkinlik örüntülerini gösterir. Etkin bağlantısallık bunlara üçüncü bir soru ekler: Bir bölgenin diğerini etkilediğini hangi nedensel model açıklayabilir?
    </figcaption>
  </figure>
);

export default ConnectomicsComparison;
