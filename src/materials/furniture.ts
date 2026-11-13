import * as THREE from 'three';

/**
 * Procedural surfaces for 3D furniture.
 *
 * Textures are generated on a canvas as *greyscale* patterns that are then tinted by the material colour, so the
 * colour chosen by the user still decides the look (a walnut chair and an oak chair share the same grain map).
 * Without a DOM (unit tests, SSR) the textures are skipped and plain coloured materials are returned.
 */

import { SurfaceKind, surfaceKindOf } from './finishes';

export type { SurfaceKind };
export { surfaceKindOf };

type PatternKind =
  | 'wood'
  | 'woodCoarse'
  | 'fabric'
  | 'boucle'
  | 'velvet'
  | 'leather'
  | 'mesh'
  | 'brushed'
  | 'speckle'
  | 'marble'
  | 'concrete';

const PATTERN_SIZE: Record<PatternKind, number> = {
  wood: 512,
  woodCoarse: 512,
  fabric: 128,
  boucle: 256,
  velvet: 128,
  leather: 256,
  mesh: 128,
  brushed: 256,
  speckle: 256,
  marble: 512,
  concrete: 512,
};
/** Real-world size (mm) covered by one repetition of each pattern. */
const PATTERN_TILE_MM: Record<PatternKind, number> = {
  wood: 600,
  woodCoarse: 700,
  fabric: 90,
  boucle: 160,
  velvet: 120,
  leather: 140,
  mesh: 60,
  brushed: 300,
  speckle: 260,
  marble: 900,
  concrete: 700,
};

const textureCache = new Map<PatternKind, THREE.CanvasTexture | null>();

