"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../src/core.js");

const now = "2026-11-09T20:00:00.000Z";
const before = "2026-11-09T21:00:00.000Z";
const later = "2026-11-10T00:00:00.000Z";
const deadline = "2026-11-09T22:00:00.000Z";
const base = {kind:"premonition",sensation:"I had a strange feeling of familiarity.",interpretation:"Maybe I predicted it.",event:"The blue light will turn on before the cutoff.",deadline,probability:0.75};
function one() { return C.addRecord(C.emptyState(),base,"r1",now); }

test("schema and empty state",()=>assert.equal(C.emptyState().schema,"storyspace-1"));
test("probabilities include endpoints",()=>{assert.equal(C.validateProbability(0),0);assert.equal(C.validateProbability(1),1);});
test("invalid probability rejected",()=>{for(const p of [-0.1,1.1,NaN,Infinity,"0.7"]) assert.throws(()=>C.validateProbability(p));});
test("Brier 1/0 exact",()=>{assert.equal(C.brier(1,1),0);assert.equal(C.brier(0,1),1);assert.equal(C.brier(0.5,1),0.25);});
test("Brier rejects nonbinary outcome",()=>assert.throws(()=>C.brier(0.6,2)));
test("experience without predictive event stays observed only",()=>{const s=C.addRecord(C.emptyState(),{sensation:"Sudden wave of déjà vu.",kind:"deja-vu"},"d1",now);assert.equal(s.records[0].prediction,null);assert.throws(()=>C.freezeRecord(s,"d1",before));});
test("specific prospective claim created",()=>{let s=one();assert.equal(s.records[0].prediction.event,base.event);assert.equal(s.records[0].frozenAt,null);});
test("duplicate record cannot be written",()=>assert.throws(()=>C.addRecord(one(),base,"r1",now)));
test("deadline must be later than creation",()=>assert.throws(()=>C.addRecord(C.emptyState(),{...base,deadline:now},"r1",now)));
test("freeze before deadline",()=>{const s=C.freezeRecord(one(),"r1",before);assert.equal(s.records[0].frozenAt,before);});
test("freeze cannot be done twice or after deadline",()=>{const s=C.freezeRecord(one(),"r1",before);assert.throws(()=>C.freezeRecord(s,"r1",later));assert.throws(()=>C.freezeRecord(one(),"r1",later));});
test("unfrozen outcome rejected",()=>assert.throws(()=>C.resolveRecord(one(),"r1",1,"Lamp observed on",later)));
test("positive outcome can be resolved before deadline",()=>{const s=C.resolveRecord(C.freezeRecord(one(),"r1",before),"r1",1,"Lamp illuminated at the venue", "2026-11-09T21:30:00.000Z");assert.equal(s.records[0].resolution.brier,0.0625);});
test("absence cannot be certified ahead of cutoff",()=>assert.throws(()=>C.resolveRecord(C.freezeRecord(one(),"r1",before),"r1",0,"Nothing happened", "2026-11-09T21:30:00.000Z")));
test("negative after cutoff scored and duplicate blocked",()=>{const s=C.resolveRecord(C.freezeRecord(one(),"r1",before),"r1",0,"No event by cutoff", later);assert.equal(s.records[0].resolution.brier,0.5625);assert.throws(()=>C.resolveRecord(s,"r1",1,"later",later));});
test("summary makes no inference from 0 records",()=>assert.equal(C.scoreSummary(C.emptyState()).mean,null));
test("summary denominator is frozen and resolved only",()=>{let s=one();s=C.freezeRecord(s,"r1",before);s=C.resolveRecord(s,"r1",1,"Lamp clearly illuminated",later);s=C.addRecord(s,{sensation:"A second feeling."},"r2",later);assert.equal(C.scoreSummary(s).count,1);assert.equal(C.scoreSummary(s).fixedHalfBaseline,0.25);});
test("amendment preserves frozen original",()=>{let s=C.freezeRecord(one(),"r1",before);s=C.amendRecord(s,"r1",{...base,deadline:"2026-11-10T02:00:00.000Z"},"r2",later);assert.equal(s.records.length,2);assert.equal(s.records[1].amendedFrom,"r1");assert.equal(s.records[0].frozenAt,before);});
test("leaf verdict and dependent recursive aggregation",()=>{let s=C.emptyState();s=C.addNode(s,{text:"Source was archived properly",verdict:"PASS"},"a",now);s=C.addNode(s,{text:"Independent verification exists",verdict:"UNRESOLVED"},"b",now);s=C.addNode(s,{text:"Evidence supports causal explanation",requires:["a","b"]},"root",now);assert.equal(C.deriveVerdict(s.nodes,"root"),"UNRESOLVED");s.nodes.find(n=>n.id==="b").verdict="FAIL";assert.equal(C.deriveVerdict(s.nodes,"root"),"FAIL");});
test("claim cycle and missing dependency cannot quietly pass",()=>{const nodes=[{id:"a",requires:["b"],verdict:"PASS"},{id:"b",requires:["a"],verdict:"PASS"}];assert.throws(()=>C.deriveVerdict(nodes,"a"),/cycle/);assert.throws(()=>C.addNode(C.emptyState(),{text:"This node depends on absent",requires:["missing"]},"root",now));});
test("toy aggregate unchanged by later labels",()=>{const x=C.makeToyDataset();assert.equal(x.total,2520);assert.equal(x.raw.reduce((a,b)=>a+b,0),2520);for(let i=0;i<x.bins;i++)assert.equal(x.raw[i],x.a[i]+x.b[i]);assert.equal(x.classification,"CONSTRUCTED_TOY_NOT_QUANTUM_DATA");});
test("toy dataset is deterministic and seed changes labels not fixed earlier marginals",()=>{const a=C.makeToyDataset(),b=C.makeToyDataset(),c=C.makeToyDataset(1);assert.deepEqual(a,b);assert.deepEqual(a.raw,c.raw);assert.notDeepEqual(a.a,c.a);});
test("state serialization validates expected structure",()=>{const s=one();assert.equal(C.validateState(JSON.parse(JSON.stringify(s))),true);assert.throws(()=>C.validateState({records:[]}));});
test("source document does not claim independent authenticated timestamp",()=>assert.match(C.scoreSummary(C.emptyState()).distinction,/Not evidence/));