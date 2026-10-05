// Battle royale engine: client-authoritative movement, victim-authoritative hits.
// Each client simulates its own player (and the host also simulates bots),
// broadcasts state at ~10Hz, and decides damage for entities it controls.

export type RosterEntry = { id: string; name: string; bot?: boolean };
export type MatchConfig = {
  matchId: string;
  seed: number;
  startAt: number;
  hostId: string;
  roster: RosterEntry[];
};

export type Hud = {
  hp: number;
  ammo: number;
  reloading: boolean;
  alive: number;
  kills: number;
  countdown: number;
  zoneText: string;
  outside: boolean;
  feed: string[];
  dead: boolean;
  placement: number;
  won: boolean;
  over: boolean;
};

type Player = {
  id: string;
  name: string;
  bot: boolean;
  x: number;
  y: number;
  a: number;
  tx: number;
  ty: number;
  ta: number;
  hp: number;
  alive: boolean;
  local: boolean;
  lastSeen: number;
  // bot / local weapon
  cooldown: number;
  ammo: number;
  reload: number;
  zoneAcc: number;
  botTarget?: { x: number; y: number };
  botThink: number;
};

type Bullet = { x: number; y: number; vx: number; vy: number; owner: string; life: number };
type Rect = { kind: "rect"; x: number; y: number; w: number; h: number };
type Circ = { kind: "circ"; x: number; y: number; r: number };
type Obstacle = Rect | Circ;

export const MAP = 2400;
const PR = 18;
const SPEED = 230;
const BULLET_SPEED = 950;
const DAMAGE = 20;
const MAG = 30;
const FIRE_CD = 0.14;
const RELOAD = 1.6;
const ZONE_DPS = 8;

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Zone schedule (seconds since start): [time, radius]
const ZONE: [number, number][] = [
  [0, 1800],
  [25, 1800],
  [55, 900],
  [70, 900],
  [100, 420],
  [110, 420],
  [140, 60],
];

function zoneRadius(t: number) {
  if (t <= 0) return ZONE[0]![1];
  for (let i = 1; i < ZONE.length; i++) {
    const [t1, r1] = ZONE[i]!;
    const [t0, r0] = ZONE[i - 1]!;
    if (t <= t1) return r0 + ((r1 - r0) * (t - t0)) / (t1 - t0);
  }
  return ZONE[ZONE.length - 1]![1];
}
function zoneText(t: number) {
  for (let i = 1; i < ZONE.length; i++) {
    const [t1, r1] = ZONE[i]!;
    const r0 = ZONE[i - 1]![1];
    if (t < t1) {
      const s = Math.ceil(t1 - t);
      return r1 < r0 ? `Zona fechando · ${s}s` : `Zona fecha em ${s}s`;
    }
  }
  return "Zona final";
}

function cssVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function readColors() {
  return {
      grass: cssVar("--game-grass", "#2d4a2b"),
      grid: cssVar("--game-grid", "#355534"),
      crate: cssVar("--game-crate", "#8a5a2b"),
      crateEdge: cssVar("--game-crate-edge", "#5a3a1b"),
      tree: cssVar("--game-tree", "#1d3a1f"),
      me: cssVar("--game-me", "#ff9a1f"),
      enemy: cssVar("--game-enemy", "#e5484d"),
      bot: cssVar("--game-bot", "#9aa3ad"),
      bullet: cssVar("--game-bullet", "#ffe08a"),
      zone: cssVar("--game-zone", "rgba(40,120,255,0.35)"),
      zoneEdge: cssVar("--game-zone-edge", "#4aa3ff"),
      text: cssVar("--game-text", "#ffffff"),
      hpBg: cssVar("--game-hp-bg", "#222"),
      hp: cssVar("--game-hp", "#4ade80"),
    };
}

