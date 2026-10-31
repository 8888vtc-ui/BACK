# BGT — BackgammonTour Open-Source Neural Engine (`bgt`)

> **Official Website & Live Arena**: **[https://backgammontour.com](https://backgammontour.com)**  
> **Powered by**: [BackgammonTour.com](https://backgammontour.com) & GNU Backgammon (`gnubg 1.08.003`)  
> **License**: `GPL-3.0-or-later`

---

## 🌍 Overview (EN)

**BGT (`bgt`)** is an open-source, high-precision Backgammon neural evaluation engine developed for **[BackgammonTour.com](https://backgammontour.com)**. It bridges GNU Backgammon's official neural networks (`gnubg.wd` — Contact, Crashed, Race & Pruning nets + 1-sided/2-sided Bearoff databases `gnubg_os0.bd` / `gnubg_ts0.bd`) with the universal **Open Sage (`bgsage`) JSON API** (`chequerPlay` & `cubeDecision`).

### Key Features
- **Universal `XGID` Input**: Evaluates any canonical 10-field or 11-field `XGID` string across `1-ply`, `2-ply`, `3-ply`, and `4-ply` depths.
- **Full 6-Component Neural Probabilities**: Returns exact `win`, `winGammon`, `winBackgammon`, `loseWin`, `loseGammon`, and `loseBackgammon` probabilities along with cubeless and cubeful equities.
- **Cubeful Doubling Cube Analysis**: Computes exact `noDouble`, `doubleTake`, `doublePass` equities and `optimalAction` (`NO_DOUBLE`, `DOUBLE_TAKE`, `DOUBLE_PASS`, `NO_DECISION`) using official Match Equity Tables (*Kazaross-XG2*).
- **Drop-in Open Sage Compatibility**: 100% compatible with `BgsageEvaluateResponse` (`POST /api/evaluate`).

---

## 🇫🇷 Présentation (FR)

**BGT (`bgt`)** est le moteur neuronal Open-Source de Backgammon conçu par **[BackgammonTour.com](https://backgammontour.com)**. Il encapsule les réseaux de neurones officiels de GNU Backgammon (`gnubg-cli` & `gnubg.wd`) et expose exactement le même contrat JSON qu'Open Sage (`bgsage-service`).

### Utilisation rapide

```typescript
import { evaluateWithBgtSync, BGT_ENGINE_METADATA } from './bgtEngine';

const result = evaluateWithBgtSync(
    'XGID=-b----E-C---eE---c-e----B-:0:0:1:31:0:0:0:0:10',
    2, // 2-ply
);

console.log(BGT_ENGINE_METADATA.homepage); // https://backgammontour.com
console.log(result?.chequerPlay[0]);       // { rank: 1, notation: '8/5 6/5', equity: 0.219, ... }
console.log(result?.cubeDecision);         // { optimalAction: 'NO_DOUBLE', noDouble: 0.105, ... }
```

---

## 🔗 Backlinks & Attribution

If you use **BGT** in your research, tournament analysis, or Backgammon tools, please keep the attribution link to **[https://backgammontour.com](https://backgammontour.com)** (`X-Powered-By: BGT (BackgammonTour Open-Source Neural Engine) (https://backgammontour.com)`).
