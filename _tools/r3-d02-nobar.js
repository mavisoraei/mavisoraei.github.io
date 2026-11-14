'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');
const fs=require('fs');
(async function(){
 const L=await launch();
 try{
  const {targetId}=await L.cdp.send('Target.createTarget',{url:'about:blank'});
  const {sessionId}=await L.cdp.send('Target.attachToTarget',{targetId,flatten:true});
  await L.cdp.send('Page.enable',{},sessionId);await L.cdp.send('Runtime.enable',{},sessionId);
  await L.cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false},sessionId);
  await L.cdp.send('Page.navigate',{url:'http://localhost:8000/laser.html'},sessionId);await sleep(1800);
  await L.cdp.send('Runtime.evaluate',{expression:'scrollTo(0,414)'},sessionId);await sleep(400);
  await L.cdp.send('Runtime.evaluate',{expression:"document.querySelector('.lm-svc-tocbar').style.visibility='hidden'"},sessionId);await sleep(200);
  const shot=await L.cdp.send('Page.captureScreenshot',{format:'png'},sessionId);
  fs.writeFileSync('_tools/reports/d2-laser-nobar.png',Buffer.from(shot.data,'base64'));
  await L.cdp.send('Target.closeTarget',{targetId});
 }finally{await L.cleanup();}
})().catch(e=>{console.error(e);process.exit(1)});
