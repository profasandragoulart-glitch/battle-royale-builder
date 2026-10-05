import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveMatch } from "@/lib/match-store";
import type { MatchConfig, RosterEntry } from "@/game/engine";

export const Route = createFileRoute("/_authenticated/lobby")({
  head: () => ({ meta: [{ title: "Lobby — Zona Zero" }, { name: "description", content: "Encontre jogadores e inicie uma partida." }] }),
  component: Lobby,
});

const MAX = 10;
const MIN_TOTAL = 6;
type Member = { id: string; name: string; joinedAt: number };

function Lobby() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const chRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const joinedAt = useRef(Date.now());

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).single()).data,
  });

  useEffect(() => { if (profile) setName(profile.username); }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const ch = supabase.channel("zz-lobby", { config: { presence: { key: user.id } } });
    chRef.current = ch;
    ch.on("presence", { event: "sync" }, () => {
      const st = ch.presenceState<Member>();
      const list = Object.values(st).map((a) => a[0]).filter((m): m is NonNullable<typeof m> => !!m).sort((a, b) => a.joinedAt - b.joinedAt);
      setMembers(list);
    })
      .on("broadcast", { event: "start" }, ({ payload }) => {
        const m = payload as MatchConfig;
        if (m.roster.some((r) => r.id === user.id)) {
          saveMatch(m);
          navigate({ to: "/play/$matchId", params: { matchId: m.matchId } });
        }
      })
      .subscribe(async (s) => {
        if (s === "SUBSCRIBED") await ch.track({ id: user.id, name: profile.username, joinedAt: joinedAt.current });
      });
    return () => { supabase.removeChannel(ch); };
  }, [profile, user.id, navigate]);

  const squad = members.slice(0, MAX);
  const isHost = squad[0]?.id === user.id;

  async function start() {
    const roster: RosterEntry[] = squad.map((m) => ({ id: m.id, name: m.name }));
    for (let i = roster.length; i < MIN_TOTAL; i++) roster.push({ id: `bot-${i}-${Math.random().toString(36).slice(2, 6)}`, name: `Bot ${i}`, bot: true });
    const m: MatchConfig = {
      matchId: crypto.randomUUID(),
      seed: Math.floor(Math.random() * 1e9),
      startAt: Date.now() + 4000,
      hostId: user.id,
      roster,
    };
    await chRef.current?.send({ type: "broadcast", event: "start", payload: m });
    saveMatch(m);
    navigate({ to: "/play/$matchId", params: { matchId: m.matchId } });
  }

  async function saveName() {
    const n = name.trim().slice(0, 20);
    if (!n) return;
    const { error } = await supabase.from("profiles").update({ username: n }).eq("id", user.id);
    if (error) { toast.error("Não foi possível salvar"); return; }
    toast.success("Apelido salvo");
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-5xl tracking-wide">ZONA <span className="text-fire">ZERO</span></h1>
        <Button variant="ghost" onClick={signOut}>Sair</Button>
      </header>

      <div className="mt-10 grid gap-8 md:grid-cols-[1fr_320px]">
        <section className="rounded-lg border bg-card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-3xl tracking-wide">Sala de espera</h2>
            <span className="text-sm text-muted-foreground">{squad.length}/{MAX} jogadores</span>
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {squad.map((m, i) => (
              <li key={m.id} className="flex items-center gap-3 rounded-md bg-secondary px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                <span className="flex-1 font-medium">{m.name}{m.id === user.id && " (você)"}</span>
                {i === 0 && <span className="text-xs uppercase tracking-wider text-primary">Líder</span>}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {isHost ? (
              <Button variant="hero" size="lg" className="h-14 w-full" onClick={start} disabled={!squad.length}>
                Iniciar partida
              </Button>
            ) : (
              <p className="rounded-md border border-dashed p-4 text-center text-muted-foreground">
                Aguardando o líder da sala iniciar a partida…
              </p>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Vagas vazias são preenchidas com bots até {MIN_TOTAL} combatentes.
            </p>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-display text-2xl tracking-wide">Seu perfil</h3>
            <div className="mt-4 flex gap-2">
              <Input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
              <Button variant="secondary" onClick={saveName}>Salvar</Button>
            </div>
            <dl className="mt-6 grid grid-cols-3 text-center">
              {[["Vitórias", profile?.wins], ["Abates", profile?.kills], ["Partidas", profile?.matches_played]].map(([l, v]) => (
                <div key={l as string}>
                  <dd className="font-display text-4xl text-primary">{v ?? 0}</dd>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">{l}</dt>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
