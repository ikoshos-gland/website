import React, { useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// The actual WebGL scene for <NeuronViewer>. Lazy-imported by the wrapper so the
// three.js stack only downloads when a viewer scrolls into view. Two modes:
//   - 'lines' (default): each neuron a THREE.LineSegments skeleton + a soma ball.
//     Tiny (~KB), the fast "skeleton mode" FlyWire/SharkViewer use.
//   - 'solid': each neuron the real reconstructed surface mesh (from FlyWire,
//     decimated). Heavier (~MB) but looks like the Codex/Neuroglancer view.
// An optional translucent brain hull sits behind either, all co-registered in
// canonical FAFB space by the build scripts.

export interface NeuronGeom { positions: Float32Array; edges: Uint32Array; soma: [number, number, number] | null; somaR: number; }
export interface SolidGeom { positions: Float32Array; indices: Uint16Array; }
export interface BrainGeom { positions: Float32Array; indices: Uint32Array; }

// Skeleton wire format (little-endian), from scripts/build_neuron_bin.py:
//   u32 magic('NRN1') · u32 version · u32 neuronCount · u32 flags
//   per neuron: u32 vCount · u32 eCount · f32[vCount*3] pos · u32[eCount*2] edges
//              · (v>=2) f32[4] soma (x,y,z,radius)
function parseNeuronBin(buf: ArrayBuffer): NeuronGeom[] {
  const dv = new DataView(buf);
  let o = 0;
  if (dv.getUint32(o, true) !== 0x314e524e) throw new Error('bad neuron bin magic');
  o += 4;
  const version = dv.getUint32(o, true); o += 4;
  const count = dv.getUint32(o, true); o += 8; // count + flags
  const out: NeuronGeom[] = [];
  for (let i = 0; i < count; i++) {
    const v = dv.getUint32(o, true); o += 4;
    const e = dv.getUint32(o, true); o += 4;
    const positions = new Float32Array(buf, o, v * 3); o += v * 3 * 4;
    const edges = new Uint32Array(buf, o, e * 2); o += e * 2 * 4;
    let soma: [number, number, number] | null = null;
    let somaR = 0;
    if (version >= 2) {
      const s = new Float32Array(buf, o, 4); o += 16;
      soma = [s[0], s[1], s[2]]; somaR = s[3];
    }
    out.push({ positions, edges, soma, somaR });
  }
  return out;
}

// Solid mesh format, from scripts/build_neuron_solid.py:
//   u32 magic('NMM1') · u32 version · u32 neuronCount · u32 flags
//   per neuron: u32 vCount · u32 triCount · i16[vCount*3] pos(*32767) · u16[triCount*3] idx
function parseSolidBin(buf: ArrayBuffer): SolidGeom[] {
  const dv = new DataView(buf);
  let o = 0;
  if (dv.getUint32(o, true) !== 0x314d4d4e) throw new Error('bad solid bin magic');
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

function NeuronLines({ geom, color }: { geom: NeuronGeom; color: string }) {
  const g = useMemo(() => {
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(geom.positions, 3));
    bg.setIndex(new THREE.BufferAttribute(geom.edges, 1));
    return bg;
  }, [geom]);
  useEffect(() => () => g.dispose(), [g]);
  return (
    <lineSegments geometry={g} renderOrder={1}>
      {/* additive on the dark backdrop makes dense arbors glow, like the FlyWire view */}
      <lineBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
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
  solid?: boolean;
  brain?: string | null;
  colors?: string[];
  autoRotate?: boolean;
  background?: string;
  somaScale?: number;
}

export default function NeuronScene({ src, solid = false, brain, colors = DEFAULT_COLORS, autoRotate = true, background = '#0A0B0D', somaScale = 2.0 }: NeuronSceneProps) {
  const [geoms, setGeoms] = useState<NeuronGeom[] | null>(null);
  const [solids, setSolids] = useState<SolidGeom[] | null>(null);
  const [brainGeom, setBrainGeom] = useState<BrainGeom | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    const neuronsP = solid ? load(src, parseSolidBin) : load(src, parseNeuronBin);
    Promise.all([
      neuronsP,
      brain ? load(brain, parseBrainBin) : Promise.resolve(null),
    ]).then(
      ([n, b]) => {
        if (!alive) return;
        if (solid) setSolids(n as SolidGeom[]); else setGeoms(n as NeuronGeom[]);
        setBrainGeom(b as BrainGeom | null);
      },
      () => alive && setErr(true),
    );
    return () => { alive = false; };
  }, [src, brain, solid]);

  const fit = useMemo(() => {
    const arr: Float32Array[] = [];
    if (geoms) arr.push(...geoms.map((g) => g.positions));
    if (solids) arr.push(...solids.map((g) => g.positions));
    if (brainGeom) arr.push(brainGeom.positions);
    return arr.length ? bounds(arr) : null;
  }, [geoms, solids, brainGeom]);

  const ready = solid ? solids : geoms;
  if (err) return <div className="blg-neuron-msg">3D veri yüklenemedi.</div>;
  if (!ready || !fit) return <div className="blg-neuron-spin" aria-label="loading" />;

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
      {solids && solids.map((g, i) => <SolidNeuron key={i} geom={g} color={colors[i % colors.length]} />)}
      {geoms && geoms.map((geom, i) => {
        const c = colors[i % colors.length];
        return (
          <group key={i}>
            <NeuronLines geom={geom} color={c} />
            {geom.soma && (
              <mesh position={geom.soma} renderOrder={2}>
                {/* soma = cell body, a solid ball at the fattest skeleton node */}
                <sphereGeometry args={[geom.somaR * somaScale, 20, 20]} />
                <meshStandardMaterial color={c} roughness={0.45} metalness={0} />
              </mesh>
            )}
          </group>
        );
      })}
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
