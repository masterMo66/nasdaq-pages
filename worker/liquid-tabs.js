// Different edge velocities create a stretched surface with a distance-based waist.
function initLiquidTabs(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('.range,.filter').forEach(group=>{
  const buttons=[...group.children].filter(el=>el.tagName==='BUTTON');if(buttons.length<2)return;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS(svg.namespaceURI,'path');
  svg.classList.add('tab-liquid');svg.setAttribute('aria-hidden','true');svg.append(path);group.prepend(svg);group.classList.add('liquid-tabs');
  let current=null,targetButton=null,frame=0;
  const mix=(a,b,t)=>a+(b-a)*t;
  function draw(shape){
   current=shape;const {left:l,right:q,top:t,height:h,waist:w}=shape,b=t+h,c=t+h/2,m=(l+q)/2,r=Math.min(h/2,(q-l)/2),a=l+r,z=q-r;
   path.setAttribute('d',`M ${a} ${t} C ${mix(a,m,.5)} ${t} ${mix(a,m,.65)} ${c-w/2} ${m} ${c-w/2} C ${mix(m,z,.35)} ${c-w/2} ${mix(m,z,.5)} ${t} ${z} ${t} Q ${q} ${t} ${q} ${t+r} L ${q} ${b-r} Q ${q} ${b} ${z} ${b} C ${mix(z,m,.5)} ${b} ${mix(z,m,.65)} ${c+w/2} ${m} ${c+w/2} C ${mix(m,a,.35)} ${c+w/2} ${mix(m,a,.5)} ${b} ${a} ${b} Q ${l} ${b} ${l} ${b-r} L ${l} ${t+r} Q ${l} ${t} ${a} ${t} Z`);
  }
  function update(animate=true){
   const button=buttons.find(b=>b.classList.contains('selected'));cancelAnimationFrame(frame);
   if(!button){path.setAttribute('d','');current=null;targetButton=null;return}
   const rect=button.getBoundingClientRect(),base=group.getBoundingClientRect(),to={left:rect.left-base.left+group.scrollLeft,right:rect.right-base.left+group.scrollLeft,top:rect.top-base.top,height:rect.height,waist:rect.height};
   svg.setAttribute('viewBox',`0 0 ${group.clientWidth} ${group.clientHeight}`);
   if(!animate||!current||reduced.matches||button===targetButton){targetButton=button;draw(to);return}
   targetButton=button;const from={...current},distance=(to.left+to.right-from.left-from.right)/2,stretch=Math.min(1,Math.abs(distance)/(to.height*5)),duration=440+Math.min(260,Math.abs(distance)*.8),start=performance.now();
   function tick(now){
    const p=Math.min(1,(now-start)/duration),lead=1-(1-p)**3,tail=p*p*(3-2*p),settle=1-(1-p)**4;
    draw({left:mix(from.left,to.left,distance>=0?tail:lead),right:mix(from.right,to.right,distance>=0?lead:tail),top:mix(from.top,to.top,settle),height:mix(from.height,to.height,settle),waist:mix(from.waist,to.waist,settle)*(1-.86*stretch*Math.sin(Math.PI*p))});
    if(p<1)frame=requestAnimationFrame(tick);else draw(to);
   }
   frame=requestAnimationFrame(tick);
  }
  new MutationObserver(()=>update()).observe(group,{subtree:true,attributes:true,attributeFilter:['class']});
  new ResizeObserver(()=>update(false)).observe(group);
  reduced.addEventListener('change',()=>update(false));update(false);
 });
}
initLiquidTabs();
