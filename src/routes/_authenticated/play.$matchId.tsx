import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Game, type Hud } from "@/game/engine";
import { getMatch } from "@/lib/match-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/play/$matchId")({
  head: () => ({ meta: [{ title: "Partida — Zona Zero" }, { name: "description", content: "Partida em andamento." }] }),
  component: Play,
});

function Play() {
  const { matchId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [result, setResult] = useState<{ kills: number; won: boolean; placement: number } | null>(null);

  useEffect(() => {
    const cfg = getMatch(matchId);
    if (!cfg) { navigate({ to: "/lobby" }); return; }
    const ch = supabase.channel(`zz-match-${matchId}`, { config: { broadcast: { self: false } } });
    let game: Game | null = null;
    const send = (event: string, payload: Record<string, unknown>) => {
      ch.send({ type: "broadcast", event, payload });
    };
    ["state", "shot", "dmg"].forEach((ev) => ch.on("broadcast", { event: ev }, ({ payload }) => game?.receive(ev, payload)));
    ch.subscribe();
    game = new Game(canvasRef.current!, cfg, user.id, send, setHud, async (r) => {
      setResult(r);
      await supabase.rpc("record_match", { _kills: r.kills, _won: r.won });
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    });
    return () => { game?.destroy(); supabase.removeChannel(ch); };
  }, [matchId, user.id, navigate, qc]);

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-background">
      <canvas ref={canvasRef} className="h-full w-full cursor-none" onContextMenu={(e) => e.preventDefault()} />

      {hud && (
        <>
          <div className="pointer-events-none absolute left-4 top-4 space-y-2">
            <div className="rounded-md bg-card/80 px-4 py-2 font-display text-2xl tracking-wide">
              Vivos <span className="text-primary">{hud.alive}</span> · Abates <span className="text-primary">{hud.kills}</span>
            </div>
            <div className={`rounded-md px-4 py-2 text-sm font-semibold ${hud.outside ? "bg-destructive text-destructive-foreground" : "bg-card/80"}`}>
              {hud.outside ? "Fora da zona! " : ""}{hud.zoneText}
            </div>
            <ul className="space-y-1 text-sm">
              {hud.feed.map((f, i) => <li key={i} className="rounded bg-card/60 px-3 py-1">{f}</li>)}
            </ul>
          </div>

          <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-end gap-6">
            <div className="w-72">
              <div className="mb-1 flex justify-between font-display text-lg tracking-wide"><span>Vida</span><span>{hud.hp}</span></div>
              <div className="h-3 overflow-hidden rounded bg-card/80">
                <div className="h-full bg-fire transition-all" style={{ width: `${hud.hp}%` }} />
              </div>
            </div>
            <div className="rounded-md bg-card/80 px-4 py-2 font-display text-3xl tracking-wide">
              {hud.reloading ? <span className="text-muted-foreground">Recarregando</span> : <>{hud.ammo}<span className="text-lg text-muted-foreground">/30</span></>}
            </div>
          </div>

          {hud.countdown > 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display text-2xl tracking-[0.3em] text-muted-foreground">Partida começa em</p>
              <p className="font-display text-9xl text-fire">{hud.countdown}</p>
            </div>
          )}
        </>
      )}

      {result && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <p className="font-display text-2xl tracking-[0.3em] text-muted-foreground">{result.won ? "Último sobrevivente" : "Você foi eliminado"}</p>
            <h2 className="font-display text-8xl text-fire">{result.won ? "BOOYAH!" : `#${result.placement}`}</h2>
            <p className="mt-2 text-lg">{result.kills} abates</p>
            <Button asChild variant="hero" size="lg" className="mt-8 h-14 px-10"><Link to="/lobby">Voltar ao lobby</Link></Button>
          </div>
        </div>
      )}
    </div>
  );
}
