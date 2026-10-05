# Battle Royale Builder

aja como um engenheiro Criar um jogo multiplayer Battle Royale completo no estilo de Free Fire dentro de uma ferramenta no-code/low-code como o Lovable exige uma arquitetura modular bem definida. O Lovable constrói aplicações web modernas utilizando React, Tailwind CSS, TypeScript, Shadcn/UI e Supabase.Arquitetura do Sistema

┌─────────────────────────────────────────────────────────────┐
│                       INTERFACE (React)                     │
│   [ Menu Principal ] ──> [ Lobby/Matchmaking ] ──> [ Canvas ]│
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    SUPABASE BACKEND                         │
│  • Auth (Login/Cadastro)     • Realtime WebSockets (Posição) │
│  • Database (Kills/Placar)   • Edge Functions (Matchmaking) │
└──────────────────────────────────────────────────

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6328c390-0a23-44d7-b8ba-078577e000ed).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
