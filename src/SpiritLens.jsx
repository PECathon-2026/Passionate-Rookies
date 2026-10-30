import {useEffect,useRef,useState} from 'react';
import {Activity,CircleHelp,Download,ImagePlus,LoaderCircle,ShieldCheck,Sparkles,Telescope,Upload,X} from 'lucide-react';

const API='/api';
const ACCEPTED_TYPES=['image/jpeg','image/png','image/webp'];

function Eyebrow({children}){return <div className="eyebrow"><span/>{children}</div>}
function Panel({children,className=''}){return <section className={`panel ${className}`}>{children}</section>}
function PageIntro({eyebrow,title,desc}){return <div className="page-intro"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{desc}</p></div>}

async function readApiResponse(response,fallback){
  const body=await response.text();
  if(!body.trim()){
    throw new Error(response.ok?fallback:`Server returned HTTP ${response.status} with an empty response.`);
  }
  let result;
  try{
    result=JSON.parse(body);
  }catch{
    throw new Error(response.ok?'Server returned an invalid response. Check that the backend is running and try again.':`Server returned HTTP ${response.status} with a non-JSON response.`);
  }
  if(!response.ok)throw new Error(typeof result.error==='string'?result.error:fallback);
  return result;
}

export default function SpiritLens(){
  const [file,setFile]=useState(null);
  const [originalUrl,setOriginalUrl]=useState('');
  const [restoredUrl,setRestoredUrl]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [zoom,setZoom]=useState(1);
  const [view,setView]=useState('original');
  const [outputInfo,setOutputInfo]=useState(null);
  const input=useRef(null);

  useEffect(()=>()=>{if(originalUrl)URL.revokeObjectURL(originalUrl)},[originalUrl]);
  useEffect(()=>()=>{if(restoredUrl)URL.revokeObjectURL(restoredUrl)},[restoredUrl]);

  function choose(nextFile){
    if(!nextFile||busy)return;
    if(!ACCEPTED_TYPES.includes(nextFile.type)){
      setMessage('Choose a JPG, PNG, or WEBP image.');
      return;
    }
    if(nextFile.size>12*1024*1024){
      setMessage('Image must be smaller than 12 MB.');
      return;
    }
    setFile(nextFile);
    setOriginalUrl(URL.createObjectURL(nextFile));
    setRestoredUrl('');
    setOutputInfo(null);
    setView('original');
    setMessage('Original loaded. OpenAI will process a separate copy; your original stays unchanged.');
  }

  function clearImage(){
    if(busy)return;
    setFile(null);
    setOriginalUrl('');
    setRestoredUrl('');
    setOutputInfo(null);
    setMessage('');
    setView('original');
    if(input.current)input.current.value='';
  }

  async function uploadOriginal(){
    if(!file)return;
    setBusy(true);
    setMessage('Saving the original image…');
    try{
      const form=new FormData();
      form.append('image',file);
      const response=await fetch(`${API}/images`,{method:'POST',body:form});
      const result=await readApiResponse(response,'Could not save the original image.');
      setMessage('Original image saved on this server.');
    }catch(error){
      setMessage(error.message||'Backend unavailable. Start the server first.');
    }finally{
      setBusy(false);
    }
  }

  async function restoreWithOpenAI(){
    if(!file||busy)return;
    setBusy(true);
    setMessage('Sending a copy of this image to OpenAI for cloud processing…');
    try{
      const form=new FormData();
      form.append('image',file);
      const response=await fetch(`${API}/openai/restore`,{method:'POST',body:form});
      const result=await readApiResponse(response,'OpenAI image restoration failed.');
      if(!result.image?.data||!result.image?.mimeType)throw new Error('OpenAI did not return an image. Try again.');
      const bytes=Uint8Array.from(atob(result.image.data),character=>character.charCodeAt(0));
      const blob=new Blob([bytes],{type:result.image.mimeType});
      setRestoredUrl(URL.createObjectURL(blob));
      setOutputInfo({model:result.model,mimeType:result.image.mimeType});
      setView('restored');
      setMessage('OpenAI cloud edit complete. Review carefully: generative processing can alter stars or other details.');
    }catch(error){
      setMessage(error.message||'OpenAI image restoration failed. Check the server and try again.');
    }finally{
      setBusy(false);
    }
  }

  const shownImage=view==='restored'&&restoredUrl?restoredUrl:originalUrl;
  const previewExtension=outputInfo?.mimeType?.split('/')[1]==='jpeg'?'jpg':outputInfo?.mimeType?.split('/')[1]||'png';

  return <>
    <PageIntro eyebrow="THE SPIRIT LENS · 03" title={<>See through the <em>mist.</em></>} desc="Send a copy of your image to OpenAI for cloud restoration. Compare the edited preview with your untouched original, then download it."/>
    <div className="lens-grid">
      <Panel>
        <div className="panel-heading">
          <div><Eyebrow>IMAGE CHAMBER</Eyebrow><h3>Offer an image to the lens</h3></div>
          <ImagePlus/>
        </div>
        <div className={`dropzone ${originalUrl?'loaded':''}`} role="button" aria-disabled={busy} tabIndex="0" onClick={()=>!busy&&input.current?.click()} onKeyDown={event=>!busy&&event.key==='Enter'&&input.current?.click()} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();choose(event.dataTransfer.files?.[0])}}>
          <input ref={input} hidden disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>choose(event.target.files?.[0])}/>
          {originalUrl?<img src={originalUrl} alt="Selected original image"/>:<><Upload size={27}/><b>Drop your image into the chamber</b><span>or browse from your device</span><small>JPG · PNG · WEBP · UP TO 12 MB</small></>}
        </div>
        {file&&<div className="file-row"><span>IMG</span><div><b>{file.name}</b><small>{(file.size/1048576).toFixed(2)} MB · original preserved</small></div><button className="icon-btn" disabled={busy} onClick={clearImage} aria-label="Remove image"><X size={16}/></button></div>}
        <div className="action-row">
          <button className="btn primary" disabled={!file||busy} onClick={restoreWithOpenAI}>{busy?<><LoaderCircle size={15} className="restore-spinner"/> Sending to OpenAI…</>:<><Sparkles size={15}/> Restore with OpenAI</>}</button>
          <button className="btn ghost" disabled={!file||busy} onClick={uploadOriginal}><Upload size={15}/> Save original</button>
        </div>
        {message&&<div className="notice"><CircleHelp size={15}/>{message}</div>}
        <div className="truth"><ShieldCheck size={17}/><span><b>Original stays intact.</b> OpenAI receives a copy of the image for cloud processing. Generative edits may change stars or other details. This app does not save images sent for restoration.</span></div>
      </Panel>
      <Panel>
        <div className="panel-heading">
          <div><Eyebrow>DOJO VIEWFINDER</Eyebrow><h3>{view==='restored'?'Restored preview':'Image inspection'}</h3></div>
          <div className="zoom"><button onClick={()=>setZoom(value=>Math.max(.6,value-.1))} aria-label="Zoom out">−</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(value=>Math.min(2,value+.1))} aria-label="Zoom in">+</button></div>
        </div>
        <div className="image-stage">
          {shownImage?<img style={{transform:`scale(${zoom})`}} src={shownImage} alt={view==='restored'?'AI restored preview':'Original image'}/>:<div className="stage-placeholder"><div className="stage-stars">✦　·　✧　　·　✦</div><Telescope size={36}/><b>Your image will appear here.</b><span>Upload an image to inspect and restore.</span></div>}
          <span className="image-tag">{view==='restored'?'OPENAI CLOUD EDIT':originalUrl?'ORIGINAL IMAGE':'VIEWFINDER'}</span>
        </div>
        {restoredUrl&&<div className="restore-view-controls"><div className="restore-tabs" role="group" aria-label="Compare original and restored image"><button className={view==='original'?'active':''} onClick={()=>setView('original')}>Original</button><button className={view==='restored'?'active':''} onClick={()=>setView('restored')}>OpenAI edit</button></div><a className="text-link" href={restoredUrl} download={`${file?.name?.replace(/\.[^.]+$/,'')||'image'}-openai.${previewExtension}`}><Download size={14}/> Download preview</a></div>}
        <div className="analysis-list">
          <div><span>IMAGE FILE</span><b>{file?file.type:'Waiting for upload'}</b></div>
          <div><span>RESTORATION MODEL</span><b>{outputInfo?.model||'OpenAI image model'}</b></div>
          <div><span>PROCESSING</span><b>Generative cloud edit · not a measured denoise blend</b></div>
        </div>
        <div className="restore-disclosure"><Activity size={15}/><span>OpenAI image editing is generative and may invent or remove astronomical details. Do not use its edited output for scientific measurements.</span></div>
      </Panel>
    </div>
  </>;
}
