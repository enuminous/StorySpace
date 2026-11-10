/* StorySpace local-first app; no network, analytics or third-party libraries. */
(function(){
  "use strict";
  const C=window.StoryCore;
  if(!C){document.body.textContent="StorySpace core missing";return}
  const KEY="storyspace-v1-local-only";
  const $=id=>document.getElementById(id);
  const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const iso=()=>new Date().toISOString();
  const fmt=x=>x?new Date(x).toLocaleString():"—";
  const uid=p=>p+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);
  let data=C.emptyState(),storeError="",reveal=false;
  try{const s=localStorage.getItem(KEY);if(s){const parsed=JSON.parse(s);C.validateState(parsed);data=parsed}}catch(e){storeError="Stored local data could not be read safely. Nothing has been overwritten; back up your browser data before resetting."}
  function msg(s,bad){const e=$("toast");e.textContent=s;e.className=bad?"toast error visible":"toast visible"}
  function save(){if(storeError){msg(storeError,true);return}try{localStorage.setItem(KEY,JSON.stringify(data))}catch{msg("Storage unavailable. Export your data now.",true)}}
  function show(name){
    document.querySelectorAll(".view").forEach(x=>x.hidden=x.dataset.view!==name);
    document.querySelectorAll(".tab").forEach(x=>{const on=x.dataset.tab===name;x.classList.toggle("active",on);x.setAttribute("aria-current",on?"page":"false")});
    $("activeLabel").textContent=({overview:"SIGNAL / STORY / EVIDENCE",journal:"SUBJECTIVE RECORDS",filter:"POST-SELECTION CHAMBER",claims:"RECURSIVE VERDICT TREE",sources:"RESEARCH BOUNDARY"})[name];
  }
  function summary(){
    const s=C.scoreSummary(data);
    $("metricExperiences").textContent=data.records.length;
    $("metricFrozen").textContent=data.records.filter(x=>x.frozenAt).length;
    $("metricResolved").textContent=data.records.filter(x=>x.resolution).length;
    $("metricScore").textContent=s.mean===null?"—":s.mean.toFixed(3);
    $("countNote").textContent=data.records.length?"Local self-reports, not externally verified measurements.":"No records yet. A feeling can be recorded without a prediction.";
    $("scoreNote").textContent=s.count?s.count+" locally scored forecasts. Lower Brier loss is better; 0.25 is a toy comparison only.":"No scored predictions. No predictive skill established.";
  }
  function recordHTML(r){
    const status=r.resolution?"SCORED / SELF-REPORTED":r.frozenAt?"LOCALLY FROZEN":r.prediction?"DRAFT FORECAST":"SIGNAL ONLY";
    const klass=r.resolution?"good":r.frozenAt?"warning":"neutral";
    const p=r.prediction;
    let html='<article class="record"><div class="record-top"><span class="eyebrow">'+esc(r.kind.toUpperCase().replaceAll("-"," "))+' · '+esc(fmt(r.createdAt))+'</span><span class="tag '+klass+'">'+esc(status)+'</span></div>';
    html+='<h3>'+esc(r.sensation)+'</h3><p class="story-desc"><span class="eyebrow-inline">STORY</span> '+esc(r.interpretation||"No interpretation recorded.")+'</p>';
    if(p)html+='<div class="forecast-line"><strong>EVIDENCE TARGET</strong><p>'+esc(p.event)+'</p><small>Cutoff '+esc(fmt(p.deadline))+' · p='+(p.probability*100).toFixed(0)+'% · 0.5 baseline for teaching only</small></div>';
    else html+='<div class="forecast-line">No prediction attached. A reported sensation does not by itself test causal claims.</div>';
    if(r.resolution)html+='<div class="result-line">Outcome: <strong>'+(r.resolution.outcome?"YES":"NO")+'</strong> · Brier loss '+r.resolution.brier.toFixed(3)+' · <span class="warning-text">unverified self-report</span><p>'+esc(r.resolution.evidence)+'</p></div>';
    html+='<div class="record-actions">';
    if(p&&!r.frozenAt)html+='<button class="smallbtn primary" data-action="freeze" data-id="'+esc(r.id)+'">FREEZE LOCALLY</button>';
    if(r.frozenAt&&!r.resolution)html+='<button class="smallbtn" data-action="resolve" data-id="'+esc(r.id)+'">RECORD OUTCOME</button>';
    html+='<button class="smallbtn" data-action="amend" data-id="'+esc(r.id)+'">NEW AMENDMENT</button><span class="record-id">'+esc(r.id)+'</span></div></article>';
    return html;
  }
  function records(){
    $("records").innerHTML=data.records.length?data.records.slice().reverse().map(recordHTML).join(""):'<div class="empty"><div class="empty-symbol">∴</div><b>No record exists yet.</b><p>Tell the difference between what you felt and the story that followed.</p></div>';
  }
  function claims(){
    $("claimTree").innerHTML=data.nodes.length?data.nodes.slice().reverse().map(n=>{
      let v="UNRESOLVED";try{v=C.deriveVerdict(data.nodes,n.id)}catch(e){}
      return '<article class="claim"><span class="tag '+(v==="PASS"?"good":v==="FAIL"?"bad":"warning")+'">'+v+'</span><div><h3>'+esc(n.text)+'</h3><p>'+esc(n.evidence||"No evidence recorded.")+'</p><small>ID '+esc(n.id)+(n.requires&&n.requires.length?" · requires "+n.requires.map(esc).join(", "):" · leaf")+'</small></div></article>';
    }).join(""):'<div class="empty">No claims. Add evidence leaves first; add a parent referencing their exact IDs. FAIL propagates upward.</div>';
  }
  const toy=C.makeToyDataset();
  function bars(arr,klass){
    const max=Math.max.apply(null,toy.raw);
    return '<div class="barset">'+arr.map((v,i)=>'<div class="bin" title="Bin '+(i+1)+': '+v+' simulated observations"><div class="bar '+klass+'" style="height:'+Math.max(2,100*v/max)+'%"></div></div>').join("")+'</div>';
  }
  function filter(){
    $("rawBars").innerHTML=bars(toy.raw,"raw");
    $("aBars").innerHTML=bars(toy.a,"a");
    $("bBars").innerHTML=bars(toy.b,"b");
    $("partitionView").hidden=!reveal;
    $("filterButton").textContent=reveal?"HIDE GROUP LABELS":"REVEAL LATER LABELS";
    $("filterMessage").textContent=reveal?"Group patterns differ. Yet the previous 2,520 observations and the raw marginal did not change. The groups were preassigned in the toy generator.":"All 2,520 earlier observations are fixed. Revealing group labels only changes how they are sorted.";
  }
  function render(){summary();records();claims();filter()}
  function localDate(x){const d=new Date(x),p=x=>String(x).padStart(2,"0");return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"T"+p(d.getHours())+":"+p(d.getMinutes())}
  $("recordForm").addEventListener("submit",e=>{
    e.preventDefault();if(storeError){msg(storeError,true);return}
    const f=e.currentTarget,v=new FormData(f);
    try{
      const deadline=String(v.get("deadline")||"");
      data=C.addRecord(data,{kind:v.get("kind"),sensation:v.get("sensation"),interpretation:v.get("interpretation"),event:v.get("event"),deadline:deadline?new Date(deadline).toISOString():"",probability:Number(v.get("probability"))/100,amendedFrom:f.dataset.amendedFrom||null},uid("SS"),iso());
      delete f.dataset.amendedFrom;f.reset();$("probabilityValue").textContent="60%";
      save();render();msg("Signal recorded separately from interpretation. No physical claim promoted.");
    }catch(err){msg(err.message,true)}
  });
  $("probability").addEventListener("input",e=>$("probabilityValue").textContent=e.target.value+"%");
  $("records").addEventListener("click",e=>{
    const b=e.target.closest("button[data-action]");if(!b)return;
    const id=b.dataset.id,r=data.records.find(x=>x.id===id);if(!r)return;
    try{
      if(b.dataset.action==="freeze"){
        if(!confirm("Freeze this prediction in THIS BROWSER? Browser time is not independent custody. Export and commit it before the event."))return;
        data=C.freezeRecord(data,id,iso());save();render();msg("LOCAL FREEZE recorded. Export for independent timestamp custody.");
      }else if(b.dataset.action==="resolve"){
        const ans=prompt("Did the fixed event occur? Enter exactly YES or NO.");if(ans===null)return;
        if(!/^(yes|no)$/i.test(ans.trim()))throw Error("Enter YES or NO.");
        const evidence=prompt("Concrete outcome source or observation notes (will remain self-reported):");if(evidence===null)return;
        data=C.resolveRecord(data,id,ans.trim().toLowerCase()==="yes"?1:0,evidence,iso());
        save();render();msg("Outcome scored as SELF-REPORTED. It is not independent evidence of retrocausality.");
      }else if(b.dataset.action==="amend"){
        $("kind").value=r.kind;$("sensation").value=r.sensation;$("interpretation").value=r.interpretation;
        $("eventDef").value=r.prediction?r.prediction.event:"";
        $("deadline").value=r.prediction?localDate(r.prediction.deadline):"";
        $("probability").value=r.prediction?Math.round(r.prediction.probability*100):60;
        $("probabilityValue").textContent=$("probability").value+"%";
        $("recordForm").dataset.amendedFrom=id;show("journal");$("sensation").focus();msg("New amendment prefilled. Saving will ADD a new record, not edit the old one.");
      }
    }catch(err){msg(err.message,true)}
  });
  $("claimForm").addEventListener("submit",e=>{
    e.preventDefault();const f=e.currentTarget,v=new FormData(f);
    try{
      data=C.addNode(data,{text:v.get("text"),verdict:v.get("verdict"),requires:String(v.get("requires")||"").split(",").map(x=>x.trim()).filter(Boolean),evidence:v.get("evidence")},uid("CL"),iso());
      save();f.reset();render();msg("Claim added; recursive parent verdicts are recomputed.");
    }catch(err){msg(err.message,true)}
  });
  $("filterButton").addEventListener("click",()=>{reveal=!reveal;filter()});
  $("exportButton").addEventListener("click",()=>{
    const json=JSON.stringify(Object.assign({},data,{exportedAt:iso(),warning:"Local timestamps and freezes are not independent evidence custody."}),null,2);
    const url=URL.createObjectURL(new Blob([json+"\n"],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="storyspace-local-"+new Date().toISOString().slice(0,10)+".json";document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);msg("Exported JSON. Commit externally *before* the event for independently checkable custody.");
  });
  $("importButton").addEventListener("click",()=>$("importFile").click());
  $("importFile").addEventListener("change",async e=>{
    const file=e.target.files&&e.target.files[0];if(!file)return;
    try{
      if(file.size>2000000)throw Error("Import exceeds 2 MB.");
      const obj=JSON.parse(await file.text());C.validateState(obj);
      if(!confirm("Replace all local StorySpace records with this import? Back up first."))return;
      data={schema:obj.schema,records:obj.records,nodes:obj.nodes,auditLog:obj.auditLog};storeError="";save();render();msg("Imported JSON. Its timestamps are NOT authenticated.");
    }catch(err){msg("Import rejected: "+err.message,true)}
    e.target.value="";
  });
  $("resetButton").addEventListener("click",()=>{
    if(!confirm("Delete all local entries? Export anything important first."))return;
    if(!confirm("Second confirmation: delete all entries from this browser?"))return;
    data=C.emptyState();storeError="";try{localStorage.removeItem(KEY)}catch{}render();msg("Local record cleared. No remote service contacted.");
  });
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>show(b.dataset.tab)));
  render();show("overview");if(storeError)msg(storeError,true);
})();