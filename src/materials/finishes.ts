/**
 * Finishes ("acabados") and colour palette for furniture. Pure data, no Three.js, so the UI and the tests can use it.
 *
 * A finish decides HOW a surface looks (grain, weave, sheen, metalness); the colour decides its tint. The 3D models
 * combine both, so every piece is rendered according to the colour and finish chosen in the inspector.
 */

export type SurfaceKind =
  | 'wood'
  | 'woodCoarse'
  | 'fabric'
  | 'boucle'
  | 'velvet'
  | 'leather'
  | 'mesh'
  | 'metal'
  | 'polished'
  | 'gloss'
  | 'plastic'
  | 'stone'
  | 'marble'
  | 'concrete'
  | 'satin'
  | 'matte';

export type FinishGroupId = 'wood' | 'upholstery' | 'metal' | 'stone' | 'painted';

export interface FinishDef {
  id: string;
  name: string;
  kind: SurfaceKind;
  group: FinishGroupId;
  /** Natural colour of the material. Applied together with the finish when `natural` is true. */
  defaultColor: string;
  /** Natural materials (oak, brass, marble...) bring their own colour; painted/upholstered ones keep the user's. */
  natural: boolean;
}

export const FINISH_GROUPS: Array<{ id: FinishGroupId; label: string }> = [
  { id: 'wood', label: 'Maderas' },
  { id: 'upholstery', label: 'Tapizados y cuero' },
  { id: 'metal', label: 'Metales' },
  { id: 'stone', label: 'Piedra y cerámica' },
  { id: 'painted', label: 'Lacados y laminados' },
];

export const FINISHES: FinishDef[] = [
  // Maderas
  { id: 'wood_oak', name: 'Roble', kind: 'wood', group: 'wood', defaultColor: '#c8a165', natural: true },
  { id: 'wood_oak_dark', name: 'Roble ahumado', kind: 'wood', group: 'wood', defaultColor: '#7a5230', natural: true },
  { id: 'wood_walnut', name: 'Nogal', kind: 'wood', group: 'wood', defaultColor: '#6b4429', natural: true },
  { id: 'wood_beech', name: 'Haya', kind: 'wood', group: 'wood', defaultColor: '#dcbb8d', natural: true },
  { id: 'wood_pine', name: 'Pino', kind: 'woodCoarse', group: 'wood', defaultColor: '#e0c28a', natural: true },
  { id: 'wood_teak', name: 'Teca', kind: 'wood', group: 'wood', defaultColor: '#a8743a', natural: true },
  { id: 'wood_wenge', name: 'Wengué', kind: 'wood', group: 'wood', defaultColor: '#3b2a22', natural: true },
  { id: 'wood_white', name: 'Madera lacada', kind: 'wood', group: 'wood', defaultColor: '#f1f5f9', natural: false },

  // Tapizados y cuero
  { id: 'fabric_weave', name: 'Tela tejida', kind: 'fabric', group: 'upholstery', defaultColor: '#94a3b8', natural: false },
  { id: 'fabric_linen', name: 'Lino', kind: 'fabric', group: 'upholstery', defaultColor: '#d8cdb8', natural: false },
  { id: 'fabric_cotton', name: 'Algodón', kind: 'fabric', group: 'upholstery', defaultColor: '#e5e7eb', natural: false },
  { id: 'fabric_boucle', name: 'Bouclé', kind: 'boucle', group: 'upholstery', defaultColor: '#efe6d8', natural: false },
  { id: 'velvet', name: 'Terciopelo', kind: 'velvet', group: 'upholstery', defaultColor: '#475569', natural: false },
  { id: 'suede', name: 'Ante / microfibra', kind: 'velvet', group: 'upholstery', defaultColor: '#8b7355', natural: false },
  { id: 'leather', name: 'Cuero', kind: 'leather', group: 'upholstery', defaultColor: '#7a4a2b', natural: false },
  { id: 'mesh', name: 'Malla técnica', kind: 'mesh', group: 'upholstery', defaultColor: '#1f2937', natural: false },

  // Metales
  { id: 'metal_steel', name: 'Acero inoxidable', kind: 'metal', group: 'metal', defaultColor: '#cbd5e1', natural: true },
  { id: 'metal_alu', name: 'Aluminio', kind: 'metal', group: 'metal', defaultColor: '#d1d5db', natural: true },
  { id: 'metal_brass', name: 'Latón', kind: 'metal', group: 'metal', defaultColor: '#d4a64a', natural: true },
  { id: 'metal_copper', name: 'Cobre', kind: 'metal', group: 'metal', defaultColor: '#b87333', natural: true },
  { id: 'metal_chrome', name: 'Cromo pulido', kind: 'polished', group: 'metal', defaultColor: '#e5e7eb', natural: true },
  { id: 'metal_black', name: 'Metal negro', kind: 'metal', group: 'metal', defaultColor: '#1f2937', natural: true },

  // Piedra y cerámica
  { id: 'quartz', name: 'Cuarzo', kind: 'stone', group: 'stone', defaultColor: '#2f3338', natural: false },
  { id: 'granite', name: 'Granito', kind: 'stone', group: 'stone', defaultColor: '#6b7280', natural: true },
  { id: 'marble', name: 'Mármol', kind: 'marble', group: 'stone', defaultColor: '#f1f5f9', natural: true },
  { id: 'concrete', name: 'Hormigón pulido', kind: 'concrete', group: 'stone', defaultColor: '#9ca3af', natural: true },
  { id: 'porcelain', name: 'Porcelana', kind: 'gloss', group: 'stone', defaultColor: '#fafafa', natural: false },

  // Lacados y laminados
  { id: 'lacquer_gloss', name: 'Lacado brillante', kind: 'gloss', group: 'painted', defaultColor: '#f8fafc', natural: false },
  { id: 'melamine', name: 'Melamina', kind: 'satin', group: 'painted', defaultColor: '#d1d5db', natural: false },
  { id: 'laminate_matte', name: 'Laminado mate', kind: 'matte', group: 'painted', defaultColor: '#e5e7eb', natural: false },
  { id: 'paint_satin', name: 'Pintura satinada', kind: 'satin', group: 'painted', defaultColor: '#f1f5f9', natural: false },
  { id: 'paint_matte', name: 'Pintura mate', kind: 'matte', group: 'painted', defaultColor: '#e2e8f0', natural: false },
  { id: 'plastic', name: 'Plástico / resina', kind: 'plastic', group: 'painted', defaultColor: '#f8fafc', natural: false },
];

