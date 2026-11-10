/* StorySpace core: pure, inspectable scientific controls. No network, no dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StoryCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SCHEMA = "storyspace-1";
  const VERDICTS = ["PASS", "FAIL", "UNRESOLVED"];
  const KINDS = ["deja-vu", "premonition", "dream", "temporal-anomaly", "ordinary", "other"];

  const copy = x => JSON.parse(JSON.stringify(x));
  const isValidDate = x => typeof x === "string" && Number.isFinite(Date.parse(x));

  function emptyState() {
    return { schema: SCHEMA, records: [], nodes: [], auditLog: [] };
  }

  function validateProbability(p) {
    if (typeof p !== "number" || !Number.isFinite(p) || p < 0 || p > 1)
      throw Error("Probability must be a finite number from 0 to 1.");
    return p;
  }

  function brier(p, outcome) {
    validateProbability(p);
    if (outcome !== 0 && outcome !== 1) throw Error("Outcome must be 0 or 1.");
    return (p - outcome) ** 2;
  }

  function validateState(s) {
    if (!s || s.schema !== SCHEMA || !Array.isArray(s.records) ||
        !Array.isArray(s.nodes) || !Array.isArray(s.auditLog)) throw Error("Invalid StorySpace document.");
    if (new Set(s.records.map(r => r.id)).size !== s.records.length) throw Error("Duplicate record ID.");
    if (new Set(s.nodes.map(r => r.id)).size !== s.nodes.length) throw Error("Duplicate claim ID.");
    for (const r of s.records) {
      if (!r.id || typeof r.id !== "string" || !isValidDate(r.createdAt))
        throw Error("Malformed record identity/time.");
      if (r.prediction) {
        if (typeof r.prediction.event !== "string" || r.prediction.event.trim().length < 12 ||
            !isValidDate(r.prediction.deadline)) throw Error("Invalid prediction definition/deadline.");
        validateProbability(r.prediction.probability);
      }
      if (r.resolution && (!r.frozenAt || (r.resolution.outcome !== 0 && r.resolution.outcome !== 1)))
        throw Error("Resolution requires prior local freeze.");
    }
    return true;
  }

  function addRecord(state, input, id, now) {
    validateState(state);
    if (typeof id !== "string" || !id.trim() || state.records.some(x => x.id === id)) throw Error("Record ID must be new and nonempty.");
    if (!isValidDate(now)) throw Error("Invalid created time.");
    const sensation = String(input.sensation || "").trim();
    if (sensation.length < 5) throw Error("Describe the experience in at least five characters.");
    const kind = KINDS.includes(input.kind) ? input.kind : "other";
    const interpretation = String(input.interpretation || "").trim();
    let prediction = null;
    const event = String(input.event || "").trim();
    if (event) {
      if (event.length < 12) throw Error("Define a specific outcome (at least 12 characters).");
      const deadline = String(input.deadline || "");
      if (!isValidDate(deadline) || Date.parse(deadline) <= Date.parse(now))
        throw Error("Prospective deadline must be later than entry creation.");
      const p = typeof input.probability === "string" ? Number(input.probability) : input.probability;
      prediction = { event, deadline: new Date(deadline).toISOString(), probability: validateProbability(p),
        baseline: 0.5, baselineScope: "DEMO_ONLY_NOT_CALIBRATED" };
    }
    const s = copy(state);
    const r = { id, kind, sensation, interpretation, createdAt: new Date(now).toISOString(),
      amendedFrom: input.amendedFrom || null, prediction, frozenAt: null, resolution: null };
    s.records.push(r);
    s.auditLog.push({ at: r.createdAt, action: "RECORD_CREATED", id });
    return s;
  }

  function freezeRecord(state, id, now) {
    validateState(state);
    const s = copy(state), r = s.records.find(x => x.id === id);
    if (!r) throw Error("Unknown record.");
    if (!r.prediction) throw Error("Only a specified prospective prediction can be frozen.");
    if (r.frozenAt) throw Error("The original locally frozen record cannot be frozen or edited again.");
    if (!isValidDate(now) || Date.parse(now) >= Date.parse(r.prediction.deadline))
      throw Error("Freeze before the event deadline.");
    if (Date.parse(now) < Date.parse(r.createdAt)) throw Error("Freeze time precedes creation.");
    r.frozenAt = new Date(now).toISOString();
    s.auditLog.push({ at: r.frozenAt, action: "LOCAL_FREEZE_NOT_EXTERNAL_CUSTODY", id });
    return s;
  }

  function resolveRecord(state, id, outcome, evidence, now) {
    validateState(state);
    const s = copy(state), r = s.records.find(x => x.id === id);
    if (!r || !r.frozenAt || !r.prediction) throw Error("Freeze a defined prediction before scoring.");
    if (r.resolution) throw Error("Resolution is already recorded; create a correction/amendment.");
    if (outcome !== 0 && outcome !== 1) throw Error("Outcome must be yes (1) or no (0).");
    if (!isValidDate(now) || Date.parse(now) < Date.parse(r.frozenAt))
      throw Error("Resolution time precedes freeze.");
    if (outcome === 0 && Date.parse(now) < Date.parse(r.prediction.deadline))
      throw Error("Cannot declare a time-bounded event absent before its deadline.");
    const note = String(evidence || "").trim();
    if (note.length < 8) throw Error("Provide a concrete outcome evidence note.");
    r.resolution = { outcome, evidence: note, observedAt: new Date(now).toISOString(),
      verification: "SELF_REPORTED_UNVERIFIED", brier: brier(r.prediction.probability, outcome) };
    s.auditLog.push({ at: r.resolution.observedAt, action: "SELF_REPORTED_OUTCOME", id, outcome });
    return s;
  }

  function amendRecord(state, oldId, patch, newId, now) {
    validateState(state);
    if (!state.records.some(r => r.id === oldId)) throw Error("Original record missing.");
    return addRecord(state, { ...patch, amendedFrom: oldId }, newId, now);
  }

  function scoreSummary(state) {
    validateState(state);
    const r = state.records.filter(x => x.frozenAt && x.resolution);
    if (!r.length) return { count: 0, mean: null, fixedHalfBaseline: null, distinction: "Not evidence of predictive skill." };
    return { count: r.length,
      mean: r.reduce((sum,x) => sum + brier(x.prediction.probability,x.resolution.outcome),0)/r.length,
      fixedHalfBaseline: 0.25,
      distinction: "Self-reported outcomes; fixed-half comparison is illustrative, not calibrated or independent." };
  }

  function addNode(state, input, id, now) {
    validateState(state);
    if (!id || state.nodes.some(n => n.id === id)) throw Error("Claim ID must be unique.");
    const text = String(input.text || "").trim();
    if (text.length < 8) throw Error("Claim text is too vague.");
    const requested = Array.isArray(input.requires) ? input.requires : [];
    const s = copy(state);
    s.nodes.push({ id, text, verdict: VERDICTS.includes(input.verdict) ? input.verdict : "UNRESOLVED",
      requires: requested, createdAt: now, evidence: String(input.evidence || "").trim() });
    // Reject bad references / cycles before returning.
    for (const node of s.nodes) deriveVerdict(s.nodes,node.id);
    s.auditLog.push({ at: now, action: "CLAIM_ADDED", id });
    return s;
  }

  function deriveVerdict(nodes, id, visiting = new Set()) {
    const node = nodes.find(n => n.id === id);
    if (!node) throw Error("Unknown claim reference " + id);
    if (visiting.has(id)) throw Error("Recursive claim cycle detected.");
    if (!Array.isArray(node.requires) || !node.requires.length)
      return VERDICTS.includes(node.verdict) ? node.verdict : "UNRESOLVED";
    const v = new Set(visiting); v.add(id);
    const childStatuses = node.requires.map(k => deriveVerdict(nodes,k,v));
    if (childStatuses.includes("FAIL")) return "FAIL";
    if (childStatuses.every(s => s === "PASS")) return "PASS";
    return "UNRESOLVED";
  }

  function makeToyDataset(seed = 20261109, bins = 21, perBin = 120) {
    let x = seed >>> 0;
    const random = () => { x = (Math.imul(x,1664525) + 1013904223) >>> 0; return x/4294967296; };
    const raw = Array(bins).fill(0), a = Array(bins).fill(0), b = Array(bins).fill(0);
    for (let i=0;i<bins;i++) for (let j=0;j<perBin;j++) {
      raw[i]++;
      const p = 0.5 + 0.42 * Math.cos(i * Math.PI * 2 / 7);
      if (random() < p) a[i]++; else b[i]++;
    }
    return { seed, bins, total: bins*perBin, raw, a, b, classification: "CONSTRUCTED_TOY_NOT_QUANTUM_DATA" };
  }

  return { SCHEMA, VERDICTS, KINDS, emptyState, validateProbability, brier,
    validateState, addRecord, freezeRecord, resolveRecord, amendRecord,
    scoreSummary, addNode, deriveVerdict, makeToyDataset };
});