export class Game {
  private ctx: CanvasRenderingContext2D;
  private players = new Map<string, Player>();
  private bullets: Bullet[] = [];
  private obstacles: Obstacle[] = [];
  private zc: { x: number; y: number };
  private keys = new Set<string>();
  private mouse = { x: 0, y: 0, down: false };
  private raf = 0;
  private last = 0;
  private sendAcc = 0;
  private hudAcc = 0;
  private kills = 0;
  private feed: string[] = [];
  private ended = false;
  private placement = 0;
  private won = false;
  private colors!: ReturnType<typeof readColors>;
  private isHost: boolean;
  private cleanup: (() => void)[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private cfg: MatchConfig,
    private meId: string,
    private send: (event: string, payload: Record<string, unknown>) => void,
    private onHud: (h: Hud) => void,
    private onEnd: (r: { kills: number; won: boolean; placement: number }) => void,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.isHost = cfg.hostId === meId;
    const rng = mulberry32(cfg.seed);
    for (let i = 0; i < 38; i++) {
      const w = 60 + rng() * 160;
      const h = 60 + rng() * 160;
      this.obstacles.push({ kind: "rect", x: 100 + rng() * (MAP - 300), y: 100 + rng() * (MAP - 300), w, h });
    }
    for (let i = 0; i < 70; i++) {
      this.obstacles.push({ kind: "circ", x: 60 + rng() * (MAP - 120), y: 60 + rng() * (MAP - 120), r: 22 + rng() * 26 });
    }
    this.zc = { x: MAP / 2 + (rng() - 0.5) * 700, y: MAP / 2 + (rng() - 0.5) * 700 };

    const n = cfg.roster.length;
    cfg.roster.forEach((r, i) => {
      const ang = (i / n) * Math.PI * 2 + rng();
      let x = MAP / 2 + Math.cos(ang) * MAP * 0.38;
      let y = MAP / 2 + Math.sin(ang) * MAP * 0.38;
      const p: Player = {
        id: r.id, name: r.name, bot: !!r.bot, x, y, a: 0, tx: x, ty: y, ta: 0,
        hp: 100, alive: true, local: r.id === meId || (!!r.bot && this.isHost),
        lastSeen: Date.now(), cooldown: 0, ammo: MAG, reload: 0, zoneAcc: 0, botThink: 0,
      };
      this.resolve(p);
      x = p.x; y = p.y;
      p.tx = x; p.ty = y;
      this.players.set(r.id, p);
    });

    this.colors = readColors();

    this.bindInput();
    this.resize();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.cleanup.forEach((f) => f());
  }

  private get me() {
    return this.players.get(this.meId);
  }

  private bindInput() {
    const kd = (e: KeyboardEvent) => {
      this.keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "r") this.startReload(this.me);
    };
    const ku = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
    const mm = (e: MouseEvent) => {
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
    };
    const md = (e: MouseEvent) => { if (e.button === 0) this.mouse.down = true; };
    const mu = () => { this.mouse.down = false; };
    const rs = () => this.resize();
    const blur = () => { this.keys.clear(); this.mouse.down = false; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    this.canvas.addEventListener("mousemove", mm);
    this.canvas.addEventListener("mousedown", md);
    window.addEventListener("mouseup", mu);
    window.addEventListener("resize", rs);
    window.addEventListener("blur", blur);
    this.cleanup.push(() => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      this.canvas.removeEventListener("mousemove", mm);
      this.canvas.removeEventListener("mousedown", md);
      window.removeEventListener("mouseup", mu);
      window.removeEventListener("resize", rs);
      window.removeEventListener("blur", blur);
    });
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = this.canvas.getBoundingClientRect();
    this.canvas.width = r.width * dpr;
    this.canvas.height = r.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------- networking ----------
  receive(event: string, payload: any) {
    if (event === "state") {
      for (const s of payload.list as any[]) {
        const p = this.players.get(s.id);
        if (!p || p.local) continue;
        p.tx = s.x; p.ty = s.y; p.ta = s.a;
        p.lastSeen = Date.now();
      }
    } else if (event === "shot") {
      if (payload.owner === this.meId) return;
      this.bullets.push({ x: payload.x, y: payload.y, vx: Math.cos(payload.a) * BULLET_SPEED, vy: Math.sin(payload.a) * BULLET_SPEED, owner: payload.owner, life: 0.9 });
    } else if (event === "dmg") {
      this.applyDmg(payload.victim, payload.killer, payload.hp, payload.dead);
    }
  }

  private applyDmg(victim: string, killer: string | null, hp: number, dead: boolean) {
    const v = this.players.get(victim);
    if (!v || !v.alive) return;
    v.hp = hp;
    if (dead) {
      v.alive = false;
      const k = killer ? this.players.get(killer) : null;
      this.feed.unshift(k ? `${k.name} eliminou ${v.name}` : `${v.name} caiu na zona`);
      this.feed = this.feed.slice(0, 5);
      if (killer === this.meId) this.kills++;
      if (victim === this.meId) this.placement = this.aliveCount() + 1;
    }
  }