/** Ids used by earlier catalog versions and saved projects -> current finish ids. */
const LEGACY_FINISH_ALIASES: Record<string, string> = {
  wood_dark: 'wood_oak_dark',
  wood_metal: 'wood_oak',
  steel_wood: 'wood_oak',
  fabric: 'fabric_weave',
  fabric_gray: 'fabric_weave',
  fabric_dark: 'fabric_weave',
  fabric_velvet: 'velvet',
  linen: 'fabric_linen',
  linen_light: 'fabric_linen',
  cotton: 'fabric_cotton',
  mesh_black: 'mesh',
  brass: 'metal_brass',
  steel_brushed: 'metal_steel',
  stainless_steel: 'metal_steel',
  quartz_black: 'quartz',
  porcelain_white: 'porcelain',
  ceramic_glass: 'porcelain',
  resin_white: 'plastic',
  acrylic_white: 'plastic',
  laminate_white: 'laminate_matte',
  melamine_gray: 'melamine',
  melamine_white: 'melamine',
  kitchen_white: 'melamine',
  matte_color: 'paint_matte',
};

const BY_ID = new Map(FINISHES.map((f) => [f.id, f]));

/** Resolves any finish id (current or legacy) to a finish definition, if there is one. */
export function finishById(id: string | undefined): FinishDef | undefined {
  if (!id) return undefined;
  return BY_ID.get(id) ?? BY_ID.get(LEGACY_FINISH_ALIASES[id]);
}

/** Current id for a (possibly legacy) finish id; unknown free-text ids are returned unchanged. */
export function canonicalFinishId(id: string | undefined): string {
  return finishById(id)?.id ?? id ?? '';
}

/**
 * Surface kind for a finish id. Falls back to keyword matching so that free-text materials from imported or
 * hand-edited projects ("roble_claro", "Metal cepillado"...) still get a sensible look.
 */
export function surfaceKindOf(material: string | undefined): SurfaceKind {
  const known = finishById(material);
  if (known) return known.kind;

  const m = (material ?? '').toLowerCase();
  if (/wood|oak|walnut|teak|pine|madera|roble|nogal|haya|pino/.test(m)) return 'wood';
  if (/leather|cuero|piel/.test(m)) return 'leather';
  if (/velvet|terciopelo|suede|ante/.test(m)) return 'velvet';
  if (/fabric|linen|cotton|textile|tela|lino|algod/.test(m)) return 'fabric';
  if (/chrome|cromo/.test(m)) return 'polished';
  if (/steel|brass|metal|alu|iron|copper|lat[oó]n|acero|cobre/.test(m)) return 'metal';
  if (/marble|m[aá]rmol/.test(m)) return 'marble';
  if (/concrete|hormig/.test(m)) return 'concrete';
  if (/quartz|stone|granite|terrazzo|cuarzo|granito|piedra/.test(m)) return 'stone';
  if (/porcelain|ceramic|glass|enamel|porcelana|cer[aá]mica|lacado|lacquer/.test(m)) return 'gloss';
  if (/resin|acrylic|plastic|pl[aá]stico|resina/.test(m)) return 'plastic';
  if (/laminate|melamine|kitchen|melamina|laminado|satin/.test(m)) return 'satin';
  return 'matte';
}

// ---------------------------------------------------------------------------
// Colour palette: 8 families x 8 shades
// ---------------------------------------------------------------------------

export interface PaletteColor {
  name: string;
  hex: string;
}

