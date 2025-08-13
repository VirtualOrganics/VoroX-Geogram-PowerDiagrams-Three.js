// Power diagram backend and numeric fallback.

let rtModulePromise = null;
async function getRegularTriangulationModule() {
  if (typeof RegularTriangulationModule === 'function') {
    if (!rtModulePromise) rtModulePromise = RegularTriangulationModule({});
    return rtModulePromise;
  }
  return null;
}

function tetVolume(points, tet) {
  const a = points[tet[0]];
  const b = points[tet[1]];
  const c = points[tet[2]];
  const d = points[tet[3]];
  const ab = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
  const ac = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
  const ad = [d[0]-a[0], d[1]-a[1], d[2]-a[2]];
  const cx = ab[1]*ac[2] - ab[2]*ac[1];
  const cy = ab[2]*ac[0] - ab[0]*ac[2];
  const cz = ab[0]*ac[1] - ab[1]*ac[0];
  const dot = cx*ad[0] + cy*ad[1] + cz*ad[2];
  return Math.abs(dot) / 6.0;
}

export async function buildPowerDiagram({ foam, weights = null, backend = 'numeric' }) {
  if (backend === 'geogram') {
    const Module = await getRegularTriangulationModule();
    if (Module) {
      const numSites = foam.points.length;
      const w = (weights && weights.length === numSites) ? weights : new Float32Array(numSites);
      const sites = new Array(numSites);
      for (let i = 0; i < numSites; i++) {
        const p = foam.points[i];
        sites[i] = { x: p[0], y: p[1], z: p[2], w2: Number(w[i] || 0) };
      }
      try {
        const res = Module.compute_regular_triangulation(sites, [1,1,1], true);
        const Vcurrent = new Float64Array(numSites);
        const cells = res?.cells || [];
        for (let c of cells) {
          const id = (c.siteId|0);
          if (id >= 0 && id < numSites) Vcurrent[id] = Number(c.volume||0);
        }
        return { Vcurrent, cells, mode: 'geogram-site' };
      } catch (e) {
        console.warn('Geogram regular triangulation failed, falling back to numeric:', e);
      }
    }
    // If module missing, fall through to numeric
  }
  // Numeric fallback: use tet volumes (per-tet indexing)
  const n = foam.simplices.length;
  const Vcurrent = new Float64Array(n);
  for (let t = 0; t < n; t++) Vcurrent[t] = tetVolume(foam.points, foam.simplices[t]);
  return { Vcurrent, cells: null, mode: 'numeric-tet' };
}


