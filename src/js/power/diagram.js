// Placeholder wrapper for power diagram. For now, compute Vcurrent from foam.

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

export function buildPowerDiagram({ foam }) {
  // For Part 2 stub: return current V from foam tets and a no-op geometry
  const n = foam.simplices.length;
  const Vcurrent = new Float64Array(n);
  for (let t = 0; t < n; t++) Vcurrent[t] = tetVolume(foam.points, foam.simplices[t]);
  return { Vcurrent, cells: null };
}


