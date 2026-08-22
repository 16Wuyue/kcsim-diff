/* 瀏覽器端：名稱／圖片來源、共享連結解碼、檔案匯入 */
(function(root){
'use strict';
/* 上游素材一律走 jsDelivr 的 GitHub 端點：
   不佔用 KC3Kai 的 GitHub Pages 頻寬，且有邊緣快取（s-maxage 12h）。
   用 @master 而非鎖 commit，是為了讓上游新增的艦娘與裝備自動跟上。 */
const UP='https://cdn.jsdelivr.net/gh/KC3Kai/kancolle-replay@master/';

/* ── 名稱與圖片：直接讀上游載入的全域資料 ── */
const names={
  ship:id=>{const d=root.SHIPDATA&&root.SHIPDATA[id];return (d&&(d.nameJP||d.name))||('#'+id);},
  equip:id=>{const d=root.EQDATA&&root.EQDATA[id];return (d&&(d.nameJP||d.name))||('#'+id);},
  shipImg:id=>{const d=root.SHIPDATA&&root.SHIPDATA[id];return (d&&d.image)||null;},
  equipImg:id=>{
    const e=root.EQDATA&&root.EQDATA[id]; if(!e)return null;
    const v=e.image!=null?e.image:(root.EQTDATA&&root.EQTDATA[e.type]&&root.EQTDATA[e.type].image);
    return v!=null?String(v):null;
  },
};

/* ── 輸入解析 ── */
function parseInput(str){
  str=String(str||'').trim();
  if(!str)return {kind:'empty'};
  const m1=str.match(/[?&]s=([A-Za-z0-9_-]+)/);
  if(m1)return {kind:'id',id:m1[1]};
  const m2=str.match(/#backup=(.+)$/);
  if(m2)return {kind:'b64',b64:decodeURIComponent(m2[1]).trim()};
  if(/^[A-Za-z0-9+/=]{200,}$/.test(str))return {kind:'b64',b64:str};
  if(/^https?:/i.test(str))return {kind:'bad',reason:'unrecognised_url'};
  if(/^[A-Za-z0-9_-]{6,24}$/.test(str))return {kind:'id',id:str};
  return {kind:'bad',reason:'unrecognised'};
}

function b64ToBytes(b64){
  const bin=atob(b64.replace(/\s+/g,''));
  const a=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);
  return a;
}
function unlzma(b64){
  return new Promise((ok,ng)=>{
    if(!root.LZMA)return ng(new Error('LZMA 未載入'));
    root.LZMA.decompress(b64ToBytes(b64),(res,err)=>{
      if(err)return ng(err);
      ok(typeof res==='string'?res:new TextDecoder().decode(new Uint8Array(res)));
    });
  });
}

async function loadOne(input){
  const p=parseInput(input);
  if(p.kind==='empty')throw new Error('empty');
  if(p.kind==='bad')throw new Error(p.reason);
  let b64=p.b64;
  if(p.kind==='id'){
    const res=await fetch('https://kcrdb.hitomaru.dev/simulators/'+encodeURIComponent(p.id)+'/data');
    if(!res.ok)throw new Error('kcrdb_'+res.status);
    b64=(await res.text()).trim();
  }
  return {save:JSON.parse(await unlzma(b64)),id:p.kind==='id'?p.id:null};
}

/* .kcsim 備份檔：LZString → {data,source} → data 是 save JSON 的字串 */
function loadFile(file){
  return new Promise((ok,ng)=>{
    const r=new FileReader();
    r.onerror=()=>ng(new Error('read_failed'));
    r.onload=()=>{
      try{
        if(!root.LZString)return ng(new Error('LZString 未載入'));
        const txt=root.LZString.decompressFromBase64(String(r.result).trim());
        const wrap=JSON.parse(txt);
        if(!wrap||!wrap.data)return ng(new Error('not_kcsim'));
        ok({save:JSON.parse(wrap.data),id:null});
      }catch(e){ng(e);}
    };
    r.readAsText(file);
  });
}

/* ── 上游語系檔 ── */
async function loadStrings(){
  const [en,ja]=await Promise.all(
    ['strings_en.json','strings_ja.json'].map(f=>
      fetch(UP+'js/data/'+f).then(r=>r.json()).catch(()=>null)));
  return {en,ja};
}

root.KCDB={UP,names,parseInput,loadOne,loadFile,loadStrings};
})(typeof self!=='undefined'?self:this);
