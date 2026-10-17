// Deterministic simulation. No DOM, audio, rendering or wall-clock dependencies.
export const STEP = 1 / 120;
export const BOSS_TIME = 480;
export const BOSSES = [
  { kind: 'sentinel', name: 'SENTINEL', at: 75, hp: 1800, r: 44,
    intro: 'En bepansrad jägare. Undvik skottsvärmen och lämna den markerade rusningsbanan.' },
  { kind: 'hive', name: 'HIVE MOTHER', at: 240, hp: 4200, r: 54,
    intro: 'Svärmens moder. Lämna minfälten och håll undan från hennes småskepp.' },
  { kind: 'voidkeeper', name: 'VOIDKEEPER', at: BOSS_TIME, hp: 14500, r: 62,
    intro: 'Riftens väktare. Hitta öppningen i ringarna och lämna markerade områden.' }
];
export const LIMITS = { enemies: 72, bullets: 180, shots: 200, gems: 100, hazards: 20 };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const length = (x, y) => Math.hypot(x, y);
export function segmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
export const TYPES = {
  hunter: { name: 'SPJUT', hp: 32, r: 13, speed: 82, value: 1 },
  sniper: { name: 'PRICKSKYTT', hp: 62, r: 18, speed: 63, value: 2 },
  rammer: { name: 'MURBRÄCKA', hp: 150, r: 25, speed: 38, value: 3 },
  splitter: { name: 'TVILLING', hp: 94, r: 22, speed: 53, value: 3 },
  warden: { name: 'MINLÄGGARE', hp: 110, r: 24, speed: 38, value: 3 },
  shard: { name: 'SPLITTER', hp: 18, r: 8, speed: 115, value: 0 },
  boss: { name: 'VOIDKEEPER', hp: 14500, r: 62, speed: 26, value: 0 }
};
export const UPGRADES = [
  { id: 'rapid', icon: '≋', name: 'Pulskanon', max: 4, family: 'ELDGIVNING', desc: n => `Skottintervall ${(0.44 * .83 ** n).toFixed(2)} → ${(0.44 * .83 ** (n + 1)).toFixed(2)} s. Samma skada per skott.` },
  { id: 'power', icon: '✦', name: 'Tung jon', max: 4, family: 'ELDGIVNING', desc: n => `Projektilskada ${24 + n * 8} → ${32 + n * 8}. Förstärker även kedjeblixtar.` },
  { id: 'split', icon: '⋔', name: 'Vingkanoner', max: 2, family: 'ELDGIVNING', desc: n => `${n ? '3 → 5' : '1 → 3'} skott per salva. Sidoskott gör 55 % skada.` },
  { id: 'chain', icon: 'ϟ', name: 'Kedjeblixt', max: 3, family: 'ÅSKA', desc: n => `Var tredje träff leder blixt till ${n + 1} extra mål inom 155 m. 65 % av projektilskadan per mål.` },
  { id: 'drone', icon: '◈', name: 'Omloppsdrönare', max: 3, family: 'ORBIT', desc: n => `${n} → ${n + 1} drönare. Varje drönare gör 26 kontaktskada var 0,5 s per fiende.` },
  { id: 'orbit', icon: '◎', name: 'Yttre omloppsbana', max: 2, family: 'ORBIT', requires: g => g.ranks.drone > 0, desc: n => `Drönarradie ${65 + n * 22} → ${87 + n * 22} m. Drönarskada ${26 + n * 10} → ${36 + n * 10}.` },
  { id: 'dash', icon: '↗', name: 'Riftmotor', max: 3, family: 'DASH', desc: n => `Dashens laddtid ${(3 - n * .45).toFixed(2)} → ${(2.55 - n * .45).toFixed(2)} s. Dash gör ${55 + n * 30} skada per passerad fiende.` },
  { id: 'nova', icon: '⊛', name: 'Efterstöt', max: 2, family: 'DASH', requires: g => g.ranks.dash > 0, desc: n => `Vid dashens slut: ${45 + n * 35} skada inom ${100 + n * 30} m. Rensar fientliga skott i området.` },
  { id: 'shield', icon: '⊕', name: 'Sköldkärna', max: 4, family: 'ÖVERLEVNAD', desc: () => '+20 maxsköld och återställ 35 sköld direkt.' },
  { id: 'magnet', icon: '⌖', name: 'Bärgningsfält', max: 3, family: 'ÖVERLEVNAD', desc: n => `Energiradie ${100 + n * 55} → ${155 + n * 55} m. Flyghastighet +5 % av grundvärdet.` }
];
const INTRO = [
  [0, '01 / FÖRSTA KONTAKT', 'Spjut följer dig. Håll avstånd och samla diamantformad energi.'],
  [60, '02 / KALL SIKTLINJE', 'Prickskyttar siktar med en streckad linje. Byt riktning när linjen låses.'],
  [140, '03 / BRYT FRONTEN', 'Murbräckor visar sin rusningsbana. Kliv åt sidan eller dasha igenom.'],
  [220, '04 / TVÅ BLIR FLER', 'Tvillingar delar sig. Lämna plats runt fienden när den sprängs.'],
  [300, '05 / MINFÄLT', 'Minläggare markerar farliga cirklar. Lämna dem innan de aktiveras.'],
  [390, '06 / SISTA LINJEN', 'Alla hot kombineras. Förbered din byggnad för Voidkeeper.']
];
export class Game {
  constructor({ width = 1100, height = 760, random = Math.random } = {}) {
    this.w = width; this.h = height; this.random = random; this.reset(); this.state = 'menu';
  }
  reset() {
    this.state = 'play'; this.time = 0; this.score = 0; this.kills = 0; this.level = 1; this.xp = 0; this.need = 6;
    this.id = 1; this.enemies = []; this.bullets = []; this.shots = []; this.gems = []; this.hazards = []; this.events = [];
    this.ranks = Object.fromEntries(UPGRADES.map(u => [u.id, 0])); this.choices = []; this.spawnTimer = 1.8; this.fireTimer = 0;
    this.boss = null; this.bossSpawned = false; this.bossIndex = 0; this.bossesDefeated = 0; this.intermissionUntil = 0; this.lastUpgradeAt = 0; this.upgradeReason = null; this.lastBossName = null; this.stage = -1; this.resting = false; this.hitCount = 0; this.dashes = 0;
    this.damageTaken = 0; this.lastDamage = ''; this.terminal = false; this.resumeGrace = 0; this.lastRest = -1;
    this.player = { x: this.w / 2, y: this.h * .55, hp: 100, max: 100, r: 11, speed: 235, inv: 2,
      dx: 0, dy: -1, angle: -Math.PI / 2, dashCooldown: 0, dashTime: 0, dashId: 0 };
    this.emit('start');
  }
  emit(type, data = {}) { if (this.events.length < 250) this.events.push({ type, ...data }); }
  drainEvents() { const events = this.events; this.events = []; return events; }
  resize(w, h) {
    const sx = w / this.w, sy = h / this.h;
    for (const arr of [[this.player], this.enemies, this.bullets, this.shots, this.gems, this.hazards]) {
      for (const o of arr) { o.x *= sx; o.y *= sy; if ('tx' in o) { o.tx *= sx; o.ty *= sy; } }
    }
    this.w = w; this.h = h; this.player.x = clamp(this.player.x, 20, w - 20); this.player.y = clamp(this.player.y, 20, h - 20);
  }
  pause() { if (this.state === 'play') { this.state = 'paused'; return true; } return false; }
  resume() { if (this.state === 'paused') { this.state = 'play'; this.player.inv = Math.max(this.player.inv, 1.2); this.resumeGrace = 1.2; } }
  dash() {
    const p = this.player;
    if (this.state !== 'play' || p.dashCooldown > 0) return false;
    p.dashCooldown = 3 - this.ranks.dash * .45; p.dashTime = .2; p.inv = Math.max(p.inv, .35); p.dashId++;
    this.dashes++; this.emit('dash', { x: p.x, y: p.y }); return true;
  }
  damage(amount, source, x, y) {
    if (this.state !== 'play' || this.player.inv > 0) return false;
    const p = this.player; p.hp = Math.max(0, p.hp - amount); p.inv = .85; this.damageTaken += amount; this.lastDamage = source;
    this.emit('damage', { x: p.x, y: p.y, fromX: x, fromY: y, amount, source });
    if (!p.hp) this.finish(false); return true;
  }
  finish(won) {
    if (this.terminal) return false;
    this.terminal = true; this.state = won ? 'won' : 'over'; if (won) this.score += 10000;
    this.emit('finish', { won, x: this.boss?.x ?? this.player.x, y: this.boss?.y ?? this.player.y }); return true;
  }
  eligible() { return UPGRADES.filter(u => this.ranks[u.id] < u.max && (!u.requires || u.requires(this))); }
  offer(reason = 'xp') {
    if (this.state !== 'play' || (reason === 'xp' && this.xp < this.need)) return false;
    const pool = this.eligible();
    if (reason === 'xp') this.xp -= this.need;
    this.lastUpgradeAt = this.time;
    if (!pool.length) {
      this.player.hp = Math.min(this.player.max, this.player.hp + 20);
      this.score += 250; this.emit('repair'); return false;
    }
    if (reason !== 'start') this.level++;
    this.need = 6 + (this.level - 1) * 4;
    this.upgradeReason = reason;
    this.choices = [];
    if (reason === 'start') this.choices = ['rapid', 'chain', 'drone'];
    else for (let i = 0, n = Math.min(3, pool.length); i < n; i++) {
      this.choices.push(pool.splice(Math.floor(this.random() * pool.length), 1)[0].id);
    }
    this.state = 'upgrade'; this.emit('upgrade', { reason }); return true;
  }
  choose(id) {
    if (this.state !== 'upgrade' || !this.choices.includes(id)) return false;
    const u = UPGRADES.find(u => u.id === id);
    if (!u || this.ranks[id] >= u.max || (u.requires && !u.requires(this))) return false;
    this.ranks[id]++;
    if (id === 'shield') { this.player.max += 20; this.player.hp = Math.min(this.player.max, this.player.hp + 35); }
    this.player.speed = 235 * (1 + this.ranks.magnet * .05);
    this.choices = []; this.lastUpgradeAt = this.time; this.state = 'play'; this.player.inv = Math.max(this.player.inv, 1.2); this.emit('choice', { id }); return true;
  }
  spawn(type, position) {
    if (this.enemies.length >= LIMITS.enemies) return null;
    const t = TYPES[type]; let x, y;
    if (position) { x = position.x; y = position.y; }
    else {
      let best = null;
      for (let i = 0; i < 8; i++) {
        const side = Math.floor(this.random() * 4);
        const a = { x: side < 2 ? (side === 0 ? -35 : this.w + 35) : this.random() * this.w,
          y: side >= 2 ? (side === 2 ? -35 : this.h + 35) : this.random() * this.h };
        const d = length(a.x - this.player.x, a.y - this.player.y);
        if (!best || d > best.d) best = { ...a, d }; if (d > 260) { best = { ...a, d }; break; }
      }
      x = best.x; y = best.y;
    }
    const e = { id: this.id++, type, x, y, ...t, max: t.hp, age: 0, hit: 0, mode: 'move', timer: 1.7 + this.random(),
      angle: 0, tx: x, ty: y, mark: -1, droneHit: {}, phase: 1, pattern: 0 };
    this.enemies.push(e); this.emit('spawn', { x: clamp(x, 12, this.w - 12), y: clamp(y, 12, this.h - 12), enemy: type }); return e;
  }
  hit(e, amount, chain = false) {
    if (e.hp <= 0 || this.state !== 'play' || (e.type === 'boss' && e.age < 3)) return;
    e.hp -= amount; e.hit = .065; this.emit('hit', { x: e.x, y: e.y, amount });
    if (chain && this.ranks.chain && ++this.hitCount % 3 === 0) {
      let prev = e; const used = new Set([e.id]);
      for (let i = 0; i < this.ranks.chain; i++) {
        let next = null, near = 155;
        for (const other of this.enemies) { const d = length(other.x - prev.x, other.y - prev.y); if (other.hp > 0 && !used.has(other.id) && d < near) { near = d; next = other; } }
        if (!next) break;
        this.emit('arc', { x: prev.x, y: prev.y, tx: next.x, ty: next.y }); used.add(next.id);
        this.hit(next, (24 + this.ranks.power * 8) * .65, false); prev = next;
      }
    }
    if (e.hp > 0 || this.state !== 'play') return;
    this.kills++; this.score += e.type === 'boss' ? 2000 : 25 * Math.max(1, e.value);
    this.emit('kill', { x: e.x, y: e.y, enemy: e.type });
    if (e.type === 'boss') {
      this.bossesDefeated++;
      if (e.bossKind === 'voidkeeper') { this.finish(true); return; }
      this.lastBossName = e.name;
      this.boss = null; this.bossSpawned = false;
      this.enemies = []; this.shots = []; this.bullets = []; this.hazards = [];
      this.player.hp = Math.min(this.player.max, this.player.hp + 30);
      this.player.inv = Math.max(this.player.inv, 2);
      this.intermissionUntil = this.time + 12; this.spawnTimer = 4;
      this.emit('bossDefeated', { name: e.name, x: e.x, y: e.y });
      this.offer('boss'); return;
    }
    if (e.value) this.addGem(e.x, e.y, e.value);
    if (e.type === 'splitter') {
      for (let i = 0; i < 2; i++) { const a = this.random() * Math.PI * 2; this.spawn('shard', { x: e.x + Math.cos(a) * 28, y: e.y + Math.sin(a) * 28 }); }
    }
  }
  addGem(x, y, value) {
    if (this.gems.length >= LIMITS.gems) { let near = this.gems.reduce((a, b) => length(a.x - x, a.y - y) < length(b.x - x, b.y - y) ? a : b); near.value += value; }
    else this.gems.push({ x, y, value });
  }
  shot(x, y, angle, speed = 170, damage = 12) {
    if (this.shots.length < LIMITS.shots) this.shots.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 8, damage });
  }
  hazard(kind, x, y, angle = 0, radius = 64, warn = 1.25, live = 1.8) {
    if (this.hazards.length >= LIMITS.hazards) return;
    this.hazards.push({ kind, x, y, angle, radius, warn, warning: warn, live, active: false });
  }
  dronePositions() {
    return Array.from({ length: this.ranks.drone }, (_, i) => {
      const a = this.time * 2 + i * Math.PI * 2 / this.ranks.drone, r = 65 + this.ranks.orbit * 22;
      return { x: this.player.x + Math.cos(a) * r, y: this.player.y + Math.sin(a) * r, angle: a };
    });
  }
  nextBossAt() { return Math.max(BOSSES[this.bossIndex]?.at ?? Infinity, this.intermissionUntil); }
  beginBoss() {
    const spec = BOSSES[this.bossIndex];
    if (!spec || this.bossSpawned || this.state !== 'play') return false;
    this.bossIndex++; this.bossSpawned = true; this.resting = false;
    this.enemies = []; this.shots = []; this.bullets = []; this.hazards = [];
    this.boss = this.spawn('boss', { x: this.w / 2, y: -80 });
    Object.assign(this.boss, { name: spec.name, bossKind: spec.kind, hp: spec.hp, max: spec.hp, r: spec.r, timer: 2 });
    this.player.inv = Math.max(this.player.inv, 3);
    this.emit('banner', { title: `BOSS ${this.bossIndex} / 3 · ${spec.name}`, text: spec.intro });
    return true;
  }
  updateSentinel(e, dt) {
    const p = this.player;
    e.timer -= dt;
    if (e.mode === 'warn' && e.timer <= 0) {
      e.mode = 'rush'; e.timer = .65; this.emit('ram', { x: e.x, y: e.y });
    } else if (e.mode === 'rush') {
      e.x = clamp(e.x + Math.cos(e.angle) * 500 * dt, e.r, this.w - e.r);
      e.y = clamp(e.y + Math.sin(e.angle) * 500 * dt, e.r, this.h - e.r);
      if (e.timer <= 0) { e.mode = 'move'; e.timer = 2; }
    } else if (e.mode === 'aim' && e.timer <= 0) {
      const count = 3 + 2 * (e.phase - 1);
      for (let i = 0; i < count; i++) this.shot(e.x, e.y, e.angle + (i - (count - 1) / 2) * .19, 165, 12);
      e.mode = 'move'; e.timer = 2.2; this.emit('bossFire');
    } else if (e.mode === 'move') {
      e.x += (this.w * .5 + Math.sin(this.time * .5) * this.w * .25 - e.x) * dt * .7;
      e.y += (this.h * .25 - e.y) * dt * .5;
      if (e.timer <= 0) {
        e.mode = e.pattern++ % 2 === 0 ? 'aim' : 'warn'; e.timer = 1.2;
        e.angle = Math.atan2(p.y - e.y, p.x - e.x); this.emit('charge');
      }
    }
  }
  updateHive(e, dt) {
    e.x += (this.w * .5 + Math.sin(this.time * .3) * this.w * .23 - e.x) * dt * .5;
    e.y += (this.h * .25 - e.y) * dt * .5;
    e.timer -= dt;
    if (e.timer > 0) return;
    const p = this.player;
    if (e.pattern++ % 2 === 0) {
      for (let i = 0; i < 1 + e.phase; i++) {
        const a = i * Math.PI * 2 / (1 + e.phase);
        this.hazard('mine', clamp(p.x + Math.cos(a) * 100, 65, this.w - 65), clamp(p.y + Math.sin(a) * 100, 65, this.h - 65), 0, 56, 1.7, 2.2);
      }
      this.emit('charge');
    } else {
      // Children enter from distant edges with the normal spawn grace.
      for (let i = 0; i < e.phase + 1; i++) this.spawn('hunter');
      this.emit('bossFire');
    }
    e.timer = 3.8;
  }
  updateBoss(e, dt) {
    const p = this.player;
    if (e.age < 3) { e.y += (Math.min(135, this.h * .22) - e.y) * dt; return; }
    const phase = e.hp > e.max * .66 ? 1 : e.hp > e.max * .33 ? 2 : 3;
    if (phase !== e.phase) { e.phase = phase; this.emit('banner', { title: `${e.name} / FAS ${phase}`, text: e.bossKind === 'sentinel' ? 'Skottsvärmen blir bredare. Följ siktlinjerna.' : e.bossKind === 'hive' ? 'Fler minor och småskepp. Håll dig i rörelse.' : phase === 2 ? 'Klyvstrålen vaknar. Lämna den randiga banan.' : 'Kärnan är öppen. Minfält och strålar kombineras.' }); }
    if (e.bossKind === 'sentinel') { this.updateSentinel(e, dt); return; }
    if (e.bossKind === 'hive') { this.updateHive(e, dt); return; }
    e.x += (this.w * .5 + Math.sin(this.time * .3) * this.w * .27 - e.x) * dt * .45;
    e.y += (this.h * .22 + Math.cos(this.time * .4) * 45 - e.y) * dt * .4;
    e.timer -= dt;
    if (e.mode === 'ring' && e.timer <= 0) {
      const count = phase === 3 ? 22 : 18;
      for (let i = 0; i < count; i++) { const a = i / count * Math.PI * 2, gap = Math.atan2(Math.sin(a - e.angle), Math.cos(a - e.angle)); if (Math.abs(gap) > .37) this.shot(e.x, e.y, a, 125 + phase * 12); }
      this.emit('bossFire', { x: e.x, y: e.y }); e.mode = 'move'; e.timer = 2.8; return;
    }
    if (e.timer > 0) return;
    const pattern = e.pattern++ % 3;
    if (pattern === 0) { e.mode = 'ring'; e.angle = Math.atan2(p.y - e.y, p.x - e.x); e.timer = 1.3; this.emit('charge'); }
    else if (pattern === 1) {
      const a = Math.atan2(p.y - e.y, p.x - e.x);
      this.hazard('beam', e.x, e.y, a, 23, 1.5, .65);
      if (phase >= 2) this.hazard('beam', e.x, e.y, a + .65, 23, 1.5, .65);
      if (phase >= 3) this.hazard('beam', e.x, e.y, a - .65, 23, 1.5, .65);
      e.timer = 4; this.emit('charge');
    } else {
      for (let i = 0; i < 2 + phase; i++) {
        const a = i * Math.PI * 2 / (2 + phase);
        this.hazard('mine', clamp(p.x + Math.cos(a) * 105, 65, this.w - 65), clamp(p.y + Math.sin(a) * 105, 65, this.h - 65), 0, 54, 1.6, 2);
      }
      e.timer = 4.4; this.emit('charge');
    }
  }
  update(dt, input = { x: 0, y: 0 }) {
    if (this.state !== 'play') return;
    this.time += dt; const p = this.player;
    p.inv = Math.max(0, p.inv - dt); this.resumeGrace = Math.max(0, this.resumeGrace - dt); p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    let mx = input.x || 0, my = input.y || 0, magnitude = length(mx, my);
    if (magnitude > 1) { mx /= magnitude; my /= magnitude; }
    if (magnitude > .08 && !p.dashTime) { const n = length(mx, my); p.dx = mx / n; p.dy = my / n; }
    const oldX = p.x, oldY = p.y, wasDash = p.dashTime > 0;
    if (wasDash) { mx = p.dx; my = p.dy; p.dashTime = Math.max(0, p.dashTime - dt); }
    const speed = p.speed * (wasDash ? 3.6 : 1);
    p.x = clamp(p.x + mx * speed * dt, 16, this.w - 16); p.y = clamp(p.y + my * speed * dt, 16, this.h - 16);
    if (wasDash && this.ranks.dash) for (const e of this.enemies) {
      if (e.mark !== p.dashId && e.age > .7 && segmentDistance(e.x, e.y, oldX, oldY, p.x, p.y) < e.r + 20) { e.mark = p.dashId; this.hit(e, 55 + (this.ranks.dash - 1) * 30); }
    }
    if (wasDash && !p.dashTime && this.ranks.nova) {
      const r = 100 + (this.ranks.nova - 1) * 30;
      for (const e of this.enemies) if (length(e.x - p.x, e.y - p.y) < r + e.r) this.hit(e, 45 + (this.ranks.nova - 1) * 35);
      this.shots = this.shots.filter(s => length(s.x - p.x, s.y - p.y) > r); this.emit('nova', { x: p.x, y: p.y, radius: r });
    }
    if (this.state !== 'play') return;
    const stage = INTRO.reduce((s, a, i) => this.time >= a[0] ? i : s, 0);
    if (stage !== this.stage && !this.bossSpawned) { this.stage = stage; this.emit('banner', { title: INTRO[stage][1], text: INTRO[stage][2] }); }
    const cycle = Math.floor(this.time / 60), phase = this.time % 60;
    this.resting = (phase >= 50 || this.time < this.intermissionUntil) && !this.bossSpawned;
    if (this.resting && this.time >= this.intermissionUntil && cycle !== this.lastRest) {
      this.lastRest = cycle; p.hp = Math.min(p.max, p.hp + 8); this.emit('banner', { title: 'SIGNALPAUS / +8 SKÖLD', text: 'Samla kvarvarande energi. Nästa våg närmar sig.' });
    }
    if (this.time >= this.nextBossAt() && !this.bossSpawned) this.beginBoss();
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && !this.resting && !this.bossSpawned) {
      this.spawnTimer = Math.max(.52, 1.7 - this.time * .0025);
      const pool = ['hunter', 'hunter']; if (stage >= 1) pool.push('sniper'); if (stage >= 2) pool.push('rammer'); if (stage >= 3) pool.push('splitter'); if (stage >= 4) pool.push('warden');
      this.spawn(pool[Math.floor(this.random() * pool.length)]);
      if (stage >= 3 && phase > 30 && this.random() < .25) this.spawn('hunter');
    }
    const drones = this.dronePositions();
    for (const e of this.enemies) {
      if (e.hp <= 0) continue; e.age += dt; e.hit = Math.max(0, e.hit - dt);
      if (e.age < .75) continue;
      let dx = p.x - e.x, dy = p.y - e.y, d = length(dx, dy) || 1;
      if (e.type === 'boss') this.updateBoss(e, dt);
      else {
        e.timer -= dt;
        if (e.type === 'rammer') {
          if (e.mode === 'move' && e.timer <= 0 && d < 500) { e.mode = 'warn'; e.timer = 1; e.angle = Math.atan2(dy, dx); }
          else if (e.mode === 'warn' && e.timer <= 0) { e.mode = 'rush'; e.timer = .7; this.emit('ram', { x: e.x, y: e.y }); }
          else if (e.mode === 'rush') { e.x += Math.cos(e.angle) * 440 * dt; e.y += Math.sin(e.angle) * 440 * dt; if (e.timer <= 0) { e.mode = 'move'; e.timer = 2.6; } }
          else if (e.mode === 'move') { e.x += dx / d * e.speed * dt; e.y += dy / d * e.speed * dt; }
        } else if (e.type === 'sniper') {
          if (e.mode === 'move') {
            const v = d < 210 ? -1 : d > 290 ? 1 : 0;
            e.x += (dx / d * v + dy / d * .25) * e.speed * dt; e.y += (dy / d * v - dx / d * .25) * e.speed * dt;
            if (e.timer <= 0 && e.x > 0 && e.x < this.w && e.y > 0 && e.y < this.h) { e.mode = 'aim'; e.timer = .85; e.angle = Math.atan2(dy, dx); }
          } else if (e.timer <= 0) { this.shot(e.x, e.y, e.angle, 210); e.timer = 2.6; e.mode = 'move'; this.emit('enemyShot'); }
        } else if (e.type === 'warden') {
          const v = d > 210 ? 1 : -.2; e.x += dx / d * e.speed * dt * v; e.y += dy / d * e.speed * dt * v;
          if (e.timer <= 0) { this.hazard('mine', p.x, p.y, 0, 58, 1.4, 2.8); e.timer = 4.5; this.emit('charge'); }
        } else { e.x += dx / d * e.speed * dt; e.y += dy / d * e.speed * dt; }
        e.x = clamp(e.x, -45, this.w + 45); e.y = clamp(e.y, -45, this.h + 45);
      }
      if (length(e.x - p.x, e.y - p.y) < e.r + p.r && !(e.type === 'boss' && e.age < 3)) this.damage(e.type === 'rammer' ? 24 : 14, e.name, e.x, e.y);
      if (this.state !== 'play') return;
      for (let i = 0; i < drones.length; i++) if ((e.droneHit[i] || 0) <= this.time && length(drones[i].x - e.x, drones[i].y - e.y) < e.r + 12) {
        e.droneHit[i] = this.time + .5; this.hit(e, 26 + this.ranks.orbit * 10);
      }
    }
    if (this.state !== 'play') return;
    this.fireTimer -= dt; let target = null, nearest = Infinity;
    for (const e of this.enemies) {
      const d = length(e.x - p.x, e.y - p.y);
      if (e.hp > 0 && e.age >= (e.type === 'boss' ? 3 : .75) && e.x >= 0 && e.y >= 0 && e.x <= this.w && e.y <= this.h && d < nearest) { nearest = d; target = e; }
    }
    if (target) {
      p.angle = Math.atan2(target.y - p.y, target.x - p.x);
      if (this.fireTimer <= 0) {
        this.fireTimer += .44 * .83 ** this.ranks.rapid;
        const count = 1 + this.ranks.split * 2;
        for (let i = 0; i < count && this.bullets.length < LIMITS.bullets; i++) {
          const side = i - (count - 1) / 2, a = p.angle + side * .14;
          this.bullets.push({ x: p.x, y: p.y, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, life: 1.6, damage: (24 + this.ranks.power * 8) * (side ? .55 : 1) });
        }
        this.emit('shot', { x: p.x, y: p.y });
      }
    } else this.fireTimer = Math.max(0, this.fireTimer);
    // Spatial grid keeps projectile collision checks bounded in dense waves.
    const grid = new Map(), cell = 90;
    for (const e of this.enemies) if (e.hp > 0) {
      for (let x = Math.floor((e.x - e.r) / cell); x <= Math.floor((e.x + e.r) / cell); x++) for (let y = Math.floor((e.y - e.r) / cell); y <= Math.floor((e.y + e.r) / cell); y++) {
        const key = `${x},${y}`; if (!grid.has(key)) grid.set(key, []); grid.get(key).push(e);
      }
    }
    for (const b of this.bullets) {
      const ax = b.x, ay = b.y; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      const candidates = new Set();
      for (let x = Math.floor((Math.min(ax, b.x) - 4) / cell); x <= Math.floor((Math.max(ax, b.x) + 4) / cell); x++) for (let y = Math.floor((Math.min(ay, b.y) - 4) / cell); y <= Math.floor((Math.max(ay, b.y) + 4) / cell); y++) for (const e of grid.get(`${x},${y}`) || []) candidates.add(e);
      for (const e of candidates) if (e.hp > 0 && b.life > 0 && e.age >= (e.type === 'boss' ? 3 : .75) && segmentDistance(e.x, e.y, ax, ay, b.x, b.y) < e.r + 3) { b.life = 0; this.hit(e, b.damage, true); break; }
    }
    if (this.state !== 'play') return;
    for (const s of this.shots) {
      const ax = s.x, ay = s.y; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      if (segmentDistance(p.x, p.y, ax, ay, s.x, s.y) < p.r + 5) { this.damage(s.damage, 'FIENDESKOTT', s.x, s.y); s.life = 0; }
    }
    if (this.state !== 'play') return;
    for (const h of this.hazards) {
      if (h.warn > 0) { h.warn -= dt; if (h.warn <= 0) { h.active = true; this.emit('hazard', { x: h.x, y: h.y }); } }
      else {
        h.live -= dt;
        const hit = h.kind === 'mine' ? length(p.x - h.x, p.y - h.y) < h.radius + p.r : segmentDistance(p.x, p.y, h.x, h.y, h.x + Math.cos(h.angle) * 2400, h.y + Math.sin(h.angle) * 2400) < h.radius + p.r;
        if (hit) this.damage(h.kind === 'mine' ? 18 : 24, h.kind === 'mine' ? 'MINFÄLT' : 'KLYVSTRÅLE', h.x, h.y);
      }
    }
    if (this.state !== 'play') return;
    for (const g of this.gems) {
      const dx = p.x - g.x, dy = p.y - g.y, d = length(dx, dy), radius = this.resting ? 500 : 100 + this.ranks.magnet * 55;
      if (d < radius) { const move = Math.min(d, 420 * dt); g.x += dx / (d || 1) * move; g.y += dy / (d || 1) * move; }
      if (length(g.x - p.x, g.y - p.y) < 18) { this.xp += g.value; this.score += g.value * 5; g.dead = true; this.emit('pickup'); }
    }
    this.enemies = this.enemies.filter(e => e.hp > 0); this.bullets = this.bullets.filter(b => b.life > 0 && b.x > -30 && b.x < this.w + 30 && b.y > -30 && b.y < this.h + 30);
    this.shots = this.shots.filter(s => s.life > 0 && s.x > -50 && s.x < this.w + 50 && s.y > -50 && s.y < this.h + 50);
    this.gems = this.gems.filter(g => !g.dead); this.hazards = this.hazards.filter(h => h.live > 0);
    if (this.xp >= this.need) this.offer();
    else if (this.time - this.lastUpgradeAt >= 45) this.offer('support');
  }
}
