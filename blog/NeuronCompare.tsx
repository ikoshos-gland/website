import React from 'react';
import NeuronViewer from './NeuronViewer';

// Two neuron viewers side by side, for comparing what different imaging
// modalities actually yield. Defaults are set up for the EM vs ExM contrast:
//   left  = FlyWire (volume EM, whole fly brain, shown inside the brain hull)
//   right = LICONN (expansion microscopy, a small mouse cortex block, no hull)
// Each panel keeps its own auto-fit camera, so both fill their box; the labels
// carry the scale difference, which the framing alone would otherwise hide.
// Stacks vertically on narrow screens (see .blg-neuron-compare in blog.css).

export interface NeuronCompareProps {
  leftSrc?: string;
  leftLabel?: React.ReactNode;
  leftBrain?: string | false;
  leftColors?: string[];
  leftZoom?: number;
  rightSrc?: string;
  rightLabel?: React.ReactNode;
  rightBrain?: string | false;
  rightColors?: string[];
  rightZoom?: number;
  height?: number;
  autoRotate?: boolean;
  caption?: React.ReactNode;
  children?: React.ReactNode;
}

export default function NeuronCompare({
  leftSrc = '/neurons/exr1_solid.bin',
  leftLabel = 'EM · FlyWire',
  leftBrain = '/neurons/brain.bin',
  leftColors,
  leftZoom = 1,
  rightSrc = '/neurons/liconn_solid.bin',
  rightLabel = 'ExM · LICONN',
  rightBrain = false,
  rightColors = ['#E8C66A', '#F0916B', '#5BC8C0'],
  rightZoom = 1,
  height = 380,
  autoRotate = true,
  caption,
  children,
}: NeuronCompareProps) {
  return (
    <figure className="blg-viz">
      <div className="blg-neuron-compare">
        <NeuronViewer
          bare
          src={leftSrc}
          brain={leftBrain}
          colors={leftColors}
          zoom={leftZoom}
          label={leftLabel}
          height={height}
          autoRotate={autoRotate}
        />
        <NeuronViewer
          bare
          src={rightSrc}
          brain={rightBrain}
          colors={rightColors}
          zoom={rightZoom}
          label={rightLabel}
          height={height}
          autoRotate={autoRotate}
        />
      </div>
      {(caption || children) && <figcaption>{caption || children}</figcaption>}
    </figure>
  );
}
