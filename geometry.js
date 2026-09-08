(function(root){
function circleThrough3(p){
 if(p.length!==3||p.some(v=>!Number.isFinite(v.x)||!Number.isFinite(v.y)))return null;
 const [a,b,c]=p,u={x:b.x-a.x,y:b.y-a.y},v={x:c.x-a.x,y:c.y-a.y};
 const l=u.x*u.x+u.y*u.y,m=v.x*v.x+v.y*v.y,n=(b.x-c.x)**2+(b.y-c.y)**2,cross=u.x*v.y-u.y*v.x;
 // Reject clustered or almost collinear picks, which make calibration unstable.
 if(Math.min(l,m,n)<25||Math.abs(cross)/Math.max(l,m,n)<.02)return null;
 const x=(l*v.y-m*u.y)/(2*cross),y=(u.x*m-v.x*l)/(2*cross),radius=Math.hypot(x,y);
 return Number.isFinite(radius)&&radius>0?{x:a.x+x,y:a.y+y,radius}:null;
}
function area(p){return Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.y-b.x*a.y},0)/2)}
function simplify(p,t){if(p.length<3)return p;const a=p[0],b=p[p.length-1],dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy;let max=0,k=0;for(let i=1;i<p.length-1;i++){const v=p[i],u=d?Math.max(0,Math.min(1,((v.x-a.x)*dx+(v.y-a.y)*dy)/d)):0;const e=Math.hypot(v.x-a.x-u*dx,v.y-a.y-u*dy);if(e>max){max=e;k=i}}return max>t?simplify(p.slice(0,k+1),t).slice(0,-1).concat(simplify(p.slice(k),t)):[a,b]}
function trace(data,w,h,sx,sy,threshold,light,tolerance){
 const mask=new Uint8Array(w*h),q=new Int32Array(w*h);const valid=i=>{const j=i*4,l=.299*data[j]+.587*data[j+1]+.114*data[j+2];return data[j+3]>0&&(light?l>threshold:l<threshold)};
 sx=Math.floor(sx);sy=Math.floor(sy);if(sx<0||sy<0||sx>=w||sy>=h||!valid(sy*w+sx))throw Error('選んだ点が対象の明暗に一致しません。明暗の境界・対象の明るさを調整してください。');
 let head=0,tail=1,touches=false;q[0]=sy*w+sx;mask[q[0]]=1;
 while(head<tail){const i=q[head++],x=i%w,y=Math.floor(i/w);if(x===0||y===0||x===w-1||y===h-1)touches=true;for(const n of [x>0?i-1:-1,x<w-1?i+1:-1,y>0?i-w:-1,y<h-1?i+w:-1])if(n>=0&&!mask[n]&&valid(n)){mask[n]=1;q[tail++]=n}}
 if(touches)throw Error('領域が写真の端までつながっています。背景を選んでいないか、境界値を確認してください。');if(tail<16)throw Error('領域が小さすぎます。対象の別の場所をクリックしてください。');
 const edges=new Map(),key=(x,y)=>y*(w+1)+x;const add=(x,y,X,Y)=>{const a=key(x,y);if(!edges.has(a))edges.set(a,[]);edges.get(a).push(key(X,Y))};
 for(let j=0;j<tail;j++){const i=q[j],x=i%w,y=Math.floor(i/w);if(!mask[i-w])add(x,y,x+1,y);if(!mask[i+1])add(x+1,y,x+1,y+1);if(!mask[i+w])add(x+1,y+1,x,y+1);if(!mask[i-1])add(x,y+1,x,y)}
 let best=[];while(edges.size){const start=edges.keys().next().value;let cur=start,p=[];do{p.push({x:cur%(w+1),y:Math.floor(cur/(w+1))});const next=edges.get(cur);if(!next)break;const n=next.pop();if(!next.length)edges.delete(cur);cur=n}while(cur!==start);if(area(p)>area(best))best=p}
 const closed=best.concat([best[0]]);const reduced=simplify(closed,tolerance).slice(0,-1);const result=reduced.filter((b,i)=>{const a=reduced[(i+reduced.length-1)%reduced.length],c=reduced[(i+1)%reduced.length];return Math.abs((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x))>1e-8});if(result.length<3)throw Error('輪郭を抽出できませんでした。簡略化を細かくしてください。');return result;
}
function bounds(p){const xs=p.map(v=>v.x),ys=p.map(v=>v.y);return {minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)}}
function dxf(p,scale){
 if(p.length<3||p.some(v=>!Number.isFinite(v.x)||!Number.isFinite(v.y))||!Number.isFinite(scale)||scale<=0||area(p)<.01)throw Error('縮尺と有効な閉じた輪郭が必要です。');
 const b=bounds(p),vertices=p.map(v=>({x:(v.x-b.minX)*scale,y:(b.maxY-v.y)*scale}));
 if(vertices.some(v=>!Number.isFinite(v.x)||!Number.isFinite(v.y)))throw Error('寸法が大きすぎます。縮尺を確認してください。');
 const lines=[999,'KATADORI - coordinates in millimeters',0,'SECTION',2,'HEADER',9,'$ACADVER',1,'AC1009',9,'$LUNITS',70,2,9,'$LUPREC',70,6,0,'ENDSEC',
 0,'SECTION',2,'TABLES',0,'TABLE',2,'LTYPE',70,1,0,'LTYPE',2,'CONTINUOUS',70,0,3,'Solid line',72,65,73,0,40,0,0,'ENDTAB',
 0,'TABLE',2,'LAYER',70,1,0,'LAYER',2,'0',70,0,62,7,6,'CONTINUOUS',0,'ENDTAB',0,'ENDSEC',
 0,'SECTION',2,'BLOCKS',0,'ENDSEC',0,'SECTION',2,'ENTITIES',
 0,'POLYLINE',8,'0',62,7,66,1,10,0,20,0,30,0,70,1,40,0,41,0];
 for(const v of vertices)lines.push(0,'VERTEX',8,'0',10,v.x.toFixed(6),20,v.y.toFixed(6),30,0,70,0);
 lines.push(0,'SEQEND',8,'0',0,'ENDSEC',0,'EOF');
 return lines.join('\r\n')+'\r\n';
}
 const api={area,simplify,trace,bounds,dxf,circleThrough3};if(typeof module!=='undefined')module.exports=api;else root.Geometry=api;
})(globalThis);