/** Small deterministic PRNG so every browser draws the same grain. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPattern(kind: PatternKind, ctx: CanvasRenderingContext2D, size: number) {
  const rand = mulberry32(kind.length * 7919 + size);

  if (kind === 'wood' || kind === 'woodCoarse') {
    const coarse = kind === 'woodCoarse';
    ctx.fillStyle = '#d9d9d9';
    ctx.fillRect(0, 0, size, size);
    // Long, slightly wavy grain lines, drawn 3 times vertically so the texture tiles seamlessly.
    for (let i = 0; i < (coarse ? 90 : 220); i++) {
      const y0 = rand() * size;
      const amp = (coarse ? 5 : 2) + rand() * (coarse ? 14 : 7);
      const freq = (0.004 + rand() * 0.01) * Math.PI * 2;
      const phase = rand() * Math.PI * 2;
      const dark = 0.04 + rand() * 0.16;
      ctx.strokeStyle = `rgba(40,40,40,${dark})`;
      ctx.lineWidth = (coarse ? 1.5 : 0.6) + rand() * (coarse ? 3.5 : 2.2);
      for (const wrap of [-size, 0, size]) {
        ctx.beginPath();
        for (let x = 0; x <= size; x += 8) {
          const y = y0 + wrap + Math.sin(x * freq + phase) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    // A few knots
    for (let k = 0; k < (coarse ? 6 : 3); k++) {
      const kx = rand() * size;
      const ky = rand() * size;
      for (let r = 4; r < 22; r += 4) {
        ctx.strokeStyle = `rgba(40,40,40,${0.22 - r * 0.008})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(kx, ky, r * 2.2, r, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  } else if (kind === 'boucle') {
    ctx.fillStyle = '#e2e2e2';
    ctx.fillRect(0, 0, size, size);
    // Tiny loops of yarn, drawn with wrap-around copies so the tile is seamless
    for (let i = 0; i < 2600; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 2 + rand() * 3.5;
      const dark = rand() > 0.5;
      ctx.strokeStyle = dark ? `rgba(0,0,0,${0.08 + rand() * 0.18})` : `rgba(255,255,255,${0.2 + rand() * 0.3})`;
      ctx.lineWidth = 1.1;
      for (const ox of [0, -size, size]) {
        for (const oy of [0, -size, size]) {
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, r, rand() * 6, rand() * 6 + 3.6);
          ctx.stroke();
        }
      }
    }
  } else if (kind === 'velvet') {
    ctx.fillStyle = '#dedede';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 2200; i++) {
      ctx.fillStyle = `rgba(${rand() > 0.5 ? '0,0,0' : '255,255,255'},${rand() * 0.07})`;
      ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 2, 1 + rand() * 6);
    }
  } else if (kind === 'leather') {
    ctx.fillStyle = '#d4d4d4';
    ctx.fillRect(0, 0, size, size);
    // Pebbled grain: irregular cells with dark creases between them (wrapped copies keep it seamless)
    for (let i = 0; i < 520; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 4 + rand() * 6;
      for (const ox of [0, -size, size]) {
        for (const oy of [0, -size, size]) {
          const g = ctx.createRadialGradient(x + ox - r * 0.3, y + oy - r * 0.3, 0, x + ox, y + oy, r);
          g.addColorStop(0, 'rgba(255,255,255,0.28)');
          g.addColorStop(0.7, 'rgba(0,0,0,0.02)');
          g.addColorStop(1, 'rgba(0,0,0,0.30)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else if (kind === 'mesh') {
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(0, 0, size, size);
    const cell = 8;
    for (let y = 0; y < size; y += cell) {
      for (let x = 0; x < size; x += cell) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(x + 2, y + 2, cell - 4, cell - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x, y, cell, 1);
      }
    }
  } else if (kind === 'marble') {
    ctx.fillStyle = '#ececec';
    ctx.fillRect(0, 0, size, size);
    // Soft clouds, then thin veins following a random walk
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(120,120,130,${0.015 + rand() * 0.03})`;
      ctx.beginPath();
      ctx.arc(rand() * size, rand() * size, 30 + rand() * 90, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let v = 0; v < 9; v++) {
      let x = rand() * size;
      let y = rand() * size;
      let angle = rand() * Math.PI * 2;
      const width = 0.7 + rand() * 2.4;
      ctx.strokeStyle = `rgba(60,60,75,${0.18 + rand() * 0.35})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let step = 0; step < 90; step++) {
        angle += (rand() - 0.5) * 0.5;
        x += Math.cos(angle) * 9;
        y += Math.sin(angle) * 9;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (kind === 'concrete') {
    ctx.fillStyle = '#cfcfcf';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 380; i++) {
      const light = rand() > 0.5;
      ctx.fillStyle = `rgba(${light ? '255,255,255' : '0,0,0'},${0.02 + rand() * 0.05})`;
      const r = 14 + rand() * 60;
      const x = rand() * size;
      const y = rand() * size;
      for (const ox of [0, -size, size]) {
        for (const oy of [0, -size, size]) {
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.15 + rand() * 0.3})`;
      ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 1.5, 1 + rand() * 1.5);
    }
  } else if (kind === 'fabric') {
    ctx.fillStyle = '#e4e4e4';
    ctx.fillRect(0, 0, size, size);
    // Woven threads
    for (let i = 0; i < size; i += 2) {
      ctx.fillStyle = `rgba(0,0,0,${0.1 + rand() * 0.07})`;
      ctx.fillRect(0, i, size, 1);
      ctx.fillStyle = `rgba(255,255,255,${0.12 + rand() * 0.08})`;
      ctx.fillRect(i, 0, 1, size);
    }
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(0,0,0,${rand() * 0.1})`;
      ctx.fillRect(rand() * size, rand() * size, 1, 1);
    }
  } else if (kind === 'brushed') {
    ctx.fillStyle = '#dcdcdc';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 520; i++) {
      const y = rand() * size;
      const light = rand() > 0.5;
      ctx.strokeStyle = light ? `rgba(255,255,255,${0.05 + rand() * 0.14})` : `rgba(0,0,0,${0.025 + rand() * 0.06})`;
      ctx.lineWidth = 0.5 + rand();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + (rand() - 0.5) * 2);
      ctx.stroke();
    }
  } else {
    // speckle: engineered stone / quartz
    ctx.fillStyle = '#e2e2e2';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 2600; i++) {
      const v = Math.floor(120 + rand() * 135);
      ctx.fillStyle = `rgba(${v},${v},${v},${0.25 + rand() * 0.5})`;
      const r = 0.5 + rand() * 1.8;
      ctx.beginPath();
      ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function getPattern(kind: PatternKind): THREE.CanvasTexture | null {
  if (textureCache.has(kind)) return textureCache.get(kind) ?? null;
  if (typeof document === 'undefined') {
    textureCache.set(kind, null);
    return null;
  }
  const size = PATTERN_SIZE[kind];
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    textureCache.set(kind, null);
    return null;
  }
  drawPattern(kind, ctx, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  textureCache.set(kind, tex);
  return tex;
}

interface SurfaceSpec {
  pattern?: PatternKind;
  roughness: number;
  metalness: number;
  bump?: number;
  clearcoat?: number;
  sheen?: number;
}

const SURFACES: Record<SurfaceKind, SurfaceSpec> = {
  wood: { pattern: 'wood', roughness: 0.55, metalness: 0, bump: 0.5, clearcoat: 0.15 },
  woodCoarse: { pattern: 'woodCoarse', roughness: 0.62, metalness: 0, bump: 0.7, clearcoat: 0.08 },
  fabric: { pattern: 'fabric', roughness: 0.95, metalness: 0, bump: 1.2, sheen: 0.5 },
  boucle: { pattern: 'boucle', roughness: 0.98, metalness: 0, bump: 2.2, sheen: 0.35 },
  velvet: { pattern: 'velvet', roughness: 0.82, metalness: 0, bump: 0.25, sheen: 1 },
  leather: { pattern: 'leather', roughness: 0.48, metalness: 0, bump: 0.9, clearcoat: 0.25, sheen: 0.2 },
  mesh: { pattern: 'mesh', roughness: 0.9, metalness: 0, bump: 1.2 },
  metal: { pattern: 'brushed', roughness: 0.34, metalness: 0.85, bump: 0.08 },
  polished: { roughness: 0.06, metalness: 1 },
  gloss: { roughness: 0.12, metalness: 0.02, clearcoat: 0.8 },
  plastic: { roughness: 0.38, metalness: 0, clearcoat: 0.15 },
  stone: { pattern: 'speckle', roughness: 0.28, metalness: 0.02, clearcoat: 0.4 },
  marble: { pattern: 'marble', roughness: 0.16, metalness: 0.02, clearcoat: 0.6 },
  concrete: { pattern: 'concrete', roughness: 0.92, metalness: 0, bump: 1.1 },
  satin: { roughness: 0.42, metalness: 0.02, clearcoat: 0.2 },
  matte: { roughness: 0.8, metalness: 0.02 },
};

/** Numbers that make two surface kinds look different (used by tests to verify the finish is really applied). */
export function surfaceSignature(material: THREE.Material): string {
  const m = material as THREE.MeshPhysicalMaterial;
  return [m.roughness, m.metalness, m.clearcoat ?? 0, m.sheen ?? 0].join('|');
}

