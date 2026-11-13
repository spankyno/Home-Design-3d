import React, { useEffect, useMemo, useState } from 'react';
import { Check, Pipette } from 'lucide-react';
import {
  COLOR_FAMILIES,
  FINISHES,
  FINISH_GROUPS,
  FinishDef,
  SurfaceKind,
  finishById,
  normalizeHex,
} from '../materials/finishes';

// ---------------------------------------------------------------------------
// Recent colours (per browser)
// ---------------------------------------------------------------------------

const RECENT_KEY = 'mhd_recent_colors';
const MAX_RECENT = 8;

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string' && !!normalizeHex(c)) : [];
  } catch {
    return [];
  }
}

function rememberColor(hex: string): string[] {
  const next = [hex, ...readRecent().filter((c) => c !== hex)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // private mode / quota: recents just won't persist
  }
  return next;
}

// ---------------------------------------------------------------------------
// Colour picker
// ---------------------------------------------------------------------------

interface ColorPickerProps {
  value: string;
  /** Live change (also fires while dragging the native picker). */
  onChange: (hex: string) => void;
  /** A choice was finished (swatch click, picker closed...): the caller records one undo step. */
  onCommit?: () => void;
  /** Accessible name of the group, e.g. "Color del mueble". */
  label: string;
}

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, onCommit, label }) => {
  const current = (normalizeHex(value) ?? '#808080').toLowerCase();
  const [hexDraft, setHexDraft] = useState(current);
  const [recent, setRecent] = useState<string[]>([]);
  const familyOfCurrent = useMemo(
    () => COLOR_FAMILIES.find((f) => f.colors.some((c) => c.hex.toLowerCase() === current))?.id,
    [current]
  );
  const [family, setFamily] = useState(familyOfCurrent ?? COLOR_FAMILIES[0].id);

  useEffect(() => setRecent(readRecent()), []);
  useEffect(() => setHexDraft(current), [current]);
  useEffect(() => {
    if (familyOfCurrent) setFamily(familyOfCurrent);
  }, [familyOfCurrent]);

  const pick = (hex: string) => {
    onChange(hex);
    setRecent(rememberColor(hex));
    onCommit?.();
  };

  const eyeDropper = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
  const activeFamily = COLOR_FAMILIES.find((f) => f.id === family) ?? COLOR_FAMILIES[0];

  return (
    <div role="group" aria-label={label} className="space-y-2">
      {/* Custom colour: native picker + hex + eyedropper */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label}: selector libre`}
          value={current}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            setRecent(rememberColor(e.target.value));
            onCommit?.();
          }}
          className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
        />
        <input
          type="text"
          inputMode="text"
          spellCheck={false}
          maxLength={7}
          aria-label={`${label}: código hexadecimal`}
          value={hexDraft}
          onChange={(e) => {
            setHexDraft(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex) onChange(hex);
          }}
          onBlur={() => {
            setHexDraft(current);
            onCommit?.();
          }}
          className="min-w-0 flex-1 text-xs font-mono font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 uppercase focus:bg-white"
        />
        {eyeDropper && (
          <button
            type="button"
            title="Copiar un color de la pantalla"
            aria-label="Cuentagotas: copiar un color de la pantalla"
            onClick={async () => {
              try {
                const { sRGBHex } = await new eyeDropper().open();
                const hex = normalizeHex(sRGBHex);
                if (hex) pick(hex);
              } catch {
                // cancelled with Esc
              }
            }}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <Pipette className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Palette families */}
      <div className="flex flex-wrap gap-1" role="tablist" aria-label={`${label}: familias de color`}>
        {COLOR_FAMILIES.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={f.id === activeFamily.id}
            onClick={() => setFamily(f.id)}
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border transition-colors ${
              f.id === activeFamily.id
                ? 'bg-sky-700 text-white border-sky-600'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1" role="tabpanel">
        {activeFamily.colors.map((c) => (
          <Swatch key={c.hex} name={c.name} hex={c.hex} selected={c.hex.toLowerCase() === current} onPick={pick} />
        ))}
      </div>

      {recent.length > 0 && (
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Recientes</span>
          <div className="grid grid-cols-8 gap-1 mt-1">
            {recent.map((hex) => (
              <Swatch key={hex} name={`Reciente ${hex}`} hex={hex} selected={hex === current} onPick={pick} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Swatch: React.FC<{ name: string; hex: string; selected: boolean; onPick: (hex: string) => void }> = ({
  name,
  hex,
  selected,
  onPick,
}) => (
  <button
    type="button"
    title={`${name} · ${hex}`}
    aria-label={`${name} ${hex}`}
    aria-pressed={selected}
    onClick={() => onPick(hex)}
    style={{ backgroundColor: hex }}
    className={`relative aspect-square w-full rounded-md border shadow-xs transition-transform hover:scale-110 ${
      selected ? 'border-sky-600 ring-2 ring-sky-500 ring-offset-1' : 'border-slate-300'
    }`}
  >
    {selected && (
      <Check
        className="absolute inset-0 m-auto w-3 h-3 drop-shadow"
        style={{ color: isLight(hex) ? '#0f172a' : '#ffffff' }}
        aria-hidden
      />
    )}
  </button>
);

function isLight(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

// ---------------------------------------------------------------------------
// Finish picker
// ---------------------------------------------------------------------------

/** CSS approximation of each surface kind, tinted with the current colour, so the choice can be judged at a glance. */
export function finishPreviewStyle(kind: SurfaceKind, color: string): React.CSSProperties {
  const layers: Record<SurfaceKind, { image: string; size?: string }> = {
    wood: {
      image:
        'repeating-linear-gradient(7deg, rgba(0,0,0,.16) 0 1px, transparent 1px 4px), repeating-linear-gradient(-2deg, rgba(0,0,0,.08) 0 2px, transparent 2px 9px)',
    },
    woodCoarse: {
      image:
        'repeating-linear-gradient(9deg, rgba(0,0,0,.2) 0 2px, transparent 2px 7px), radial-gradient(ellipse at 60% 40%, rgba(0,0,0,.25) 0 3px, transparent 4px)',
    },
    fabric: {
      image:
        'repeating-linear-gradient(0deg, rgba(0,0,0,.14) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(255,255,255,.2) 0 1px, transparent 1px 3px)',
    },
    boucle: {
      image:
        'radial-gradient(circle at 30% 30%, rgba(255,255,255,.5) 0 1.5px, transparent 2.5px), radial-gradient(circle at 70% 65%, rgba(0,0,0,.25) 0 1.5px, transparent 2.5px)',
      size: '7px 7px',
    },
    velvet: { image: 'radial-gradient(ellipse at 28% 22%, rgba(255,255,255,.5), transparent 62%), linear-gradient(140deg, transparent 45%, rgba(0,0,0,.3))' },
    leather: {
      image: 'radial-gradient(circle, rgba(0,0,0,.28) 0 1px, transparent 1.8px), linear-gradient(135deg, rgba(255,255,255,.22), transparent 55%)',
      size: '5px 5px, 100% 100%',
    },
    mesh: { image: 'radial-gradient(circle, rgba(0,0,0,.65) 0 1.1px, transparent 1.6px)', size: '4px 4px' },
    metal: {
      image:
        'linear-gradient(115deg, rgba(255,255,255,.55), rgba(255,255,255,0) 35%, rgba(0,0,0,.2) 62%, rgba(255,255,255,.35)), repeating-linear-gradient(0deg, rgba(0,0,0,.07) 0 1px, transparent 1px 2px)',
    },
    polished: { image: 'linear-gradient(115deg, rgba(255,255,255,.9) 0 14%, rgba(255,255,255,0) 30%, rgba(0,0,0,.28) 62%, rgba(255,255,255,.6) 82%, rgba(0,0,0,.15))' },
    gloss: { image: 'linear-gradient(135deg, rgba(255,255,255,.75) 0 16%, rgba(255,255,255,0) 42%)' },
    plastic: { image: 'linear-gradient(135deg, rgba(255,255,255,.4) 0 20%, rgba(255,255,255,0) 50%)' },
    stone: {
      image:
        'radial-gradient(circle, rgba(0,0,0,.4) 0 .7px, transparent 1.2px), radial-gradient(circle, rgba(255,255,255,.55) 0 .8px, transparent 1.3px)',
      size: '5px 5px, 7px 7px',
    },
    marble: {
      image:
        'linear-gradient(115deg, transparent 38%, rgba(0,0,0,.3) 39.5%, transparent 41%), linear-gradient(62deg, transparent 56%, rgba(0,0,0,.2) 57%, transparent 59%), linear-gradient(160deg, rgba(255,255,255,.35), transparent 50%)',
    },
    concrete: {
      image:
        'radial-gradient(circle at 20% 30%, rgba(0,0,0,.14), transparent 40%), radial-gradient(circle at 75% 70%, rgba(255,255,255,.2), transparent 45%), radial-gradient(circle, rgba(0,0,0,.35) 0 .6px, transparent 1px)',
      size: '100% 100%, 100% 100%, 4px 4px',
    },
    satin: { image: 'linear-gradient(135deg, rgba(255,255,255,.28), rgba(0,0,0,.1))' },
    matte: { image: 'none' },
  };
  const { image, size } = layers[kind];
  return { backgroundColor: color, backgroundImage: image, backgroundSize: size };
}

interface FinishPickerProps {
  /** Current finish id (current or legacy). */
  value: string;
  /** Colour used to tint the previews. */
  color: string;
  onChange: (finish: FinishDef) => void;
  label: string;
}

export const FinishPicker: React.FC<FinishPickerProps> = ({ value, color, onChange, label }) => {
  const selectedId = finishById(value)?.id;
  const tint = normalizeHex(color) ?? '#94a3b8';

  return (
    <div role="radiogroup" aria-label={label} className="space-y-2">
      {FINISH_GROUPS.map((group) => (
        <div key={group.id}>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">{group.label}</span>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {FINISHES.filter((f) => f.group === group.id).map((f) => {
              // Natural materials bring their own colour, so their preview uses it; the rest use the piece's colour
              const previewColor = f.natural ? f.defaultColor : tint;
              const selected = f.id === selectedId;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  title={f.natural ? `${f.name} (aplica su color natural)` : f.name}
                  onClick={() => onChange(f)}
                  className={`flex items-center gap-1.5 p-1 rounded-lg border text-left transition-colors ${
                    selected ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-400' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span
                    aria-hidden
                    style={finishPreviewStyle(f.kind, previewColor)}
                    className="w-7 h-7 rounded-md border border-slate-300/80 shrink-0"
                  />
                  <span className="text-[11px] font-semibold text-slate-700 leading-tight">{f.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