  private hit(victim: Player, killer: string | null, amount: number) {
    if (!victim.alive) return;
    const hp = Math.max(0, victim.hp - amount);
    const dead = hp <= 0;
    this.send("dmg", { victim: victim.id, killer, hp, dead });
    this.applyDmg(victim.id, killer, hp, dead);
  }

  private aliveCount() {
    let n = 0;
    this.players.forEach((p) => { if (p.alive) n++; });
    return n;
  }

  // ---------- physics ----------
  private resolve(p: { x: number; y: number }) {
    for (const o of this.obstacles) {
      if (o.kind === "rect") {
        const cx = Math.max(o.x, Math.min(p.x, o.x + o.w));
        const cy = Math.max(o.y, Math.min(p.y, o.y + o.h));
        const dx = p.x - cx, dy = p.y - cy;
        const d = Math.hypot(dx, dy);
        if (d < PR) {
          if (d === 0) { p.y = o.y - PR; continue; }
          p.x = cx + (dx / d) * PR;
          p.y = cy + (dy / d) * PR;
        }
      } else {
        const dx = p.x - o.x, dy = p.y - o.y;
        const d = Math.hypot(dx, dy);
        if (d < o.r + PR && d > 0) {
          p.x = o.x + (dx / d) * (o.r + PR);
          p.y = o.y + (dy / d) * (o.r + PR);
        }
      }
    }
    p.x = Math.max(PR, Math.min(MAP - PR, p.x));
    p.y = Math.max(PR, Math.min(MAP - PR, p.y));
  }

  private blocked(x: number, y: number) {
    for (const o of this.obstacles) {
      if (o.kind === "rect") { if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return true; }
      else if (Math.hypot(x - o.x, y - o.y) < o.r) return true;
    }
    return false;
  }

  private los(a: Player, b: Player) {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.ceil(d / 20);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (this.blocked(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false;
    }
    return true;
  }

  private startReload(p?: Player) {
    if (!p || !p.alive || p.reload > 0 || p.ammo === MAG) return;
    p.reload = RELOAD;
  }

  private fire(p: Player, spread = 0.03) {
    if (p.cooldown > 0 || p.reload > 0 || !p.alive) return;
    if (p.ammo <= 0) { this.startReload(p); return; }
    p.cooldown = FIRE_CD;
    p.ammo--;
    const a = p.a + (Math.random() - 0.5) * spread;
    const x = p.x + Math.cos(a) * (PR + 6);
    const y = p.y + Math.sin(a) * (PR + 6);
    this.bullets.push({ x, y, vx: Math.cos(a) * BULLET_SPEED, vy: Math.sin(a) * BULLET_SPEED, owner: p.id, life: 0.9 });
    this.send("shot", { owner: p.id, x, y, a });
    if (p.ammo === 0) this.startReload(p);
  }

  private tickWeapon(p: Player, dt: number) {
    p.cooldown = Math.max(0, p.cooldown - dt);
    if (p.reload > 0) {
      p.reload -= dt;
      if (p.reload <= 0) { p.reload = 0; p.ammo = MAG; }
    }
  }

  private tickBot(b: Player, dt: number, R: number) {
    let target: Player | null = null;
    let best = 520;
    this.players.forEach((o) => {
      if (o === b || !o.alive) return;
      const d = Math.hypot(o.x - b.x, o.y - b.y);
      if (d < best && this.los(b, o)) { best = d; target = o; }
    });
    b.botThink -= dt;
    const distC = Math.hypot(b.x - this.zc.x, b.y - this.zc.y);
    if (!b.botTarget || b.botThink <= 0 || Math.hypot(b.botTarget.x - b.x, b.botTarget.y - b.y) < 30) {
      b.botThink = 2 + Math.random() * 2;
      const rr = Math.min(R * 0.7, 600) * Math.random();
      const ang = Math.random() * Math.PI * 2;
      b.botTarget = distC > R * 0.8
        ? { x: this.zc.x + Math.cos(ang) * rr, y: this.zc.y + Math.sin(ang) * rr }
        : { x: b.x + Math.cos(ang) * 300, y: b.y + Math.sin(ang) * 300 };
    }
    let mx = b.botTarget.x - b.x, my = b.botTarget.y - b.y;
    const t = target as Player | null;
    if (t) {
      b.a = Math.atan2(t.y - b.y, t.x - b.x);
      if (best < 250) { mx = -Math.sin(b.a); my = Math.cos(b.a); } // strafe
      if (Math.random() < 0.5) this.fire(b, 0.22);
    } else {
      b.a = Math.atan2(my, mx);
    }
    const l = Math.hypot(mx, my) || 1;
    b.x += (mx / l) * SPEED * 0.8 * dt;
    b.y += (my / l) * SPEED * 0.8 * dt;
    this.resolve(b);
  }

  // ---------- main loop ----------
  private loop = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };

