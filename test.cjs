const assert=require('node:assert/strict');
const G=require('./geometry.js');
assert.deepEqual(G.circleThrough3([{x:765,y:470},{x:815,y:420},{x:865,y:470}]),{x:815,y:470,radius:50});
assert.deepEqual(G.circleThrough3([{x:865,y:470},{x:815,y:420},{x:765,y:470}]),{x:815,y:470,radius:50});
assert.equal(G.circleThrough3([{x:0,y:0},{x:10,y:0},{x:20,y:0}]),null);
assert.equal(G.circleThrough3([{x:0,y:0},{x:10,y:0},{x:20,y:.01}]),null);
assert.equal(G.circleThrough3([{x:0,y:0},{x:0,y:0},{x:20,y:20}]),null);
assert.equal(G.circleThrough3([{x:0,y:0},{x:10,y:0}]),null);
const w=120,h=100,data=new Uint8ClampedArray(w*h*4).fill(255);
for(let y=20;y<70;y++)for(let x=10;x<90;x++){const i=(y*w+x)*4;data[i]=data[i+1]=data[i+2]=30}
const p=G.trace(data,w,h,40,40,160,false,1);
assert.equal(p.length,4);assert.equal(G.area(p),4000);
assert.deepEqual(G.bounds(p),{minX:10,maxX:90,minY:20,maxY:70});
const dxf=G.dxf(p,.2);assert.match(dxf,/AC1009/);assert.match(dxf,/66\r\n1/);assert.match(dxf,/70\r\n1\r\n40\r\n0\r\n41\r\n0/);assert.equal((dxf.match(/\r\nVERTEX\r\n/g)||[]).length,4);assert.match(dxf,/SEQEND/);assert.doesNotMatch(dxf,/LWPOLYLINE|AcDb|INSUNITS|HATCH/);
const lines=dxf.trim().split(/\r?\n/),xs=[],ys=[];for(let i=0;i<lines.length;i+=2){if(lines[i]==='10')xs.push(+lines[i+1]);if(lines[i]==='20')ys.push(+lines[i+1])}assert.equal(Math.max(...xs),16);assert.equal(Math.max(...ys),10);assert.equal(Math.min(...xs),0);assert.equal(Math.min(...ys),0);
assert.throws(()=>G.trace(data,w,h,0,0,160,true,1),/写真の端/);
assert.throws(()=>G.trace(data,w,h,0,0,160,false,1),/一致/);
assert.throws(()=>G.dxf(p,0));assert.throws(()=>G.dxf([{x:0,y:0},{x:1,y:1},{x:2,y:2}],1));
// Interior holes must not replace the exterior contour.
for(let y=35;y<50;y++)for(let x=30;x<50;x++){const i=(y*w+x)*4;data[i]=data[i+1]=data[i+2]=255}
assert.equal(G.area(G.trace(data,w,h,20,30,160,false,1)),4000);
console.log('PASS: contour, dimensions, DXF units/closure, background rejection, holes, invalid input');
