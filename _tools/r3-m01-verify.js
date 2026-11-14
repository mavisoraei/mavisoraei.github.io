'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');

const measure = `(function(){
  function visible(el){
    var s=getComputedStyle(el);
    if(s.display==='none'||s.visibility==='hidden'||parseFloat(s.opacity)===0)return false;
    if(el.closest('[hidden]'))return false;
    if(el.checkVisibility&&!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))return false;
    return true;
  }
  function inScroller(el){
    var n=el;
    while(n&&n!==document.body){
      var s=getComputedStyle(n);
      if(s.overflowX==='auto'||s.overflowX==='scroll')return true;
      n=n.parentElement;
    }
    return false;
  }
  function inOverlay(el){
    var n=el;
    while(n&&n!==document.body&&n!==document.documentElement){
      var p=getComputedStyle(n).position;
      if(p==='fixed'||p==='absolute')return true;
      n=n.parentElement;
    }
    return false;
  }
  var vw=innerWidth,ih=innerHeight,bad=[];
  var all=[...document.querySelectorAll('body *')];
  for(var el of all){
    if(!visible(el)||inScroller(el)||inOverlay(el))continue;
    if(el.closest('script,style,noscript,svg'))continue;
    var range=document.createRange(),rects=[];
    for(var n of el.childNodes){
      if(n.nodeType!==3||!n.textContent.trim())continue;
      range.selectNodeContents(n);
      rects.push(...range.getClientRects());
    }
    for(var r of rects){
      if(r.width<1||r.height<1)continue;
      if(r.bottom<=0||r.top>=ih||r.right<=0||r.left>=vw)continue;
      if(r.left<-2||r.right>vw+2){bad.push({tag:el.tagName.toLowerCase(),cls:String(el.className||'').split(' ')[0],text:el.textContent.trim().replace(/\\s+/g,' ').slice(0,40),left:+r.left.toFixed(1),right:+r.right.toFixed(1)});break;}
    }
  }
  var h=document.querySelector('.lm-hero-v2__title');
  var e=document.querySelector('.lm-hero-v2__eyebrow');
  var hb=h.getBoundingClientRect(),eb=e.getBoundingClientRect();
  return {vw:vw,ih:ih,h1:{fontSize:getComputedStyle(h).fontSize,left:+hb.left.toFixed(1),right:+hb.right.toFixed(1),width:+hb.width.toFixed(1),height:+hb.height.toFixed(1)},
    eyebrow:{fontSize:getComputedStyle(e).fontSize,left:+eb.left.toFixed(1),right:+eb.right.toFixed(1),width:+eb.width.toFixed(1),height:+eb.height.toFixed(1)},
    scrollWidth:document.documentElement.scrollWidth,textClip:bad.length,offenders:bad.slice(0,6)};
})()`;

(async function(){
  const L=await launch();
  try{
    for(const width of [428,390,360]){
      const {targetId}=await L.cdp.send('Target.createTarget',{url:'about:blank'});
      const {sessionId}=await L.cdp.send('Target.attachToTarget',{targetId,flatten:true});
      await L.cdp.send('Page.enable',{},sessionId);
      await L.cdp.send('Runtime.enable',{},sessionId);
      await L.cdp.send('Emulation.setDeviceMetricsOverride',{width,height:926,deviceScaleFactor:3,mobile:true},sessionId);
      await L.cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5},sessionId);
      const t0=Date.now();
      await L.cdp.send('Page.navigate',{url:'http://localhost:8000/index.html'},sessionId);
      let removedAt=null;
      for(let i=0;i<25;i++){
        await sleep(200);
        const gone=await L.cdp.send('Runtime.evaluate',{expression:"!document.getElementById('intro')",returnByValue:true},sessionId);
        if(gone.result.value){removedAt=(Date.now()-t0)/1000;break;}
      }
      await sleep(500);
      const r=await L.cdp.send('Runtime.evaluate',{expression:measure,returnByValue:true},sessionId);
      console.log(width,'introGoneAt='+removedAt,JSON.stringify(r.result.value));
      if(width===428){
        await L.cdp.send('Runtime.evaluate',{expression:"document.querySelector('.lm-hero-v2__title').scrollIntoView({block:'center'});",returnByValue:true},sessionId);
        await sleep(300);
        await L.cdp.send('Runtime.evaluate',{expression:"var s=document.createElement('style');s.id='clip-probe';s.textContent='.lm-hero-v2__title{font-size:130px !important;white-space:nowrap !important;overflow-wrap:normal !important}';document.head.appendChild(s);",returnByValue:true},sessionId);
        await sleep(200);
        const p=await L.cdp.send('Runtime.evaluate',{expression:measure,returnByValue:true},sessionId);
        const pd=await L.cdp.send('Runtime.evaluate',{expression:"(function(){var h=document.querySelector('.lm-hero-v2__title');var n=h.firstChild;var r=document.createRange();r.selectNodeContents(n);var rs=[...r.getClientRects()].map(function(x){return [Math.round(x.left),Math.round(x.right),Math.round(x.width)]});return {fs:getComputedStyle(h).fontSize,ws:getComputedStyle(h).whiteSpace,pos:getComputedStyle(h.parentElement).position,box:h.getBoundingClientRect().toJSON(),scrollW:h.scrollWidth,rects:rs.slice(0,3)};})()",returnByValue:true},sessionId);
        console.log('428 injected-130px probe textClip='+p.result.value.textClip,JSON.stringify(p.result.value.offenders.slice(0,2)),JSON.stringify(pd.result.value));
      }
      await L.cdp.send('Target.closeTarget',{targetId});
    }
  }finally{await L.cleanup();}
})().catch(e=>{console.error(e.stack||e);process.exit(1);});

