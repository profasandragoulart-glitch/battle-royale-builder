import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowDownRight, Crosshair, Flame, Shield, Sparkles, Trophy, Users, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-island.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXUS — Arena Viva | Battle Royale" },
      { name: "description", content: "Entre na NEXUS, sobreviva à arena viva e prove que você merece ser o último de pé." },
      { property: "og:title", content: "NEXUS — Arena Viva" },
      { property: "og:description", content: "A arena muda. Sua estratégia também precisa mudar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: top } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, username, kills, wins").order("wins", { ascending: false }).order("kills", { ascending: false }).limit(5);
      if (error) return [];
      return data ?? [];
    },
  });

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="NEXUS início">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary"><Zap className="h-5 w-5" /></span>
          <span className="font-display text-2xl tracking-[0.18em]">NEXUS<span className="text-primary">.</span></span>
        </Link>
        <div className="hidden items-center gap-7 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:flex">
          <a href="#protocolo" className="transition hover:text-primary">Protocolo</a>
          <a href="#ranking" className="transition hover:text-primary">Ranking</a>
          <span className="flex items-center gap-2 text-emerald-400"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Arena ativa</span>
        </div>
        <Button asChild variant="outline" className="border-primary/40 hover:bg-primary/10"><Link to="/auth">Entrar</Link></Button>
      </header>

      <section className="relative flex min-h-[76vh] items-center overflow-hidden border-y border-white/5">
        <img src={hero} alt="Território da arena NEXUS visto de cima" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/20" />
        <div className="absolute right-[12%] top-[20%] hidden h-64 w-64 rounded-full border border-primary/30 shadow-[0_0_90px_hsl(var(--primary)/0.14)] md:block" />
        <div className="absolute right-[15%] top-[24%] hidden h-52 w-52 rounded-full border border-dashed border-primary/30 md:block" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-20 md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-8">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary"><Sparkles className="h-4 w-4" /> Temporada zero · Protocolo iniciado</div>
            <p className="mb-3 font-display text-lg tracking-[0.32em] text-muted-foreground">A ARENA NÃO PERDOA</p>
            <h1 className="font-display text-7xl leading-[0.82] tracking-wide sm:text-8xl md:text-[8.5rem]">NEXUS<br /><span className="text-fire">VIVA.</span></h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">A zona fecha. O terreno muda. Rivais se aproximam. Pense rápido, equipe-se e sobreviva — cada partida escreve uma nova história.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero" size="lg" className="h-14 px-8 text-base"><Link to="/lobby"><Crosshair className="mr-2 h-5 w-5" /> Entrar na arena <ArrowDownRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" size="lg" className="h-14 border-white/15 bg-background/40 px-8"><a href="#protocolo">Conhecer o protocolo</a></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Até 10 combatentes</span>
              <span className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Arena dinâmica</span>
              <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Sobreviva até o fim</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card/80 p-5 shadow-[0_0_60px_hsl(var(--primary)/0.09)] backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Evento do sistema</p><h2 className="mt-1 font-display text-2xl tracking-wider">COLAPSO IONIZADO</h2></div>
                <span className="rounded-md border border-red-400/30 bg-red-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-300">Ameaça</span>
              </div>
              <div className="relative my-5 flex aspect-[1.25/1] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.13),transparent_65%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))]">
                <div className="absolute h-[82%] aspect-square rounded-full border border-sky-400/60 shadow-[0_0_35px_hsl(200_90%_60%/0.15)]" />
                <div className="absolute h-[60%] aspect-square rounded-full border border-dashed border-sky-300/60" />
                <div className="absolute h-[36%] aspect-square rounded-full border-2 border-primary shadow-[0_0_30px_hsl(var(--primary)/0.28)]" />
                <div className="absolute h-2 w-2 rounded-full bg-primary shadow-[0_0_15px_hsl(var(--primary))]" />
                <span className="absolute left-[18%] top-[24%] h-2 w-2 rounded-full bg-red-400 shadow-[0_0_12px_#f87171]" />
                <span className="absolute right-[24%] top-[35%] h-2 w-2 rounded-full bg-red-400 shadow-[0_0_12px_#f87171]" />
                <span className="absolute bottom-[23%] right-[33%] h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_#6ee7b7]" />
                <span className="absolute bottom-3 left-3 font-mono text-[10px] tracking-widest text-muted-foreground">NEXUS GRID // 04</span>
                <span className="absolute right-3 top-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> Ao vivo</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/70 p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Jogadores</p><p className="mt-1 font-display text-2xl">10 MAX</p></div>
                <div className="rounded-lg bg-muted/70 p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Zona</p><p className="mt-1 font-display text-2xl text-sky-300">FECHANDO</p></div>
                <div className="rounded-lg bg-muted/70 p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Objetivo</p><p className="mt-1 font-display text-2xl text-primary">#1</p></div>
              </div>
            </div>
            <p className="mt-4 text-center text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Nenhuma partida é igual à anterior</p>
          </div>
        </div>
      </section>

      <section id="protocolo" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-10 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Protocolo de sobrevivência</p><h2 className="mt-3 font-display text-4xl tracking-wide sm:text-5xl">SUA PRÓXIMA DECISÃO<br />MUDA TUDO.</h2><p className="mt-4 text-muted-foreground">Entre para competir. Aprenda o mapa. Domine o caos. A NEXUS começa com uma regra: sobreviva para evoluir.</p></div>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="group rounded-xl border border-white/10 bg-card p-6 transition hover:border-primary/50"><span className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Activity className="h-6 w-6" /></span><p className="text-xs font-bold tracking-[0.2em] text-primary">01 / ADAPTE-SE</p><h3 className="mt-2 font-display text-2xl">ARENA VIVA</h3><p className="mt-3 leading-relaxed text-muted-foreground">Zona segura em movimento, terreno imprevisível e decisões rápidas para nunca deixar a partida no piloto automático.</p></article>
          <article className="group rounded-xl border border-white/10 bg-card p-6 transition hover:border-primary/50"><span className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Crosshair className="h-6 w-6" /></span><p className="text-xs font-bold tracking-[0.2em] text-primary">02 / SUPERE</p><h3 className="mt-2 font-display text-2xl">COMBATE TÁTICO</h3><p className="mt-3 leading-relaxed text-muted-foreground">Controle seu movimento, mire com precisão, gerencie munição e escolha o momento certo para avançar ou recuar.</p></article>
          <article className="group rounded-xl border border-white/10 bg-card p-6 transition hover:border-primary/50"><span className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Flame className="h-6 w-6" /></span><p className="text-xs font-bold tracking-[0.2em] text-primary">03 / CONQUISTE</p><h3 className="mt-2 font-display text-2xl">SEU LEGADO</h3><p className="mt-3 leading-relaxed text-muted-foreground">Registre vitórias e eliminações, suba no ranking e construa sua reputação partida após partida.</p></article>
        </div>
      </section>

      <section id="ranking" className="border-y border-white/5 bg-card/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[0.8fr_1.2fr] md:px-8">
          <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Hall dos sobreviventes</p><h2 className="mt-3 font-display text-4xl tracking-wide">LENDAS DA<br />ARENA.</h2><p className="mt-4 text-muted-foreground">O topo não é dado. É conquistado.</p><Button asChild variant="outline" className="mt-6 border-primary/40"><Link to="/lobby"><Trophy className="mr-2 h-4 w-4" /> Disputar posição</Link></Button></div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-card">
            <div className="grid grid-cols-[52px_1fr_90px_90px] gap-2 border-b border-white/10 bg-muted/50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground"><span>#</span><span>Combatente</span><span className="text-right">Vitórias</span><span className="text-right">Abates</span></div>
            {(top ?? []).map((p, i) => <div key={p.id} className="grid grid-cols-[52px_1fr_90px_90px] items-center gap-2 border-b border-white/5 px-4 py-4 last:border-0"><span className={`font-display text-2xl ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{String(i + 1).padStart(2, "0")}</span><span className="truncate font-semibold">{p.username || "Combatente"}</span><span className="text-right font-mono">{p.wins ?? 0}</span><span className="text-right font-mono text-muted-foreground">{p.kills ?? 0}</span></div>)}
            {top && top.length === 0 && <div className="px-5 py-10 text-center text-sm text-muted-foreground">O ranking está aberto. Seja a primeira lenda da NEXUS.</div>}
            {!top && <div className="px-5 py-10 text-center text-sm text-muted-foreground">Carregando ranking…</div>}
          </div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs text-muted-foreground md:flex-row md:px-8"><span className="font-display text-lg tracking-[0.2em]">NEXUS<span className="text-primary">.</span></span><span>ARENA VIVA · TEMPORADA ZERO</span><span>Jogue com estratégia. Respeite seus rivais.</span></footer>
    </main>
  );
}
