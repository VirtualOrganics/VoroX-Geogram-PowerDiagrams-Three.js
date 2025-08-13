// Minimal weights state and update rule for power diagram targeting

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function initWeights(numTets) {
  return new Float32Array(numTets); // zeros
}

export function updateWeights({ weights, Vcurrent, Vtarget, stepSize, wClamp }) {
  const eta = Number(stepSize ?? 0.02);
  const clampStep = Math.max(0, Number(wClamp ?? 0.02));
  const n = weights.length;
  for (let t = 0; t < n; t++) {
    const e = (Vtarget[t] ?? 0) - (Vcurrent[t] ?? 0);
    const dw = clamp(eta * e, -clampStep, clampStep);
    weights[t] = (weights[t] ?? 0) + dw;
  }
}


