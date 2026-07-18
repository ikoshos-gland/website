import React, { useEffect, useRef } from 'react';

type NeuralNode = {
  x: number;
  y: number;
  radius: number;
  glow: number;
  phase: number;
  hub?: boolean;
};

type NeuralEdge = {
  from: number;
  to: number;
  bend: number;
  phase: number;
  speed: number;
};

const CosmicNeuralBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let nodes: NeuralNode[] = [];
    let edges: NeuralEdge[] = [];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const createRandom = (initialSeed: number) => {
      let seed = initialSeed >>> 0;
      return () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 0x100000000;
      };
    };

    const rebuildScene = () => {
      const random = createRandom(0x4e455552 ^ Math.round(width));
      nodes = [];
      edges = [];

      const fieldCount = Math.max(38, Math.round((width * height) / 18500));
      for (let index = 0; index < fieldCount; index += 1) {
        nodes.push({
          x: random() * width,
          y: random() * height,
          radius: 0.45 + random() * 1.05,
          glow: 0.12 + random() * 0.38,
          phase: random() * Math.PI * 2,
        });
      }

      // These are deliberately branching clusters rather than a nearest-neighbour
      // web: every soma grows dendrite-like arms, with a few smaller terminal nodes.
      const clusterCount = width < 700 ? 3 : 5;
      for (let cluster = 0; cluster < clusterCount; cluster += 1) {
        const hubIndex = nodes.length;
        const hubX = width * (0.12 + random() * 0.76);
        const hubY = height * (0.12 + random() * 0.76);
        nodes.push({
          x: hubX,
          y: hubY,
          radius: 1.7 + random() * 1.15,
          glow: 0.78,
          phase: random() * Math.PI * 2,
          hub: true,
        });

        const arms = width < 700 ? 3 + Math.floor(random() * 2) : 4 + Math.floor(random() * 3);
        for (let arm = 0; arm < arms; arm += 1) {
          const angle = (arm / arms) * Math.PI * 2 + (random() - 0.5) * 0.7;
          const distance = Math.min(width, height) * (0.1 + random() * 0.12);
          const branchIndex = nodes.length;
          nodes.push({
            x: Math.max(12, Math.min(width - 12, hubX + Math.cos(angle) * distance)),
            y: Math.max(12, Math.min(height - 12, hubY + Math.sin(angle) * distance)),
            radius: 0.9 + random() * 0.7,
            glow: 0.48,
            phase: random() * Math.PI * 2,
          });
          edges.push({
            from: hubIndex,
            to: branchIndex,
            bend: (random() - 0.5) * 34,
            phase: random() * Math.PI * 2,
            speed: 0.26 + random() * 0.18,
          });

          if (random() > 0.32) {
            const twigAngle = angle + (random() - 0.5) * 0.9;
            const twigDistance = distance * (0.42 + random() * 0.36);
            const twigIndex = nodes.length;
            const branch = nodes[branchIndex];
            nodes.push({
              x: Math.max(10, Math.min(width - 10, branch.x + Math.cos(twigAngle) * twigDistance)),
              y: Math.max(10, Math.min(height - 10, branch.y + Math.sin(twigAngle) * twigDistance)),
              radius: 0.55 + random() * 0.55,
              glow: 0.32,
              phase: random() * Math.PI * 2,
            });
            edges.push({
              from: branchIndex,
              to: twigIndex,
              bend: (random() - 0.5) * 24,
              phase: random() * Math.PI * 2,
              speed: 0.26 + random() * 0.18,
            });
          }
        }
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      rebuildScene();
    };

    const pointOnCurve = (
      from: NeuralNode,
      to: NeuralNode,
      bend: number,
      progress: number,
    ) => {
      const midpointX = (from.x + to.x) / 2;
      const midpointY = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const controlX = midpointX - (dy / length) * bend;
      const controlY = midpointY + (dx / length) * bend;
      const inverse = 1 - progress;
      return {
        x: inverse * inverse * from.x + 2 * inverse * progress * controlX + progress * progress * to.x,
        y: inverse * inverse * from.y + 2 * inverse * progress * controlY + progress * progress * to.y,
        controlX,
        controlY,
      };
    };

    const draw = (timestamp: number) => {
      context.clearRect(0, 0, width, height);
      const time = reducedMotion ? 1.2 : timestamp / 1000;

      for (const edge of edges) {
        const from = nodes[edge.from];
        const to = nodes[edge.to];
        const wave = Math.sin(time * edge.speed * Math.PI * 2 + edge.phase);
        const activity = Math.max(0, (wave - 0.38) / 0.62);
        const curve = pointOnCurve(from, to, edge.bend, 0.5);

        context.beginPath();
        context.moveTo(from.x, from.y);
        context.quadraticCurveTo(curve.controlX, curve.controlY, to.x, to.y);
        context.strokeStyle = `rgba(181, 204, 255, ${0.018 + activity * 0.17})`;
        context.lineWidth = 0.55 + activity * 0.65;
        context.stroke();

        if (activity > 0.28 && !reducedMotion) {
          const signalProgress = (time * 0.22 + edge.phase / (Math.PI * 2)) % 1;
          const signal = pointOnCurve(from, to, edge.bend, signalProgress);
          context.beginPath();
          context.arc(signal.x, signal.y, 1.05, 0, Math.PI * 2);
          context.fillStyle = `rgba(224, 235, 255, ${activity * 0.72})`;
          context.shadowColor = 'rgba(154, 190, 255, 0.75)';
          context.shadowBlur = 6;
          context.fill();
          context.shadowBlur = 0;
        }
      }

      for (const node of nodes) {
        const twinkle = 0.72 + Math.sin(time * 0.55 + node.phase) * 0.28;
        const opacity = node.glow * twinkle;
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fillStyle = node.hub
          ? `rgba(255, 244, 213, ${opacity})`
          : `rgba(235, 240, 255, ${opacity})`;
        context.shadowColor = node.hub
          ? 'rgba(255, 196, 112, 0.68)'
          : 'rgba(151, 185, 255, 0.5)';
        context.shadowBlur = node.hub ? 11 : node.radius > 1.1 ? 6 : 3;
        context.fill();
        context.shadowBlur = 0;
      }

      if (!reducedMotion && visible) frame = requestAnimationFrame(draw);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      const nextVisible = entry.isIntersecting;
      if (nextVisible && !visible && !reducedMotion) {
        visible = true;
        frame = requestAnimationFrame(draw);
      } else {
        visible = nextVisible;
        if (!visible && frame) cancelAnimationFrame(frame);
      }
    });
    visibilityObserver.observe(canvas);

    resize();
    draw(0);

    return () => {
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <canvas ref={canvasRef} className="sticky top-0 block h-screen w-full opacity-90" />
    </div>
  );
};

export default CosmicNeuralBackground;