export const COLOR_FAMILIES: Array<{ id: string; label: string; colors: PaletteColor[] }> = [
  {
    id: 'neutral',
    label: 'Neutros',
    colors: [
      { name: 'Blanco', hex: '#ffffff' },
      { name: 'Blanco roto', hex: '#f8f5ef' },
      { name: 'Marfil', hex: '#efe7d6' },
      { name: 'Gris perla', hex: '#e5e7eb' },
      { name: 'Gris claro', hex: '#cbd5e1' },
      { name: 'Gris', hex: '#94a3b8' },
      { name: 'Grafito', hex: '#475569' },
      { name: 'Negro', hex: '#111827' },
    ],
  },
  {
    id: 'wood',
    label: 'Maderas',
    colors: [
      { name: 'Abedul', hex: '#e6cfa5' },
      { name: 'Roble claro', hex: '#d2a96a' },
      { name: 'Miel', hex: '#b8803f' },
      { name: 'Teca', hex: '#a8743a' },
      { name: 'Caoba', hex: '#7b3a26' },
      { name: 'Nogal', hex: '#6b4429' },
      { name: 'Chocolate', hex: '#4a2f20' },
      { name: 'Wengué', hex: '#2e211b' },
    ],
  },
  {
    id: 'earth',
    label: 'Tierras',
    colors: [
      { name: 'Crema', hex: '#f3e5c8' },
      { name: 'Arena', hex: '#dcc7a0' },
      { name: 'Beige', hex: '#c9b08a' },
      { name: 'Camel', hex: '#b5834a' },
      { name: 'Terracota', hex: '#c2603a' },
      { name: 'Ladrillo', hex: '#9a3f2b' },
      { name: 'Óxido', hex: '#8a4b24' },
      { name: 'Taupe', hex: '#8b7b6b' },
    ],
  },
  {
    id: 'green',
    label: 'Verdes',
    colors: [
      { name: 'Menta', hex: '#bfe3d0' },
      { name: 'Salvia', hex: '#a3b899' },
      { name: 'Lima', hex: '#a8c93a' },
      { name: 'Oliva', hex: '#7d8a4a' },
      { name: 'Verde', hex: '#4f8a5b' },
      { name: 'Esmeralda', hex: '#1f7a5a' },
      { name: 'Pino', hex: '#2d5a48' },
      { name: 'Bosque', hex: '#1f4d3a' },
    ],
  },
  {
    id: 'blue',
    label: 'Azules',
    colors: [
      { name: 'Hielo', hex: '#d6e8f5' },
      { name: 'Celeste', hex: '#8ec5ea' },
      { name: 'Azul', hex: '#3b82f6' },
      { name: 'Cobalto', hex: '#2f55b5' },
      { name: 'Turquesa', hex: '#26a6a0' },
      { name: 'Petróleo', hex: '#1f5f6b' },
      { name: 'Pizarra', hex: '#3b4a63' },
      { name: 'Marino', hex: '#1e3a5f' },
    ],
  },
  {
    id: 'red',
    label: 'Rojos y rosas',
    colors: [
      { name: 'Rosa palo', hex: '#f3c9c9' },
      { name: 'Salmón', hex: '#f4a28c' },
      { name: 'Coral', hex: '#f08a74' },
      { name: 'Rojo', hex: '#d63a3a' },
      { name: 'Fucsia', hex: '#d6409f' },
      { name: 'Frambuesa', hex: '#b3265e' },
      { name: 'Burdeos', hex: '#7a1f2e' },
      { name: 'Vino', hex: '#4d1521' },
    ],
  },
  {
    id: 'yellow',
    label: 'Amarillos y naranjas',
    colors: [
      { name: 'Vainilla', hex: '#f6e7a8' },
      { name: 'Limón', hex: '#f7e05a' },
      { name: 'Ámbar', hex: '#f59e0b' },
      { name: 'Mostaza', hex: '#d9a21b' },
      { name: 'Dorado', hex: '#c9a227' },
      { name: 'Naranja', hex: '#ee7a1c' },
      { name: 'Calabaza', hex: '#c8561c' },
      { name: 'Miel oscura', hex: '#b7791f' },
    ],
  },
  {
    id: 'purple',
    label: 'Morados',
    colors: [
      { name: 'Lavanda', hex: '#cbbcf0' },
      { name: 'Lila', hex: '#a78bfa' },
      { name: 'Orquídea', hex: '#c77dd1' },
      { name: 'Malva', hex: '#b58bb5' },
      { name: 'Violeta', hex: '#7c3aed' },
      { name: 'Índigo', hex: '#4338ca' },
      { name: 'Ciruela', hex: '#5b2a6e' },
      { name: 'Berenjena', hex: '#3e1f47' },
    ],
  },
];

/** Whether `value` is a 6-digit hex colour like #a1b2c3. */
export const isHexColor = (value: string): boolean => /^#[0-9a-f]{6}$/i.test(value);

/** Accepts "abc", "#abc", "a1b2c3" or "#A1B2C3" and returns "#a1b2c3", or null when it is not a colour. */
export function normalizeHex(input: string): string | null {
  let v = input.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(v)) v = v.split('').map((c) => c + c).join('');
  return /^[0-9a-f]{6}$/.test(v) ? `#${v}` : null;
}

/** Relative luminance (0..1) of a hex colour, sRGB approximation. */
export function luminanceOf(hex: string): number {
  const h = normalizeHex(hex) ?? '#808080';
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
