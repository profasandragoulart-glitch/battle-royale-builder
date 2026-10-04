import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-island.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zona Zero — Battle Royale multiplayer no navegador" },
      { name: "description", content: "Caia na ilha, enfrente até 10 jogadores e sobreviva à zona. Battle royale 2D gratuito, direto no navegador." },
      { property: "og:title", content: "Zona Zero — Battle Royale no navegador" },
      { property: "og:description", content: "Até 10 jogadores, uma zona que encolhe, um sobrevivente." },
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
      const { data } = await supabase.from("profiles").select("id, username, kills, wins").order("wins", { ascending: false }).order("kills", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  return (
    <main>
      <section className="relative min-h-[88vh] flex items-end overflow-hidden">
        <img src={hero} alt="Ilha vista de cima com a zona segura" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20">
          <p className="font-display text-xl tracking-[0.3em] text-primary">Battle Royale · 2D · Multiplayer</p>
          <h1 className="font-display text-7xl md:text-9xl leading-none tracking-wide">
            ZONA <span className="text-fire">ZERO</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            Até 10 jogadores. Uma zona que encolhe. Só um sai vivo.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild variant="hero" size="lg" className="h-14 px-10"><Link to="/lobby">Jogar agora</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl tracking-wide">Como jogar</h2>
          <ul className="mt-6 space-y-3 text-muted-foreground">
            <li><span className="font-semibold text-foreground">WASD</span> — mover</li>
            <li><span className="font-semibold text-foreground">Mouse</span> — mirar e atirar</li>
            <li><span className="font-semibold text-foreground">R</span> — recarregar</li>
            <li>Fique dentro do círculo azul. Fora dele você perde vida.</li>
            <li>Salas com poucos jogadores são completadas com bots.</li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-4xl tracking-wide">Ranking</h2>
          <ol className="mt-6 divide-y rounded-lg border bg-card">
            {(top ?? []).map((p, i) => (
              <li key={p.id} className="flex items-center gap-4 px-4 py-3">
                <span className="font-display text-2xl w-6 text-primary">{i + 1}</span>
                <span className="flex-1 font-medium">{p.username}</span>
                <span className="text-sm text-muted-foreground">{p.wins} vitórias · {p.kills} abates</span>
              </li>
            ))}
            {top && top.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground">Seja o primeiro no ranking.</li>}
          </ol>
        </div>
      </section>
    </main>
  );
}
