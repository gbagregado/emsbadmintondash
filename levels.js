// ═══════════════════════════════════════════════════════════════
// Ems's Badminton Blast – Level Data
// Tile-based levels using a simple character map
// ═══════════════════════════════════════════════════════════════
//
// Legend:
//   . = empty
//   G = ground
//   B = brick (breakable)
//   ? = question block (coin)
//   ! = question block (powerup)
//   S = spikes
//   E = enemy (rogue shuttlecock)
//   N = net enemy (stationary, tall)
//   C = birdie coin
//   P = player start
//   F = flag (level end)
//   p = platform (floating ground)
//
const Levels = (() => {
  function parse(map, name, bg) {
    const rows = map.trim().split('\n').map(r => r.trimEnd());
    const h = rows.length;
    const w = Math.max(...rows.map(r => r.length));
    const tiles = [];
    const entities = [];
    let start = { x: 2, y: 10 };

    for (let r = 0; r < h; r++) {
      tiles[r] = [];
      for (let c = 0; c < w; c++) {
        const ch = (rows[r] && rows[r][c]) || '.';
        tiles[r][c] = '.';

        switch (ch) {
          case 'G': tiles[r][c] = 'G'; break;
          case 'p': tiles[r][c] = 'G'; break;
          case 'B': tiles[r][c] = 'B'; break;
          case '?': tiles[r][c] = '?'; break;
          case '!': tiles[r][c] = '!'; break;
          case 'S': tiles[r][c] = 'S'; break;
          case 'P': start = { x: c, y: r }; break;
          case 'F': entities.push({ type: 'flag', col: c, row: r }); break;
          case 'E': entities.push({ type: 'enemy', col: c, row: r }); break;
          case 'N': entities.push({ type: 'net', col: c, row: r }); break;
          case 'C': entities.push({ type: 'coin', col: c, row: r }); break;
        }
      }
    }

    return { name, bg: bg || 'day', tiles, entities, start, w, h };
  }

  // ═══════════════════════════════════
  // WORLD 1 – Badminton Park
  // ═══════════════════════════════════
  const level1 = parse(`
..............................................................................
..............................................................................
..............................................................................
..............................................................................
......C.C.C..............C.C.C.......C.C.C...........C..C..C..........C.C.C..
..............................................................................
..............?B?..............B?B...........!.............................?...
..............................................................................
..P...................E.................E..........E......N.............E......
..............pp..........pppp......pp..pp......pp...pppp......pp............F
......pp...............pp..........................................................
.........................E..........E.................................................
GGGGGGGGGGGGGGGGG..GGGGGGGGGGGG..GGGGGGGGGGGGGGGGGGGGGGGGGGGG..GGGGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGG..GGGGGGGGGGGG..GGGGGGGGGGGGGGGGGGGGGGGGGGGG..GGGGGGGGGGGGGGGGGGGG
`, 'Badminton Park');

  // ═══════════════════════════════════
  // WORLD 2 – Court Chaos
  // ═══════════════════════════════════
  const level2 = parse(`
....................................................................................
....................................................................................
....................................................................................
.........C.C.C.C..........C..C..C.......C.C.C.C.........C..C..C..........C.C........
....................................................................................
.........B?B?B..............?!?.............B?B?B..........?B?..........?!?..........
....................................................................................
.P..................E......E.........E.N.E...........E..........E..N..........E......
...........pp..pp.......pp..pp....pp......pp.....pp..pp......pp..pp.....pp..........
......pp........................................................................F...
....................pp.....................................................pppp......
..........E.............E..........E.........E................E.........E............
GGGGGGGGGGGGGG..GGSSGGGGGGGGG..GGGGGGGGG..GGGGSSGGGGG..GGGGGGGGGGG..GGGGGGGGGGGGGGG
GGGGGGGGGGGGGG..GGGGGGGGGGGGG..GGGGGGGGG..GGGGGGGGGGG..GGGGGGGGGGG..GGGGGGGGGGGGGGG
`, 'Court Chaos');

  // ═══════════════════════════════════
  // WORLD 3 – Championship Arena
  // ═══════════════════════════════════
  const level3 = parse(`
............................................................................................
............................................................................................
............................................................................................
........C..C..C...........C.C.C.C..........C..C..C..C........C.C.C..........C..C..C.........
............................................................................................
........?B!B?..............B?!?B?!............?B?B!..........B?!B?............?!?B?..........
............................................................................................
.P.................E..N..E..........E..E......N.......E..N..E........E..N..E.........E.N....
..........pp..pp........pp..pp....pp....pp.........pp..pp........pp..pp........pp...........
.....pp..............pp..........................................................F..........
.................pp.....pp........pp.....pp.................pp.......pp.....pppp.............
.......E.....E............E..E.......E...........E..E............E..........E...............
GGGGGGGGGGGG..GGSSGGGGGGGGG..GGSSGGGGG..GGSSGGGGGGG..GGGGGGGSSGGG..GGSSGGGGGGGGGGGGGGGGGGG
GGGGGGGGGGGG..GGGGGGGGGGGGG..GGGGGGGGG..GGGGGGGGGGG..GGGGGGGGGGGGG..GGGGGGGGGGGGGGGGGGGGGG
`, 'Championship Arena');

  return [level1, level2, level3];
})();
