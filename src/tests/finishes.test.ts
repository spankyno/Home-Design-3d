import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  COLOR_FAMILIES,
  FINISHES,
  FINISH_GROUPS,
  canonicalFinishId,
  finishById,
  isHexColor,
  luminanceOf,
  normalizeHex,
  surfaceKindOf,
} from '../materials/finishes';
import { surfaceSignature, createSurface } from '../materials/furniture';
import { FURNITURE_CATALOG, furnitureFromCatalog } from '../catalog';
import { buildFurnitureModel, buildParametricCabinet3D } from '../editor3d/furnitureModels';
import { buildFurnitureMesh } from '../editor3d/sceneBuilders';
import { createDefaultCabinetConfig } from '../parametric';
import { createSampleProject, normalizeProject } from '../storage';
import { createWallMaterial } from '../materials';
import type { FurnitureItem } from '../types';

describe('finish catalog', () => {
  it('has unique ids, valid colours and every group is populated', () => {
    const ids = FINISHES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    FINISHES.forEach((f) => expect(isHexColor(f.defaultColor)).toBe(true));
    for (const g of FINISH_GROUPS) expect(FINISHES.filter((f) => f.group === g.id).length).toBeGreaterThanOrEqual(4);
    expect(FINISHES.length).toBeGreaterThanOrEqual(30);
  });

  it('every catalog piece uses a known, current finish id', () => {
    for (const def of FURNITURE_CATALOG) {
      expect(finishById(def.defaultMaterial)?.id, `${def.id}: ${def.defaultMaterial}`).toBe(def.defaultMaterial);
    }
  });

  it('legacy ids resolve to current finishes and free text still gets a sensible kind', () => {
    expect(canonicalFinishId('fabric_gray')).toBe('fabric_weave');
    expect(canonicalFinishId('stainless_steel')).toBe('metal_steel');
    expect(canonicalFinishId('wood_oak')).toBe('wood_oak');
    expect(canonicalFinishId('algo_raro')).toBe('algo_raro');
    expect(surfaceKindOf('Roble claro')).toBe('wood');
    expect(surfaceKindOf('metal cepillado')).toBe('metal');
    expect(surfaceKindOf('cuero marrón')).toBe('leather');
    expect(surfaceKindOf('???')).toBe('matte');
  });

  it('old saved projects are migrated to current finish ids on load', () => {
    const p = createSampleProject();
    p.furniture[0] = { ...p.furniture[0], material: 'fabric_gray' };
    expect(normalizeProject(p).furniture[0].material).toBe('fabric_weave');
  });

  it('the distinct surface kinds really look different (distinct PBR signatures)', () => {
    const kinds = [...new Set(FINISHES.map((f) => f.kind))];
    const sigs = kinds.map((k) => surfaceSignature(createSurface(k, '#808080')));
    expect(kinds.length).toBeGreaterThanOrEqual(14);
    expect(new Set(sigs).size).toBe(kinds.length);
  });
});

