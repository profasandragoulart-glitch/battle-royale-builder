import type { MatchConfig } from "@/game/engine";

// In-memory hand-off of the match config from lobby to the play screen.
const matches = new Map<string, MatchConfig>();
export const saveMatch = (m: MatchConfig) => matches.set(m.matchId, m);
export const getMatch = (id: string) => matches.get(id);
