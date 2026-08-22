/* kcsim-diff 比對引擎（Node 與瀏覽器共用）
   用法：KCD.build(saveA, saveB, names) → 比對結果
   names 需提供 ship(id) / equip(id) / shipImg(id) / equipImg(id) */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.KCD=factory();
})(typeof self!=='undefined'?self:this,function(){

const eqJSON=(x,y)=>JSON.stringify(x??null)===JSON.stringify(y??null);

function build(A,B,N){
  const eq=e=>e?{mstId:e.mstId,name:N.equip(e.mstId),img:N.equipImg(e.mstId),
    lv:+e.level||0,rank:+e.rank||0}:null;
  const sh=s=>s?{name:N.ship(s.mstId),mstId:s.mstId,img:N.shipImg(s.mstId),
    level:s.level,hp:s.hp,hpInit:s.hpInit,morale:s.morale,fuel:s.fuelInit,ammo:s.ammoInit,
    stats:s.statsBase||{},equips:(s.equips||[]).map(eq),slots:s.slots||[]}:null;
  const keyed=list=>{const c={};return (list||[]).map((s,i)=>s?
    {k:s.mstId+'#'+(c[s.mstId]=(c[s.mstId]||0)+1),i,s}:null).filter(Boolean);};

  /* ── 自軍艦隊：mstId+出現序 對齊，同位置增減併成換艦 ── */
  function pairFleet(fa,fb,key,label){
    if(!fa&&!fb)return null;
    fa=fa||{ships:[]}; fb=fb||{ships:[]};
    const groups=[];
    for(const [tag,ka,kb] of [['main',fa.ships,fb.ships],['escort',fa.shipsEscort,fb.shipsEscort]]){
      if(!(ka&&ka.length)&&!(kb&&kb.length))continue;
      const KA=keyed(ka), KB=keyed(kb), m=new Map(KB.map(x=>[x.k,x]));
      const rows=[]; let onlyA=[];
      for(const x of KA){const y=m.get(x.k);
        if(!y){onlyA.push(x);continue;} m.delete(x.k);
        rows.push({slot:x.i,slotB:y.i,a:sh(x.s),b:sh(y.s)});}
      const onlyB=[...m.values()];
      for(const x of onlyA.slice()){
        const j=onlyB.findIndex(y=>y.i===x.i);
        if(j>=0){const y=onlyB.splice(j,1)[0];
          rows.push({slot:x.i,slotB:y.i,a:sh(x.s),b:sh(y.s),swap:true});
          onlyA=onlyA.filter(o=>o!==x);}}
      for(const x of onlyA)rows.push({slot:x.i,slotB:x.i,a:sh(x.s),b:null,swap:true});
      for(const y of onlyB)rows.push({slot:y.i,slotB:y.i,a:null,b:sh(y.s),swap:true});
      rows.sort((p,q)=>p.slot-q.slot);
      if(rows.length)groups.push({tag,rows});
    }
    if(!groups.length)return null;
    return {key,label,typeA:fa.type??null,typeB:fb.type??null,
      formA:fa.formation??null,formB:fb.formation??null,groups};
  }

  const fleets=[];
  const push=f=>{if(f)fleets.push(f);};
  push(pairFleet(A.fleetFMain,B.fleetFMain,'main','本隊'));
  push(pairFleet(A.fleetFSupportN,B.fleetFSupportN,'supportN','道中支援'));
  push(pairFleet(A.fleetFSupportB,B.fleetFSupportB,'supportB','決戰支援'));
  const ffA=A.fleetsFFriend||[], ffB=B.fleetsFFriend||[];
  for(let i=0;i<Math.max(ffA.length,ffB.length);i++){
    const fa=(ffA[i]||{}).fleet, fb=(ffB[i]||{}).fleet;
    if(!fa&&!fb)continue;
    push(pairFleet(fa,fb,'friend'+i,'友軍 '+(i+1)));
  }

  const lbA=A.landBases||[], lbB=B.landBases||[], landBases=[];
  for(let i=0;i<Math.max(lbA.length,lbB.length);i++){
    const a=lbA[i]||{}, b=lbB[i]||{};
    landBases.push({ind:i,
      a:{equips:(a.equips||[]).map(eq),slots:a.slots||[]},
      b:{equips:(b.equips||[]).map(eq),slots:b.slots||[]}});
  }

  /* ── 敵方：多重集合比對，忽略位置 ── */
  const STATN={fp:'fp',tp:'tp',aa:'aa',ar:'ar',ev:'ev',asw:'asw',los:'los',luk:'luk',
    range:'range',tacc:'tacc'};
  const BATTLEF=['formation','nodeType','doNB','doNBCond','lbasWaves','subOnly','useNormalSupport',
    'useBalloon','useAtoll','useSmoke','useAnchorageRepair','offrouteRate','forceEngagement'];
  const bag=l=>{const m=new Map();(l||[]).filter(Boolean).forEach(s=>{
    if(!m.has(s.mstId))m.set(s.mstId,[]);m.get(s.mstId).push(s);});return m;};

  function enemyShipDiff(x,y){
    const ch=[];
    for(const f of ['level','hp','hpInit','morale'])
      if(!eqJSON(x[f],y[f]))ch.push({field:f,a:x[f],b:y[f]});
    const sa=x.statsBase||{},sb=y.statsBase||{};
    for(const k of new Set([...Object.keys(sa),...Object.keys(sb)]))
      if(!eqJSON(sa[k],sb[k]))ch.push({field:STATN[k]||k,a:sa[k],b:sb[k]});
    if(!eqJSON(x.slots,y.slots))
      ch.push({field:'slots',a:(x.slots||[]).join('/'),b:(y.slots||[]).join('/')});
    const ea=x.equips||[],eb=y.equips||[];
    for(let i=0;i<Math.max(ea.length,eb.length);i++){
      const p=ea[i],q=eb[i];
      if(eqJSON(p&&p.mstId,q&&q.mstId)&&eqJSON(p&&p.level,q&&q.level)&&eqJSON(p&&p.rank,q&&q.rank))continue;
      ch.push({field:'equip'+(i+1),a:p?N.equip(p.mstId):'—',b:q?N.equip(q.mstId):'—'});
    }
    return ch;
  }
  function compDiff(fa,fb){
    const out={formA:fa?fa.formation:null,formB:fb?fb.formation:null,
      ships:[],added:[],removed:[],unchanged:0,onlySide:null};
    if(!fa||!fb){out.onlySide=fa?'A':'B';return out;}
    for(const [tag,ka,kb] of [['main',fa.ships,fb.ships],['escort',fa.shipsEscort,fb.shipsEscort]]){
      const MA=bag(ka),MB=bag(kb);
      for(const id of new Set([...MA.keys(),...MB.keys()])){
        const la=MA.get(id)||[],lb=MB.get(id)||[],d=lb.length-la.length;
        const meta={mstId:id,name:N.ship(id),img:N.shipImg(id),tag};
        if(d>0)out.added.push(Object.assign({},meta,{count:d}));
        if(d<0)out.removed.push(Object.assign({},meta,{count:-d}));
        for(let i=0;i<Math.min(la.length,lb.length);i++){
          const ch=enemyShipDiff(la[i],lb[i]);
          if(ch.length)out.ships.push(Object.assign({},meta,{idx:la.length>1?i+1:null,changes:ch}));
          else out.unchanged++;
        }
      }
    }
    return out;
  }

  const battles=[];
  const letter=(A.autoBonus&&A.autoBonus.nodeToLetter)||{};
  (A.battles||[]).forEach((ba,i)=>{
    const bb=(B.battles||[])[i]; if(!bb)return;
    const flags=[];
    for(const f of BATTLEF)if(!eqJSON(ba[f],bb[f]))flags.push({field:f,a:ba[f],b:bb[f]});
    const ca=ba.enemyComps||[],cb=bb.enemyComps||[];
    const sumA=ca.reduce((t,c)=>t+(+c.rate||0),0)||1, sumB=cb.reduce((t,c)=>t+(+c.rate||0),0)||1;
    const comps=[];
    for(let j=0;j<Math.max(ca.length,cb.length);j++){
      const pa=ca[j],pb=cb[j];
      const c={num:j+1,
        rateA:pa?+pa.rate||0:null,rateB:pb?+pb.rate||0:null,
        pctA:pa?+((+pa.rate||0)/sumA*100).toFixed(1):null,
        pctB:pb?+((+pb.rate||0)/sumB*100).toFixed(1):null,
        onlySide:(!pa||!pb)?(pa?'A':'B'):null};
      if(pa&&pb)Object.assign(c,compDiff(pa.fleet,pb.fleet));
      const changed=c.onlySide||c.rateA!==c.rateB||c.formA!==c.formB||
        (c.ships&&c.ships.length)||(c.added&&c.added.length)||(c.removed&&c.removed.length);
      if(changed)comps.push(c);
    }
    if(flags.length||comps.length)
      battles.push({ind:i,id:ba.id,letter:letter[ba.id]||null,flags,comps,nodeType:ba.nodeType});
  });

  /* ── 模擬器設定 ── */
  const norm=v=>(v===''||v===undefined)?null:v;
  const same=(a,b)=>{a=norm(a);b=norm(b);
    if(a===null&&b===null)return true; if(a===null||b===null)return false;
    if(typeof a==='object'||typeof b==='object')return JSON.stringify(a)===JSON.stringify(b);
    const na=+a,nb=+b;
    return (a!==''&&b!==''&&!isNaN(na)&&!isNaN(nb))?na===nb:a===b;};
  const settings=[];
  for(const k of ['useSupportN','useSupportB','useFF'])
    if(!same(A[k],B[k]))settings.push({scope:'top',field:k,a:A[k],b:B[k]});
  for(const key of ['settings','settingsFCF','autoBonus']){
    const oa=A[key]||{}, ob=B[key]||{};
    for(const k of new Set([...Object.keys(oa),...Object.keys(ob)])){
      if(key==='autoBonus'&&(k==='nodeToLetter'||k==='hash'))continue;
      if(!same(oa[k],ob[k]))settings.push({scope:key,field:k,a:oa[k],b:ob[k]});
    }
  }

  return {fleets,landBases,battles,settings,
    version:[A.version??null,B.version??null]};
}

return {build:build};
});
