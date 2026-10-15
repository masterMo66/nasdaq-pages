import http from 'node:http';
import {readFile} from 'node:fs/promises';
const allowed=new Set(['index.html','snapshot.json','calendar.json']);
http.createServer(async(req,res)=>{const p=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!allowed.has(p)){res.writeHead(404);res.end();return}try{const b=await readFile('dist/'+p);res.writeHead(200,{'Content-Type':p.endsWith('.json')?'application/json':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(b)}catch{res.writeHead(404);res.end()}}).listen(4174,'127.0.0.1',()=>console.log('http://127.0.0.1:4174'));