const HIGHLIGHT = new THREE.Color('#0ea5e9');

/**
 * A tinted, textured material for a surface kind. `tileMm` (stored in userData) tells the UV mapper how big one
 * repetition of the pattern is in the real world.
 */
export function createSurface(kind: SurfaceKind, color: string, selected = false): THREE.MeshPhysicalMaterial {
  const spec = SURFACES[kind];
  const tex = spec.pattern ? getPattern(spec.pattern) : null;

  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: spec.roughness,
    metalness: spec.metalness,
    clearcoat: spec.clearcoat ?? 0,
    clearcoatRoughness: 0.35,
    sheen: spec.sheen ?? 0,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.4),
  });
  if (tex) {
    mat.map = tex;
    if (spec.bump) {
      mat.bumpMap = tex;
      mat.bumpScale = spec.bump;
    }
    mat.userData.tileMm = PATTERN_TILE_MM[spec.pattern!];
  }
  if (selected) {
    mat.emissive = HIGHLIGHT.clone();
    mat.emissiveIntensity = 0.28;
  }
  return mat;
}

/** Darker / lighter variant of a colour, for secondary parts made of the same material. */
export function shade(color: string, amount: number): string {
  const c = new THREE.Color(color);
  const target = amount < 0 ? new THREE.Color('#000000') : new THREE.Color('#ffffff');
  return `#${c.lerp(target, Math.min(1, Math.abs(amount))).getHexString()}`;
}

