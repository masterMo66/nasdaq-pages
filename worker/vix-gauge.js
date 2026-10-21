// The dial shows VIX points, not a 0–100 fear/greed score. Dragging is a preview.
function createVixGauge(){
 const svg=document.querySelector('#vix-gauge'),needle=document.querySelector('#vix-needle'),bands=document.querySelector('#vix-bands'),ticks=document.querySelector('#vix-ticks'),value=document.querySelector('#vix-value');
 let actual=0,shown=0,maximum=60,velocity=0,frame=0,last=0,pointer=null,keyTimer=0;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const point=(r,a)=>[200+r*Math.cos(a),205+r*Math.sin(a)];
 function arc(start,end){const a=point(174,start),b=point(174,end),c=point(121,end),d=point(121,start);return `M ${a} A 174 174 0 0 1 ${b} L ${c} A 121 121 0 0 0 ${d} Z`}
 function draw(preview=false){
  const clamped=Math.max(0,Math.min(maximum,shown));
  needle.setAttribute('transform',`rotate(${-90+clamped/maximum*180} 200 205)`);
  value.textContent=shown.toFixed(2);svg.setAttribute('aria-valuenow',clamped.toFixed(2));
  svg.setAttribute('aria-valuetext',preview?`交互预览 ${shown.toFixed(2)}，最新收盘 ${actual.toFixed(2)}`:`最新收盘 ${actual.toFixed(2)}`);
  svg.dataset.preview=String(preview);
  [...bands.children].forEach((p,i)=>p.classList.toggle('is-current',i===Math.min(4,Math.floor(actual/maximum*5))));
 }
 function stop(){cancelAnimationFrame(frame);frame=0;clearTimeout(keyTimer)}
 function restore(){
  stop();pointer=null;svg.classList.remove('is-dragging');velocity=0;last=0;
  if(reduced.matches){shown=actual;draw();return}
  const step=now=>{
   const dt=last?Math.min((now-last)/1000,.032):1/60;last=now;
   velocity+=(-175*(shown-actual)-16*velocity)*dt;shown=Math.max(0,Math.min(maximum,shown+velocity*dt));draw(true);
   if(Math.abs(shown-actual)<.015&&Math.abs(velocity)<.04){shown=actual;draw();frame=0}else frame=requestAnimationFrame(step);
  };frame=requestAnimationFrame(step);
 }
 function move(event){
  const matrix=svg.getScreenCTM();if(!matrix)return;
  const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
  const angle=Math.atan2(Math.min(-.00001,p.y-205),p.x-200);
  shown=(angle+Math.PI)/Math.PI*maximum;draw(true);
 }
 svg.addEventListener('pointerdown',event=>{if(pointer!==null||!event.isPrimary||(event.pointerType==='mouse'&&event.button!==0))return;event.preventDefault();stop();pointer=event.pointerId;svg.setPointerCapture(pointer);svg.classList.add('is-dragging');svg.focus({preventScroll:true});move(event)});
 svg.addEventListener('pointermove',event=>{if(event.pointerId===pointer)move(event)});
 const release=event=>{if(event.pointerId!==pointer)return;restore()};
 svg.addEventListener('pointerup',release);svg.addEventListener('pointercancel',release);svg.addEventListener('lostpointercapture',release);
 svg.addEventListener('keydown',event=>{
  const keys=['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End','Escape'];if(!keys.includes(event.key))return;
  event.preventDefault();stop();if(event.key==='Escape'){restore();return}
  shown=event.key==='Home'?0:event.key==='End'?maximum:Math.max(0,Math.min(maximum,shown+(['ArrowLeft','ArrowDown'].includes(event.key)?-1:1)));
  draw(true);keyTimer=setTimeout(restore,650);
 });
 svg.addEventListener('keyup',event=>{if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End'].includes(event.key))restore()});
 svg.addEventListener('blur',()=>{if(svg.dataset.preview==='true')restore()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();pointer=null;shown=actual;svg.classList.remove('is-dragging');draw()}});
 return {setValue(next){
  stop();pointer=null;svg.classList.remove('is-dragging');actual=next;shown=next;maximum=Math.max(60,Math.ceil(next/12)*12);svg.setAttribute('aria-valuemax',maximum);
  bands.innerHTML=Array.from({length:5},(_,i)=>{const start=Math.PI+i*Math.PI/5+.009,end=Math.PI+(i+1)*Math.PI/5-.009;return `<path d="${arc(start,end)}" class="vix-band band-${i}"/>`}).join('');
  ticks.innerHTML=[0,maximum].map((n,i)=>{const p=point(103,i?0:Math.PI);return `<text x="${p[0]}" y="${p[1]+4}" text-anchor="middle">${n}</text>`}).join('');
  draw();
 }};
}
