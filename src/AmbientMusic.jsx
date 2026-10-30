import {useEffect,useRef,useState} from 'react';
import {Volume2,VolumeX} from 'lucide-react';

const melody=[587.33,493.88,440,369.99,440,659.25,587.33,329.63];

function addSoftReverb(context,input){
  const convolver=context.createConvolver();
  const seconds=4.5;
  const impulse=context.createBuffer(2,Math.floor(context.sampleRate*seconds),context.sampleRate);
  for(let channel=0;channel<impulse.numberOfChannels;channel++){
    const data=impulse.getChannelData(channel);
    for(let i=0;i<data.length;i++){
      const decay=Math.pow(1-i/data.length,3.2);
      data[i]=(Math.random()*2-1)*decay;
    }
  }
  convolver.buffer=impulse;
  const dry=context.createGain();dry.gain.value=.78;
  const wet=context.createGain();wet.gain.value=.18;
  input.connect(dry);dry.connect(context.destination);
  input.connect(convolver);convolver.connect(wet);wet.connect(context.destination);
}

function playBell(context,output,frequency){
  const start=context.currentTime+.12;
  const volume=context.createGain();
  volume.gain.setValueAtTime(.0001,start);
  volume.gain.exponentialRampToValueAtTime(.055,start+1.45);
  volume.gain.exponentialRampToValueAtTime(.0001,start+7.2);
  volume.connect(output);
  const fundamental=context.createOscillator();
  fundamental.type='sine';fundamental.frequency.value=frequency;fundamental.connect(volume);
  const overtone=context.createOscillator();
  const overtoneGain=context.createGain();
  overtone.type='sine';overtone.frequency.value=frequency*2.01;overtoneGain.gain.value=.16;
  overtone.connect(overtoneGain);overtoneGain.connect(volume);
  fundamental.start(start);overtone.start(start);
  fundamental.stop(start+7.4);overtone.stop(start+7.4);
}

function createAmbientEngine(){
  const AudioContext=window.AudioContext||window.webkitAudioContext;
  if(!AudioContext)return null;
  const context=new AudioContext();
  const master=context.createGain();master.gain.value=0;
  const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1550;filter.Q.value=.25;
  master.connect(filter);addSoftReverb(context,filter);
  const pad=[73.42,110,146.83,185,220];
  const padVoices=pad.map((frequency,index)=>{
    const oscillator=context.createOscillator(),volume=context.createGain();
    oscillator.type='sine';oscillator.frequency.value=frequency;oscillator.detune.value=index%2===0?-2:2;
    volume.gain.value=index===0?.018:.011;
    oscillator.connect(volume);volume.connect(master);oscillator.start();
    return oscillator;
  });
  return {context,master,padVoices,timer:null,note:0};
}

export default function AmbientMusic(){
  const engineRef=useRef(null);
  const [enabled,setEnabled]=useState(false);

  useEffect(()=>()=>{
    const engine=engineRef.current;
    if(!engine)return;
    window.clearInterval(engine.timer);
    engine.master.gain.setTargetAtTime(0,engine.context.currentTime,.2);
    engine.context.close();
  },[]);

  async function toggle(){
    let engine=engineRef.current;
    if(enabled){
      window.clearInterval(engine?.timer);
      if(engine)engine.master.gain.setTargetAtTime(0,engine.context.currentTime,1.5);
      setEnabled(false);
      return;
    }
    engine=engine||createAmbientEngine();
    if(!engine)return;
    engineRef.current=engine;
    await engine.context.resume();
    engine.master.gain.setTargetAtTime(.5,engine.context.currentTime,3.2);
    playBell(engine.context,engine.master,melody[engine.note++%melody.length]);
    engine.timer=window.setInterval(()=>{
      if(engine.context.state==='running')playBell(engine.context,engine.master,melody[engine.note++%melody.length]);
    },7600);
    setEnabled(true);
  }

  return <button
    type="button"
    className={`ambient-toggle ${enabled?'is-on':''}`}
    onClick={toggle}
    aria-label={enabled?'Turn calm background music off':'Turn calm background music on'}
    aria-pressed={enabled}
    title={enabled?'Turn ambience off':'Play calm ambient sound'}
  >
    {enabled?<Volume2 size={15}/>:<VolumeX size={15}/>}
    <span>{enabled?'SOUND ON':'SOUND OFF'}</span>
  </button>;
}
