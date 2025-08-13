// Compute per-tet target volume factors based on Voronoi edge scores
// This is a Brain-side aggregation that maps edge scores to cells (tets)

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function tetVolume(points, tet, isPeriodic) {
  // Basic unsigned volume for a tetrahedron defined by 4 vertices
  // If periodic, we still use direct coordinates for Part 2 scaffold
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

export function computeCellTargets({ edgeScores, threshold, invert, contractive, expansive, strength, gamma, maxCellScale, foam, VcurrentSite }) {
  const numSites = foam.points.length;
  const sum = new Float64Array(numSites);
  const cnt = new Uint32Array(numSites);
  const pBySite = new Float32Array(numSites);

  // Accumulate contributions per site via shared face for each Voronoi edge
  const edges = foam.voronoiEdges || [];
  const edgeToFace = foam.voronoiEdgeToDelaunayFace || new Map();
  let accepted = 0;
  for (let i = 0; i < edges.length; i++) {
    const t1 = edges[i][0] | 0;
    const t2 = edges[i][1] | 0;
    const key = t1 < t2 ? `${t1}-${t2}` : `${t2}-${t1}`;
    const s = edgeScores?.get ? (edgeScores.get(key) || 0) : 0;
    let r = invert ? (threshold - s) : (s - threshold);
    // Gating rules:
    // - Neither selected: accept both signs
    // - Only Contractive: accept r < 0
    // - Only Expansive: accept r > 0
    // - Both selected: accept both signs
    if (contractive || expansive) {
      if (contractive && !expansive && r >= 0) continue;
      if (expansive && !contractive && r <= 0) continue;
      // if both true: fall through
    }
    let contrib = Math.sign(r) * Math.pow(Math.abs(r), (gamma ?? 1.0));
    // Optional: weight by shared face area if available
    if (edgeToFace && edgeToFace.get) {
      const face = edgeToFace.get(key);
      if (face && face.length === 3) {
        const A = 1; // placeholder area=1; TODO: compute triangle area if points available
        contrib *= A;
      }
    }
    const face = edgeToFace.get(key);
    if (face && face.length === 3) {
      const i0 = face[0]|0, i1 = face[1]|0, i2 = face[2]|0;
      sum[i0] += contrib; cnt[i0] += 1;
      sum[i1] += contrib; cnt[i1] += 1;
      sum[i2] += contrib; cnt[i2] += 1;
      accepted++;
    }
  }

  // Fallback: if gating produced no signal, ignore gating and accumulate again
  if (accepted === 0 && edges.length) {
    for (let i = 0; i < edges.length; i++) {
      const t1 = edges[i][0] | 0;
      const t2 = edges[i][1] | 0;
      const key = t1 < t2 ? `${t1}-${t2}` : `${t2}-${t1}`;
      const s = edgeScores?.get ? (edgeScores.get(key) || 0) : 0;
      let r = invert ? (threshold - s) : (s - threshold);
      let contrib = Math.sign(r) * Math.pow(Math.abs(r), (gamma ?? 1.0));
      const face = edgeToFace.get(key);
      if (face && face.length === 3) {
        const i0 = face[0]|0, i1 = face[1]|0, i2 = face[2]|0;
        sum[i0] += contrib; cnt[i0] += 1;
        sum[i1] += contrib; cnt[i1] += 1;
        sum[i2] += contrib; cnt[i2] += 1;
      }
    }
  }

  // Map to per-site signed factor and targets
  const Vtarget = new Float64Array(numSites);
  const g = Number(strength ?? 0.05);
  const maxScale = Math.max(0, Number(maxCellScale ?? 0.10));
  for (let i = 0; i < numSites; i++) {
    const rt = cnt[i] ? (sum[i] / cnt[i]) : 0;
    const rtClamped = clamp(rt, -1, 1);
    const pt = clamp(g * rtClamped, -maxScale, maxScale);
    pBySite[i] = pt;
    const Vc = (VcurrentSite && isFinite(VcurrentSite[i])) ? VcurrentSite[i] : 1.0;
    Vtarget[i] = Vc * (1 + pt);
  }

  return { pBySite, Vtarget };
}