/**
 * Re-maps UVs so one texture tile covers `tileMm` of real surface, whatever the mesh size. The projection axis is
 * the one most aligned with each vertex normal. On tall, thin parts (legs, posts) the grain runs along the part.
 */
export function applyWorldUV(geometry: THREE.BufferGeometry, tileMm: number) {
  const pos = geometry.getAttribute('position');
  const nor = geometry.getAttribute('normal');
  if (!pos || !nor) return;

  geometry.computeBoundingBox();
  const size = geometry.boundingBox!.getSize(new THREE.Vector3());
  const vertical = size.y > 2 * Math.max(size.x, size.z);

  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const nz = Math.abs(nor.getZ(i));
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    let u: number;
    let v: number;
    if (ny >= nx && ny >= nz) {
      u = x;
      v = z;
    } else if (nx >= nz) {
      u = vertical ? y : z;
      v = vertical ? z : y;
    } else {
      u = vertical ? y : x;
      v = vertical ? x : y;
    }
    uv[i * 2] = u / tileMm;
    uv[i * 2 + 1] = v / tileMm;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

// ---------------------------------------------------------------------------
// Fixed accent materials (no texture): metals, glass, ceramics, rubber...
// ---------------------------------------------------------------------------

export type AccentKind =
  | 'chrome'
  | 'brass'
  | 'steel'
  | 'blackMetal'
  | 'rubber'
  | 'glass'
  | 'mirror'
  | 'ceramic'
  | 'screen'
  | 'lampGlow'
  | 'water';

export function createAccent(kind: AccentKind, selected = false): THREE.MeshPhysicalMaterial {
  const base: Record<AccentKind, THREE.MeshPhysicalMaterialParameters> = {
    chrome: { color: '#e5e7eb', metalness: 1, roughness: 0.08 },
    brass: { color: '#d4a64a', metalness: 0.95, roughness: 0.28 },
    steel: { color: '#cbd5e1', metalness: 0.9, roughness: 0.3 },
    blackMetal: { color: '#1f2937', metalness: 0.7, roughness: 0.45 },
    rubber: { color: '#111827', metalness: 0, roughness: 0.9 },
    glass: { color: '#bfdbfe', metalness: 0, roughness: 0.05, transparent: true, opacity: 0.35 },
    mirror: { color: '#f1f5f9', metalness: 1, roughness: 0.03 },
    ceramic: { color: '#fafafa', metalness: 0, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 },
    screen: { color: '#0b1220', metalness: 0.3, roughness: 0.1, clearcoat: 1 },
    lampGlow: { color: '#fff3c4', emissive: new THREE.Color('#ffd98a'), emissiveIntensity: 0.75, roughness: 0.6, side: THREE.DoubleSide },
    water: { color: '#bae6fd', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.6 },
  };
  const mat = new THREE.MeshPhysicalMaterial(base[kind]);
  if (selected && kind !== 'glass' && kind !== 'lampGlow') {
    mat.emissive = HIGHLIGHT.clone();
    mat.emissiveIntensity = 0.2;
  }
  return mat;
}
