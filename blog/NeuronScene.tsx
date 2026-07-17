import React, { useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// The actual WebGL scene for <NeuronViewer>. Lazy-imported by the wrapper so the
// three.js stack only downloads when a viewer scrolls into view. Renders each
// neuron as its real reconstructed surface mesh (fetched from FlyWire, decimated
// by scripts/build_neuron_solid.py), like the Codex/Neuroglancer view, plus an
// optional translucent brain hull. All co-registered in canonical FAFB space.

export interface SolidGeom { positions: Float32Array; indices: Uint16Array; }
export interface BrainGeom { positions: Float32Array; indices: Uint32Array; }

// Neuron mesh format, from scripts/build_neuron_solid.py:
//   u32 magic('NMM1') · u32 version · u32 neuronCount · u32 flags
//   per neuron: u32 vCount · u32 triCount · i16[vCount*3] pos(*32767) · u16[triCount*3] idx
function parseSolidBin(buf: ArrayBuffer): SolidGeom[] {
  const dv = new DataView(buf);
  let o = 0;
  if (dv.getUint32(o, true) !== 0x314d4d4e) throw new Error('bad neuron mesh magic');
  o += 8; // magic + version
  const count = dv.getUint32(o, true); o += 8; // count + flags
  const out: SolidGeom[] = [];
  for (let i = 0; i < count; i++) {
    const v = dv.getUint32(o, true); o += 4;
    const t = dv.getUint32(o, true); o += 4;
    const qi = new Int16Array(buf, o, v * 3); o += v * 3 * 2;
    const positions = new Float32Array(v * 3);
    for (let k = 0; k < v * 3; k++) positions[k] = qi[k] / 32767;
    const indices = new Uint16Array(buf, o, t * 3); o += t * 3 * 2;
    out.push({ positions, indices });
  }
  return out;
}

// Brain hull format, from scripts/build_neuron_solid.py --brain:
//   u32 magic('BRN1') · u32 version · u32 vCount · u32 triCount
//   · f32[vCount*3] pos · u32[triCount*3] indices
function parseBrainBin(buf: ArrayBuffer): BrainGeom {
  const dv = new DataView(buf);
  let o = 0;
  if (dv.getUint32(o, true) !== 0x314e5242) throw new Error('bad brain bin magic');
  o += 8; // magic + version
  const v = dv.getUint32(o, true); o += 4;
  const t = dv.getUint32(o, true); o += 4;
  const positions = new Float32Array(buf, o, v * 3); o += v * 3 * 4;
  const indices = new Uint32Array(buf, o, t * 3); o += t * 3 * 4;
  return { positions, indices };
}

// Fetch + parse once per url, shared across mounts so scrolling the viewer in and
// out of view never re-downloads.
const cache = new Map<string, Promise<any>>();
function load<T>(url: string, parse: (b: ArrayBuffer) => T): Promise<T> {
  let p = cache.get(url) as Promise<T> | undefined;
  if (!p) {
    p = fetch(url)
      .then((r) => { if (!r.ok) throw new Error(`fetch ${r.status}`); return r.arrayBuffer(); })
      .then(parse);
    cache.set(url, p);
  }
  return p;
}

const DEFAULT_COLORS = ['#79E77B', '#5B8DEF', '#C792EA', '#E8C66A', '#5BC8C0'];

function bounds(arrays: Float32Array[]) {
  let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
  for (const a of arrays) for (let i = 0; i < a.length; i += 3) {
    const x = a[i], y = a[i + 1], z = a[i + 2];
    if (x < mnx) mnx = x; if (y < mny) mny = y; if (z < mnz) mnz = z;
    if (x > mxx) mxx = x; if (y > mxy) mxy = y; if (z > mxz) mxz = z;
  }
  return {
    center: [(mnx + mxx) / 2, (mny + mxy) / 2, (mnz + mxz) / 2] as [number, number, number],
    radius: 0.5 * Math.hypot(mxx - mnx, mxy - mny, mxz - mnz),
  };
}

function SolidNeuron({ geom, color }: { geom: SolidGeom; color: string }) {
  const g = useMemo(() => {
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(geom.positions, 3));
    bg.setIndex(new THREE.BufferAttribute(geom.indices, 1));
    bg.computeVertexNormals();
    return bg;
  }, [geom]);
  useEffect(() => () => g.dispose(), [g]);
  return (
    <mesh geometry={g} renderOrder={1}>
      {/* DoubleSide: weld+decimation can leave mixed winding; avoids culled-face holes */}
      <meshStandardMaterial color={color} roughness={0.55} metalness={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

function BrainHull({ geom }: { geom: BrainGeom }) {
  const g = useMemo(() => {
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(geom.positions, 3));
    bg.setIndex(new THREE.BufferAttribute(geom.indices, 1));
    return bg;
  }, [geom]);
  useEffect(() => () => g.dispose(), [g]);
  return (
    <mesh geometry={g} renderOrder={0}>
      {/* faint faceted glass shell: flatShading needs no normals (three derives
          them per-fragment), depthWrite off so the neurons always shine through */}
      <meshStandardMaterial
        color="#9aa6b8"
        transparent
        opacity={0.07}
        depthWrite={false}
        side={THREE.DoubleSide}
        flatShading
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

function FitCamera({ center, radius }: { center: [number, number, number]; radius: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as any;
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const c = new THREE.Vector3(...center);
    const dist = (radius / Math.sin((camera.fov * Math.PI) / 180 / 2)) * 1.15;
    camera.position.set(c.x, c.y, c.z + dist);
    camera.near = dist / 100;
    camera.far = dist * 10;
    camera.updateProjectionMatrix();
    if (controls) { controls.target.copy(c); controls.update(); }
    invalidate();
  }, [center, radius, camera, controls, invalidate]);
  return null;
}

export interface NeuronSceneProps {
  src: string;
  brain?: string | null;
  colors?: string[];
  autoRotate?: boolean;
  background?: string;
}

export default function NeuronScene({ src, brain, colors = DEFAULT_COLORS, autoRotate = true, background = '#0A0B0D' }: NeuronSceneProps) {
  const [neurons, setNeurons] = useState<SolidGeom[] | null>(null);
  const [brainGeom, setBrainGeom] = useState<BrainGeom | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      load(src, parseSolidBin),
      brain ? load(brain, parseBrainBin) : Promise.resolve(null),
    ]).then(
      ([n, b]) => { if (alive) { setNeurons(n as SolidGeom[]); setBrainGeom(b as BrainGeom | null); } },
      () => alive && setErr(true),
    );
    return () => { alive = false; };
  }, [src, brain]);

  const fit = useMemo(() => {
    if (!neurons) return null;
    const arr = neurons.map((g) => g.positions);
    if (brainGeom) arr.push(brainGeom.positions);
    return bounds(arr);
  }, [neurons, brainGeom]);

  if (err) return <div className="blg-neuron-msg">3D veri yüklenemedi.</div>;
  if (!neurons || !fit) return <div className="blg-neuron-spin" aria-label="loading" />;

  return (
    <Canvas
      frameloop={autoRotate ? 'always' : 'demand'}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 2.6], fov: 45, near: 0.01, far: 100 }}
    >
      <color attach="background" args={[background]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[1, 1.4, 2]} intensity={0.9} />
      <directionalLight position={[-1.5, -0.5, -1]} intensity={0.35} />
      {brainGeom && <BrainHull geom={brainGeom} />}
      {neurons.map((g, i) => (
        <SolidNeuron key={i} geom={g} color={colors[i % colors.length]} />
      ))}
      <FitCamera center={fit.center} radius={fit.radius} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.7}
        minDistance={fit.radius * 0.4}
        maxDistance={fit.radius * 8}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
      />
    </Canvas>
  );
}
