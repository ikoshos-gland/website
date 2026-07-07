// Shared glossary for the blog. `<Term k="connectome">connectome</Term>` renders
// the child text with a dotted underline and a hover/focus tooltip carrying the
// definition in the reader's current language. Add a term here once, use it in any
// post. Keep definitions to one or two plain sentences.
import type { Lang } from '../i18n/content';

export interface GlossaryEntry {
  def: Record<Lang, string>;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  connectome: {
    def: {
      en: 'The complete wiring diagram of a nervous system — every neuron and every synaptic connection between them.',
      tr: 'Bir sinir sisteminin eksiksiz kablolama şeması — her nöron ve aralarındaki her sinaptik bağlantı.',
      de: 'Der vollständige Schaltplan eines Nervensystems — jedes Neuron und jede synaptische Verbindung dazwischen.',
    },
  },
  synapse: {
    def: {
      en: 'The junction where one neuron passes a signal to the next, typically only tens of nanometres across.',
      tr: 'Bir nöronun sinyali bir sonrakine aktardığı, genellikle yalnızca birkaç on nanometre genişliğindeki bağlantı noktası.',
      de: 'Die Kontaktstelle, an der ein Neuron ein Signal an das nächste weitergibt — meist nur wenige Dutzend Nanometer breit.',
    },
  },
  voxel: {
    def: {
      en: 'A volumetric pixel: the smallest cube of a 3-D image, the unit a segmentation algorithm labels one at a time.',
      tr: 'Hacimsel piksel: 3B bir görüntünün en küçük küpü; segmentasyon algoritmasının teker teker etiketlediği birim.',
      de: 'Ein Volumen-Pixel: der kleinste Würfel eines 3-D-Bildes — die Einheit, die ein Segmentierungsalgorithmus einzeln beschriftet.',
    },
  },
  segmentation: {
    def: {
      en: 'Assigning every voxel to the object it belongs to, so each neuron becomes one distinctly labelled shape.',
      tr: 'Her voxel’i ait olduğu nesneye atamak; böylece her nöron ayrı etiketli tek bir şekil hâline gelir.',
      de: 'Jedem Voxel das Objekt zuzuordnen, zu dem es gehört, sodass jedes Neuron zu einer eindeutig beschrifteten Form wird.',
    },
  },
  ffn: {
    def: {
      en: 'Flood-Filling Network: a recurrent network that floods one object outward from a seed, one at a time — accurate but sequential.',
      tr: 'Flood-Filling Network: bir tohumdan başlayarak tek bir nesneyi teker teker dışa doğru dolduran yinelemeli ağ — isabetli ama ardışık.',
      de: 'Flood-Filling Network: ein rekurrentes Netz, das von einem Seed aus ein Objekt nach dem anderen nach außen flutet — präzise, aber sequenziell.',
    },
  },
  lsd: {
    def: {
      en: 'Local Shape Descriptors: a feed-forward network that predicts the whole volume at once, pairing affinities with a 10-D shape descriptor — parallel and ~100× cheaper.',
      tr: 'Local Shape Descriptors: tüm hacmi tek seferde tahmin eden, affinity’leri 10-D bir şekil tanımlayıcısıyla eşleştiren ileri-besleme ağı — paralel ve ~100× daha ucuz.',
      de: 'Local Shape Descriptors: ein Feed-Forward-Netz, das das ganze Volumen auf einmal vorhersagt und Affinities mit einem 10-D-Formdeskriptor paart — parallel und ~100× günstiger.',
    },
  },
  'diffraction-limit': {
    def: {
      en: 'The physical floor on optical resolution (~200 nm) set by the wavelength of light — structures closer than this blur together.',
      tr: 'Işığın dalga boyunun belirlediği optik çözünürlük tabanı (~200 nm) — bundan daha yakın yapılar birbirine bulanıklaşır.',
      de: 'Die durch die Lichtwellenlänge gesetzte physikalische Grenze der optischen Auflösung (~200 nm) — näher liegende Strukturen verschwimmen.',
    },
  },
  'expansion-microscopy': {
    def: {
      en: 'Physically swelling a specimen in a hydrogel so structures separate beyond the diffraction limit, letting an ordinary microscope resolve them.',
      tr: 'Bir örneği hidrojel içinde fiziksel olarak şişirerek yapıları kırınım sınırının ötesine ayırmak; böylece sıradan bir mikroskop onları çözebilir.',
      de: 'Eine Probe in einem Hydrogel physisch aufquellen zu lassen, sodass Strukturen über das Beugungslimit hinaus getrennt werden und ein gewöhnliches Mikroskop sie auflöst.',
    },
  },
};
