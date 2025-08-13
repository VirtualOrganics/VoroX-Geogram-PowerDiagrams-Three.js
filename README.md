VoroX-Geogram-PowerDiagrams-Three.js
====================================

Summary
-------
Runs fully in‑browser with Geogram (WASM) and Three.js. The system alternates Brain and Physical phases. Brain builds an obtuse‑only Voronoi edge graph and computes edge scores (Monte‑Carlo or PageRank). Scores aggregate to per‑cell target volume factors. Physical will not push geometry; it will solve for site weights so the power (Laguerre) diagram matches target volumes (semi‑discrete OT / capacitated Voronoi). This preserves convex foam cells and avoids crackling.

This repository tracks the “Power‑Diagram path.” Part 1 ships a clean scaffold and a Brain‑only demo (colors + legend). Physical actuation is disabled pending weight solve in Part 2.

Roadmap
-------
- Part 1: Scaffold + Brain (this PR)
- Part 2: Power weights (Laguerre) — solve site weights to hit target volumes
- Part 3: Cadence + worker orchestration
- Part 4: CI + docs

Quick start
-----------
1. Serve locally:
   - npm i -g http-server (or use any static server)
   - npm run dev
2. Open examples/basic/index.html
3. Toggle “Edge PageRank” and compute scores. Physical step is disabled; you should see colored edges and a legend.

Notes
-----
- WASM assets are under public/wasm (periodic_delaunay.* and regular_triangulation.*).
- XPBD code paths are kept but disabled in Part 1. The adapter owns state; Physical will be replaced by a weight solver in Part 2.


