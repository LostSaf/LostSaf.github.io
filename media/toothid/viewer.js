(function(){
"use strict";
const CACHE=new Map();
function rawTriangles(buf){
 const dv=new DataView(buf);let pos=[];let binary=false,n=0;
 if(buf.byteLength>=84){n=dv.getUint32(80,true);binary=(84+n*50===buf.byteLength)}
 if(binary){let o=84;for(let i=0;i<n;i++,o+=50){for(let v=0;v<3;v++){let q=o+12+v*12;pos.push(dv.getFloat32(q,true),dv.getFloat32(q+4,true),dv.getFloat32(q+8,true))}}}
 else{let txt=new TextDecoder().decode(buf),re=/vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g,m;while((m=re.exec(txt)))pos.push(+m[1],+m[2],+m[3])}
 if(!pos.length||pos.length%9)throw Error("invalid STL triangle data");
 return pos;
}
function prepare(buf){
 const p=rawTriangles(buf),triCount=p.length/9;
 let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<p.length;i+=3){for(let j=0;j<3;j++){min[j]=Math.min(min[j],p[i+j]);max[j]=Math.max(max[j],p[i+j])}}
 const ctr=min.map((v,j)=>(v+max[j])/2),span=Math.max(...max.map((v,j)=>v-min[j]))||1;
 const maxTris=14000,step=Math.max(1,Math.ceil(triCount/maxTris));
 let tris=[];
 for(let ti=0;ti<triCount;ti+=step){let i=ti*9;
  let a=[(p[i]-ctr[0])/span,(p[i+1]-ctr[1])/span,(p[i+2]-ctr[2])/span];
  let b=[(p[i+3]-ctr[0])/span,(p[i+4]-ctr[1])/span,(p[i+5]-ctr[2])/span];
  let c=[(p[i+6]-ctr[0])/span,(p[i+7]-ctr[1])/span,(p[i+8]-ctr[2])/span];
  let ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.hypot(nx,ny,nz)||1;
  tris.push({a,b,c,n:[nx/l,ny/l,nz/l]});
 }
 return {tris,originalTriangles:triCount,displayTriangles:tris.length};
}
async function meshFor(url){
 if(!CACHE.has(url))CACHE.set(url,(async()=>{let r=await fetch(url,{cache:"force-cache"});if(!r.ok)throw Error(`HTTP ${r.status} while loading ${url}`);return prepare(await r.arrayBuffer())})());
 return CACHE.get(url);
}
function rotPoint(p,rx,ry){
 let cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry);
 let y=p[1]*cx-p[2]*sx,z=p[1]*sx+p[2]*cx,x=p[0];
 return [x*cy+z*sy,y,-x*sy+z*cy];
}
function shade(n,rx,ry){
 let r=rotPoint(n,rx,ry),l=[.42,.68,.72],d=Math.max(0,r[0]*l[0]+r[1]*l[1]+r[2]*l[2]);
 let v=Math.round(174+62*d);return `rgb(${Math.min(250,v+18)},${Math.min(242,v+8)},${Math.max(150,v-26)})`;
}
class ToothViewer{
 constructor(canvas,url,angles=[0,0]){
  this.canvas=canvas;this.url=url;this.ry=angles[0]||0;this.rx=angles[1]||0;this.zoom=1;this.drag=false;this.last=[0,0];this.mesh=null;this.raf=0;
  this.help=canvas.nextElementSibling;if(this.help)this.help.textContent="Loading real tooth model…";
  this.events();this.init();
 }
 async init(){
  try{this.mesh=await meshFor(this.url);this.schedule();if(this.help)this.help.textContent=`Drag to rotate · wheel/pinch to zoom · software renderer · ${this.mesh.originalTriangles.toLocaleString()} source triangles`;}
  catch(e){this.fail(e.message||String(e))}
 }
 fail(msg){
  this.canvas.style.display="none";let d=document.createElement("div");d.className="loading";d.innerHTML=`<b>Tooth model could not be displayed.</b><br>${msg}`;this.canvas.parentNode.insertBefore(d,this.canvas.nextSibling);if(this.help)this.help.textContent="Model error: see message above.";
 }
 events(){
  let pt=e=>[e.clientX,e.clientY];
  this.canvas.addEventListener("pointerdown",e=>{this.drag=true;this.last=pt(e);this.canvas.setPointerCapture(e.pointerId)});
  this.canvas.addEventListener("pointermove",e=>{if(!this.drag)return;let q=pt(e);this.ry+=(q[0]-this.last[0])*.012;this.rx+=(q[1]-this.last[1])*.012;this.rx=Math.max(-1.5,Math.min(1.5,this.rx));this.last=q;this.schedule()});
  this.canvas.addEventListener("pointerup",()=>{this.drag=false;this.schedule()});this.canvas.addEventListener("pointercancel",()=>this.drag=false);
  this.canvas.addEventListener("wheel",e=>{e.preventDefault();this.zoom*=Math.exp(-e.deltaY*.001);this.zoom=Math.max(.55,Math.min(2.4,this.zoom));this.schedule()},{passive:false});
  if(window.ResizeObserver)new ResizeObserver(()=>this.schedule()).observe(this.canvas);else window.addEventListener("resize",()=>this.schedule());
 }
 schedule(){if(this.raf)return;this.raf=requestAnimationFrame(()=>{this.raf=0;this.draw()})}
 draw(){
  if(!this.mesh)return;let c=this.canvas,ctx=c.getContext("2d"),d=Math.min(devicePixelRatio||1,1.5),w=Math.max(50,Math.floor(c.clientWidth*d)),h=Math.max(50,Math.floor(c.clientHeight*d));
  if(c.width!==w||c.height!==h){c.width=w;c.height=h}ctx.fillStyle="#f1f7f8";ctx.fillRect(0,0,w,h);
  let scale=Math.min(w,h)*.72*this.zoom,ox=w/2,oy=h/2;let list=[];
  for(const t of this.mesh.tris){let a=rotPoint(t.a,this.rx,this.ry),b=rotPoint(t.b,this.rx,this.ry),cc=rotPoint(t.c,this.rx,this.ry);list.push({a:[ox+a[0]*scale,oy-a[1]*scale],b:[ox+b[0]*scale,oy-b[1]*scale],c:[ox+cc[0]*scale,oy-cc[1]*scale],z:(a[2]+b[2]+cc[2])/3,color:shade(t.n,this.rx,this.ry)})}
  list.sort((u,v)=>u.z-v.z);ctx.lineWidth=.25*d;
  for(const t of list){ctx.beginPath();ctx.moveTo(t.a[0],t.a[1]);ctx.lineTo(t.b[0],t.b[1]);ctx.lineTo(t.c[0],t.c[1]);ctx.closePath();ctx.fillStyle=t.color;ctx.fill();ctx.strokeStyle="rgba(125,108,76,.16)";ctx.stroke()}
 }
}
window.ToothViewer=ToothViewer;
})();
