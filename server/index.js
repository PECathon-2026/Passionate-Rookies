import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
dotenv.config();
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express(), port=process.env.PORT||8787;
const openaiApiKey=process.env.OPENAI_API_KEY;
const openaiModel='gpt-image-1';
const openaiLimits=new Map();
const OPENAI_LIMIT_WINDOW_MS=10*60*1000, OPENAI_MAX_REQUESTS=10;
const dataDir=path.join(__dirname,'data'), uploadDir=path.join(dataDir,'uploads');
fs.mkdirSync(uploadDir,{recursive:true});
const db=new Database(path.join(dataDir,'tsukuyomi.db')); db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS observations(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,event_type TEXT NOT NULL,observed_at TEXT NOT NULL,notes TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
const storage=multer.diskStorage({destination:(_req,_file,cb)=>cb(null,uploadDir),filename:(_req,file,cb)=>cb(null,`${Date.now()}-${Math.random().toString(36).slice(2,9)}${path.extname(file.originalname).toLowerCase()}`)});
const upload=multer({storage,limits:{fileSize:12*1024*1024},fileFilter:(_req,file,cb)=>{const ok=['image/jpeg','image/png','image/webp','image/tiff'].includes(file.mimetype);cb(ok?null:new Error('Upload a JPG, PNG, WEBP or TIFF image.'),ok);}});
const aiImageUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:12*1024*1024},fileFilter:(_req,file,cb)=>{const ok=['image/jpeg','image/png','image/webp'].includes(file.mimetype);cb(ok?null:new Error('OpenAI accepts JPG, PNG or WEBP images.'),ok);}});
app.use(cors()); app.use(express.json({limit:'1mb'}));
app.get('/api/health',(_req,res)=>res.json({status:'ok',database:'connected',engine:'sqlite',openaiConfigured:!!openaiApiKey}));
app.get('/api/apod',async(_req,res)=>{try{const key=process.env.NASA_API_KEY||'DEMO_KEY';const r=await fetch(`https://api.nasa.gov/planetary/apod?api_key=${key}`);if(!r.ok)throw new Error();res.json(await r.json());}catch{res.status(502).json({error:'NASA APOD is temporarily unavailable.'});}});
app.get('/api/events',async(_req,res)=>{try{const key=process.env.NASA_API_KEY||'DEMO_KEY';const start=new Date().toISOString().slice(0,10),end=new Date(Date.now()+6*86400000).toISOString().slice(0,10);const r=await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${start}&end_date=${end}&api_key=${key}`);if(!r.ok)throw new Error();const d=await r.json();const events=Object.values(d.near_earth_objects||{}).flat().map(x=>({id:x.id,title:x.name,type:'Near-Earth object',date:x.close_approach_data?.[0]?.close_approach_date||start,detail:`Maximum estimated diameter: ${Math.round(x.estimated_diameter?.meters?.estimated_diameter_max||0)} m`,hazard:!!x.is_potentially_hazardous_asteroid}));res.json({source:'NASA NEO API',events});}catch{res.status(502).json({error:'NASA event feed unavailable. Check connection or API quota.'});}});
app.get('/api/observations',(_req,res)=>res.json(db.prepare('SELECT * FROM observations ORDER BY observed_at DESC,id DESC LIMIT 100').all()));
app.post('/api/observations',(req,res)=>{const {title,event_type,observed_at,notes=''}=req.body||{};if(!title||!event_type||!observed_at)return res.status(400).json({error:'title, event_type and observed_at are required'});const result=db.prepare('INSERT INTO observations(title,event_type,observed_at,notes) VALUES(?,?,?,?)').run(String(title).slice(0,120),String(event_type).slice(0,60),String(observed_at).slice(0,40),String(notes).slice(0,1000));res.status(201).json(db.prepare('SELECT * FROM observations WHERE id=?').get(result.lastInsertRowid));});
app.post('/api/openai/restore',(req,res,next)=>{
  const now=Date.now();
  for(const [ip,limit] of openaiLimits)if(limit.resetAt<=now)openaiLimits.delete(ip);
  const ip=req.ip;
  const limit=openaiLimits.get(ip);
  if(limit&&limit.count>=OPENAI_MAX_REQUESTS){res.set('Retry-After',String(Math.ceil((limit.resetAt-now)/1000)));return res.status(429).json({error:'OpenAI request limit reached. Try again later.'});}
  openaiLimits.set(ip,limit?{...limit,count:limit.count+1}:{count:1,resetAt:now+OPENAI_LIMIT_WINDOW_MS});
  aiImageUpload.single('image')(req,res,async(error)=>{
    if(error)return next(error);
    if(!openaiApiKey)return res.status(503).json({error:'OpenAI is not configured. Add OPENAI_API_KEY to the server .env file and restart the server.'});
    if(!req.file)return res.status(400).json({error:'Choose a JPG, PNG or WEBP image first.'});
    try{
      const requestBody=new FormData();
      requestBody.append('model',openaiModel);
      requestBody.append('prompt','Carefully reduce visible image noise in this astronomy photograph while preserving its original composition, colors, stars, and all visible details. Do not add, remove, invent, or reposition stars or other objects. Return only the edited image.');
      requestBody.append('output_format','png');
      requestBody.append('image',new Blob([req.file.buffer],{type:req.file.mimetype}),req.file.originalname);
      const response=await fetch('https://api.openai.com/v1/images/edits',{
        method:'POST',
        headers:{Authorization:`Bearer ${openaiApiKey}`},
        body:requestBody,
      });
      const body=await response.json().catch(()=>null);
      if(!response.ok){
        const status=response.status;
        const providerMessage=String(body?.error?.message||`OpenAI returned HTTP ${status}.`);
        const safeMessage=openaiApiKey?providerMessage.replaceAll(openaiApiKey,'[redacted]'):providerMessage;
        console.error(`OpenAI image restoration failed (HTTP ${status}): ${safeMessage.slice(0,500)}`);
        let message='OpenAI image restoration failed. Check the server terminal for a sanitized provider error.';
        if(status===401)message='OpenAI rejected the API key. Check that OPENAI_API_KEY is valid and enabled.';
        else if(status===403)message='This OpenAI project does not have permission to use image generation.';
        else if(status===429)message='OpenAI rate limit or usage quota exceeded. Check your project limits, usage and billing.';
        else if(status===400)message='OpenAI rejected the image request. Check the image format and server terminal for details.';
        return res.status(502).json({error:message});
      }
      const imageData=body?.data?.[0]?.b64_json;
      if(!imageData)return res.status(502).json({error:'OpenAI did not return an edited image. Try again.'});
      res.json({image:{data:imageData,mimeType:'image/png'},model:openaiModel});
    }catch(error){
      const providerMessage=String(error?.message||error?.name||'Unknown provider error');
      const safeMessage=openaiApiKey?providerMessage.replaceAll(openaiApiKey,'[redacted]'):providerMessage;
      console.error(`OpenAI image restoration failed: ${safeMessage.slice(0,500)}`);
      res.status(502).json({error:'Could not connect to OpenAI image restoration. Check the server connection and try again.'});
    }
  });
});
app.post('/api/images',upload.single('image'),(req,res)=>{if(!req.file)return res.status(400).json({error:'Choose an image first.'});res.status(201).json({id:req.file.filename,originalName:req.file.originalname,mimeType:req.file.mimetype,size:req.file.size,message:'Original image stored on this server.'});});
app.use((err,_req,res,_next)=>res.status(400).json({error:err.message||'Request failed'}));
app.listen(port,'0.0.0.0',()=>console.log(`Tsukuyomi API listening on http://localhost:${port}`));