describe('colour palette', () => {
  it('has 8 families x 8 shades, all valid and unique', () => {
    expect(COLOR_FAMILIES).toHaveLength(8);
    const all = COLOR_FAMILIES.flatMap((f) => f.colors);
    expect(all).toHaveLength(64);
    all.forEach((c) => expect(isHexColor(c.hex)).toBe(true));
    expect(new Set(all.map((c) => c.hex)).size).toBe(64);
    expect(new Set(all.map((c) => c.name)).size).toBe(64);
  });

  it('normalises and validates hex input', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    expect(normalizeHex(' a1b2c3 ')).toBe('#a1b2c3');
    expect(normalizeHex('#12345')).toBeNull();
    expect(normalizeHex('azul')).toBeNull();
    expect(luminanceOf('#ffffff')).toBeCloseTo(1, 2);
    expect(luminanceOf('#000000')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Rendering follows the chosen colour and finish
// ---------------------------------------------------------------------------

interface Part {
  area: number;
  color: string;
  signature: string;
}

/** Visible parts of a model: surface area, tint colour and PBR signature of each mesh's material. */
function partsOf(g: THREE.Object3D): Part[] {
  const out: Part[] = [];
  g.updateMatrixWorld(true);
  g.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || Array.isArray(o.material) || o.userData.decor) return; // books etc.
    const mat = o.material as THREE.MeshPhysicalMaterial;
    if (mat.transparent || (mat.emissiveIntensity > 0.5 && mat.emissive.getHex() !== 0)) return; // glass, glowing shades
    const geo = o.geometry as THREE.BufferGeometry;
    geo.computeBoundingBox();
    const s = geo.boundingBox!.getSize(new THREE.Vector3());
    const sc = new THREE.Vector3().setFromMatrixScale(o.matrixWorld);
    const [x, y, z] = [s.x * sc.x, s.y * sc.y, s.z * sc.z];
    out.push({ area: 2 * (x * y + y * z + x * z), color: mat.color.getHexString(), signature: surfaceSignature(mat) });
  });
  return out;
}

/** Share of the visible surface area (0..1) satisfying `changed`. */
const share = (a: Part[], b: Part[], changed: (x: Part, y: Part) => boolean) => {
  const total = a.reduce((sum, p) => sum + p.area, 0);
  const moved = a.reduce((sum, p, i) => sum + (b[i] && changed(p, b[i]) ? p.area : 0), 0);
  return moved / total;
};

const withLook = (item: FurnitureItem, color: string, material: string): FurnitureItem => ({ ...item, color, material });

describe('rendering follows the colour and finish of each piece', () => {
  // Pieces whose look is mostly hardware have a lower bar, the rest must be clearly dominated
  const MIN_SHARE: Record<string, number> = { bath_shower: 0.45, kitchen_stove_unit: 0.45 };

  it.each(FURNITURE_CATALOG.map((c) => [c.id, c] as const))('%s: colour changes the visible surfaces', (_id, def) => {
    const base = furnitureFromCatalog(def, { x: 0, y: 0 });
    const red = partsOf(buildFurnitureModel(withLook(base, '#d63a3a', base.material), false));
    const blue = partsOf(buildFurnitureModel(withLook(base, '#2f55b5', base.material), false));
    expect(red.length).toBe(blue.length);
    expect(share(red, blue, (x, y) => x.color !== y.color)).toBeGreaterThanOrEqual(MIN_SHARE[def.id] ?? 0.55);
  });

  it.each(FURNITURE_CATALOG.map((c) => [c.id, c] as const))('%s: finish changes the visible surfaces', (_id, def) => {
    const base = furnitureFromCatalog(def, { x: 0, y: 0 });
    // Compare two finishes with clearly different PBR looks, neither of which is the piece's own
    const [fa, fb] = ['velvet', 'metal_chrome'].map((f) => (f === base.material ? 'leather' : f));
    const a = partsOf(buildFurnitureModel(withLook(base, base.color, fa), false));
    const b = partsOf(buildFurnitureModel(withLook(base, base.color, fb), false));
    expect(share(a, b, (x, y) => x.signature !== y.signature)).toBeGreaterThanOrEqual(MIN_SHARE[def.id] ?? 0.55);
  });

  it('a parametric cabinet uses the item colour/finish, not a stale copy in its config', () => {
    const cfg = createDefaultCabinetConfig('closet');
    const item: FurnitureItem = {
      ...furnitureFromCatalog(FURNITURE_CATALOG[0], { x: 0, y: 0 }),
      isParametric: true,
      parametricConfig: { ...cfg, finishColor: '#ffffff', finishMaterial: 'melamine' },
      width: cfg.exteriorWidth,
      depth: cfg.exteriorDepth,
      height: cfg.exteriorHeight,
      color: '#d63a3a',
      material: 'velvet',
    };
    const g = buildFurnitureMesh(item, false);
    const parts = partsOf(g);
    const dominant = parts.sort((a, b) => b.area - a.area)[0];
    expect(dominant.signature).toBe(surfaceSignature(createSurface('velvet', '#d63a3a')));
    // tinted towards the item colour (red), not the stale white
    const tint = new THREE.Color(`#${dominant.color}`);
    expect(tint.r).toBeGreaterThan(tint.b);
    expect(buildParametricCabinet3D(cfg, false).children.length).toBeGreaterThan(0);
  });

  it('selecting a piece keeps its colour and finish (tint only)', () => {
    const base = furnitureFromCatalog(FURNITURE_CATALOG.find((c) => c.id === 'sofa_3p')!, { x: 0, y: 0 });
    const a = partsOf(buildFurnitureModel(base, false));
    const b = partsOf(buildFurnitureModel(base, true));
    expect(share(a, b, (x, y) => x.color !== y.color || x.signature !== y.signature)).toBe(0);
  });

  it('a selected wall keeps its colour (it only gets a tint)', () => {
    const plain = createWallMaterial('paint_white' as never, '#9caf88', false, 1, false);
    const selected = createWallMaterial('paint_white' as never, '#9caf88', false, 1, true);
    expect(selected.color.getHexString()).toBe(plain.color.getHexString());
    expect(selected.emissiveIntensity).toBeGreaterThan(0);
    expect(plain.emissive.getHex()).toBe(0);
  });
});