  private camera() {
    const me = this.me;
    const r = this.canvas.getBoundingClientRect();
    return { x: (me?.x ?? MAP / 2) - r.width / 2, y: (me?.y ?? MAP / 2) - r.height / 2, w: r.width, h: r.height };
  }

  private update(dt: number) {
    const t = (Date.now() - this.cfg.startAt) / 1000;
    const started = t >= 0;
    const R = zoneRadius(t);
    const me = this.me;
    const cam = this.camera();

    // local player
    if (me && me.alive && started) {
      let mx = 0, my = 0;
      if (this.keys.has("w") || this.keys.has("arrowup")) my -= 1;
      if (this.keys.has("s") || this.keys.has("arrowdown")) my += 1;
      if (this.keys.has("a") || this.keys.has("arrowleft")) mx -= 1;
      if (this.keys.has("d") || this.keys.has("arrowright")) mx += 1;
      const l = Math.hypot(mx, my);
      if (l) { me.x += (mx / l) * SPEED * dt; me.y += (my / l) * SPEED * dt; }
      this.resolve(me);
      me.a = Math.atan2(this.mouse.y + cam.y - me.y, this.mouse.x + cam.x - me.x);
      if (this.mouse.down) this.fire(me);
    }

    this.players.forEach((p) => {
      if (p.local) {
        this.tickWeapon(p, dt);
        if (p.bot && p.alive && started) this.tickBot(p, dt, R);
        // zone damage
        if (p.alive && started && Math.hypot(p.x - this.zc.x, p.y - this.zc.y) > R) {
          p.zoneAcc += ZONE_DPS * dt;
          if (p.zoneAcc >= 4) { this.hit(p, null, Math.floor(p.zoneAcc)); p.zoneAcc = 0; }
        }
      } else {
        const k = Math.min(1, dt * 12);
        p.x += (p.tx - p.x) * k;
        p.y += (p.ty - p.y) * k;
        let da = p.ta - p.a;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        p.a += da * k;
        // treat silent humans as disconnected
        if (!p.bot && p.alive && started && Date.now() - p.lastSeen > 8000) {
          p.alive = false;
          this.feed.unshift(`${p.name} desconectou`);
        }
      }
    });

    // bullets
    for (const b of this.bullets) {
      const steps = 3;
      for (let s = 0; s < steps && b.life > 0; s++) {
        b.x += (b.vx * dt) / steps;
        b.y += (b.vy * dt) / steps;
        if (this.blocked(b.x, b.y) || b.x < 0 || b.y < 0 || b.x > MAP || b.y > MAP) { b.life = 0; break; }
        for (const p of this.players.values()) {
          if (!p.alive || p.id === b.owner) continue;
          if (Math.hypot(p.x - b.x, p.y - b.y) < PR) {
            b.life = 0;
            if (p.local) this.hit(p, b.owner, DAMAGE);
            break;
          }
        }
      }
      b.life -= dt;
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);

    // network send
    this.sendAcc += dt;
    if (this.sendAcc >= 0.1) {
      this.sendAcc = 0;
      const list: any[] = [];
      this.players.forEach((p) => {
        if (p.local && p.alive) list.push({ id: p.id, x: Math.round(p.x), y: Math.round(p.y), a: +p.a.toFixed(2) });
      });
      if (list.length) this.send("state", { list });
    }

    // end conditions
    const alive = this.aliveCount();
    if (!this.ended && me) {
      if (!me.alive) {
        this.ended = true;
        this.onEnd({ kills: this.kills, won: false, placement: this.placement || alive + 1 });
      } else if (started && alive <= 1 && this.players.size > 1) {
        this.ended = true;
        this.won = true;
        this.placement = 1;
        this.onEnd({ kills: this.kills, won: true, placement: 1 });
      }
    }

    this.hudAcc += dt;
    if (this.hudAcc >= 0.1 && me) {
      this.hudAcc = 0;
      this.onHud({
        hp: Math.ceil(me.hp), ammo: me.ammo, reloading: me.reload > 0, alive, kills: this.kills,
        countdown: started ? 0 : Math.ceil(-t), zoneText: started ? zoneText(t) : "Prepare-se",
        outside: started && Math.hypot(me.x - this.zc.x, me.y - this.zc.y) > R,
        feed: this.feed, dead: !me.alive, placement: this.placement, won: this.won, over: this.ended,
      });
    }
  }

