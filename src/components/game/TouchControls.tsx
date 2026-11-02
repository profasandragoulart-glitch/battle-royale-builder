import { useRef, useState } from "react";
import type { Game } from "@/game/engine";

type Vec = { x: number; y: number };

function Stick({ label, onChange }: { label: string; onChange: (v: Vec | null) => void }) {
  const base = useRef<HTMLDivElement>(null);
  const id = useRef<number | null>(null);
  const [knob, setKnob] = useState<Vec>({ x: 0, y: 0 });
  const R = 56;

  const update = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);
    const l = Math.hypot(x, y);
    if (l > R) { x = (x / l) * R; y = (y / l) * R; }
    setKnob({ x, y });
    onChange({ x: x / R, y: y / R });
  };
  const end = (e: React.PointerEvent) => {
    if (e.pointerId !== id.current) return;
    id.current = null;
    setKnob({ x: 0, y: 0 });
    onChange(null);
  };

  return (
    <div
      ref={base}
      aria-label={label}
      className="relative flex h-36 w-36 touch-none items-center justify-center rounded-full border-2 border-foreground/30 bg-card/40"
      onPointerDown={(e) => { id.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); update(e); }}
      onPointerMove={(e) => { if (e.pointerId === id.current) update(e); }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        className="h-16 w-16 rounded-full bg-primary/70 shadow-glow"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
}

export function TouchControls({ game }: { game: React.RefObject<Game | null> }) {
  const t = () => { const g = game.current; if (g) g.touch.active = true; return g?.touch; };
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-6 pb-24">
      <div className="pointer-events-auto">
        <Stick label="Mover" onChange={(v) => { const s = t(); if (s) s.move = v ?? { x: 0, y: 0 }; }} />
      </div>
      <div className="pointer-events-auto flex flex-col items-end gap-4">
        <button
          type="button"
          className="touch-none rounded-full bg-card/70 px-5 py-3 font-display text-lg tracking-wide"
          onPointerDown={() => game.current?.reload()}
        >
          Recarregar
        </button>
        <Stick
          label="Mirar e atirar"
          onChange={(v) => {
            const s = t(); if (!s) return;
            const strong = v && Math.hypot(v.x, v.y) > 0.3;
            s.aim = strong ? v : s.aim;
            s.fire = !!strong;
          }}
        />
      </div>
    </div>
  );
}