  private draw() {
    const c = this.ctx;
    const cam = this.camera();
    const C = this.colors;
    const t = (Date.now() - this.cfg.startAt) / 1000;
    const R = zoneRadius(t);

    c.fillStyle = C.tree;
    c.fillRect(0, 0, cam.w, cam.h);
    c.save();
    c.translate(-cam.x, -cam.y);

    c.fillStyle = C.grass;
    c.fillRect(0, 0, MAP, MAP);
    c.strokeStyle = C.grid;
    c.lineWidth = 1;
    c.beginPath();
    for (let g = 0; g <= MAP; g += 100) { c.moveTo(g, 0); c.lineTo(g, MAP); c.moveTo(0, g); c.lineTo(MAP, g); }
    c.stroke();

    for (const o of this.obstacles) {
      if (o.kind === "rect") {
        c.fillStyle = C.crate;
        c.fillRect(o.x, o.y, o.w, o.h);
        c.strokeStyle = C.crateEdge;
        c.lineWidth = 4;
        c.strokeRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4);
      }
    }

    c.fillStyle = C.bullet;
    for (const b of this.bullets) { c.beginPath(); c.arc(b.x, b.y, 3, 0, Math.PI * 2); c.fill(); }

    this.players.forEach((p) => {
      if (!p.alive) return;
      const col = p.id === this.meId ? C.me : p.bot ? C.bot : C.enemy;
      c.strokeStyle = C.hpBg;
      c.lineWidth = 8;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + Math.cos(p.a) * (PR + 14), p.y + Math.sin(p.a) * (PR + 14));
      c.stroke();
      c.fillStyle = col;
      c.beginPath(); c.arc(p.x, p.y, PR, 0, Math.PI * 2); c.fill();
      c.strokeStyle = C.hpBg; c.lineWidth = 3; c.stroke();
      c.fillStyle = C.hpBg; c.fillRect(p.x - 22, p.y - PR - 14, 44, 5);
      c.fillStyle = C.hp; c.fillRect(p.x - 22, p.y - PR - 14, 44 * (p.hp / 100), 5);
      c.fillStyle = C.text;
      c.font = "600 12px Barlow, sans-serif";
      c.textAlign = "center";
      c.fillText(p.name, p.x, p.y - PR - 20);
    });

    // trees on top (cover)
    c.fillStyle = C.tree;
    for (const o of this.obstacles) {
      if (o.kind === "circ") { c.globalAlpha = 0.92; c.beginPath(); c.arc(o.x, o.y, o.r, 0, Math.PI * 2); c.fill(); }
    }
    c.globalAlpha = 1;

    // zone overlay
    c.fillStyle = C.zone;
    c.beginPath();
    c.rect(-2000, -2000, MAP + 4000, MAP + 4000);
    c.arc(this.zc.x, this.zc.y, R, 0, Math.PI * 2, true);
    c.fill("evenodd");
    c.strokeStyle = C.zoneEdge; c.lineWidth = 4;
    c.beginPath(); c.arc(this.zc.x, this.zc.y, R, 0, Math.PI * 2); c.stroke();
    c.restore();

    // crosshair
    c.strokeStyle = C.me; c.lineWidth = 2;
    c.beginPath(); c.arc(this.mouse.x, this.mouse.y, 10, 0, Math.PI * 2);
    c.moveTo(this.mouse.x - 16, this.mouse.y); c.lineTo(this.mouse.x - 6, this.mouse.y);
    c.moveTo(this.mouse.x + 6, this.mouse.y); c.lineTo(this.mouse.x + 16, this.mouse.y);
    c.stroke();

    // minimap
    const S = 160, pad = 16, k = S / MAP;
    const mx0 = cam.w - S - pad, my0 = pad;
    c.globalAlpha = 0.85;
    c.fillStyle = C.grass; c.fillRect(mx0, my0, S, S);
    c.globalAlpha = 1;
    c.strokeStyle = C.zoneEdge; c.lineWidth = 2;
    c.beginPath(); c.arc(mx0 + this.zc.x * k, my0 + this.zc.y * k, R * k, 0, Math.PI * 2); c.stroke();
    const me = this.me;
    if (me) { c.fillStyle = C.me; c.beginPath(); c.arc(mx0 + me.x * k, my0 + me.y * k, 4, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = C.text; c.lineWidth = 1; c.strokeRect(mx0, my0, S, S);
  }
}
