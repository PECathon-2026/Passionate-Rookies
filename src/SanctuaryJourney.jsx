import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {NavLink} from 'react-router-dom';
import {Activity,ArrowDown,ArrowUpRight,CalendarDays,Camera,Compass} from 'lucide-react';
import carinaNebulaImage from './assets/nasa-carina-nebula.jpg';
import perseidShowerImage from './assets/nasa-perseid-shower.jpg';
import galaxyImage from './assets/nasa-hubble-galaxies.jpg';

const CosmicScene=lazy(()=>import('./CosmicScene.jsx'));

const chapters=[
  {to:'/watchtower',number:'01',kanji:'流星',title:'The Meteor Passage',destination:'Watchtower',description:'Get live cloud cover, humidity, and visibility before you head out.',icon:Compass},
  {to:'/scroll',number:'02',kanji:'地球',title:'Earth & Moon',destination:'Celestial Scroll',description:'Follow lunar phases, sky events, NASA near-Earth objects, and your observing journal.',icon:CalendarDays},
  {to:'/spirit-lens',number:'03',kanji:'銀河',title:'The Milky Way',destination:'Spirit Lens',description:'Upload, zoom, and inspect astronomy images while keeping the original intact.',icon:Camera},
  {to:'/dojo',number:'04',kanji:'星雲',title:'The Nebula',destination:'Dojo Dashboard',description:'View observatory status, saved observations, and NASA’s daily image.',icon:Activity},
];

function JourneyChapter({chapter}){
  const Icon=chapter.icon;
  return <article className="journey-chapter" key={chapter.number}>
    <div className="journey-chapter-top"><span>{chapter.kanji}</span><small>REQUIREMENT {chapter.number} / 04</small></div>
    <div className="journey-chapter-title">{chapter.title}</div>
    <h2>{chapter.destination}</h2>
    <p>{chapter.description}</p>
    <NavLink to={chapter.to} className="chapter-enter"><Icon size={15}/><span>Open {chapter.destination}</span><ArrowUpRight size={15}/></NavLink>
  </article>;
}

export default function SanctuaryJourney(){
  const journeyRef=useRef(null);
  const progressRef=useRef(0);
  const previousStageRef=useRef(-2);
  const [activeStage,setActiveStage]=useState(-1);

  useEffect(()=>{
    const journey=journeyRef.current;
    if(!journey)return;
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reducedMotion){
      journey.classList.add('motion-static');
      return;
    }

    let frame=0;
    const update=()=>{
      frame=0;
      const stage=journey.querySelector('.journey-stage');
      if(!stage)return;
      const travel=Math.max(1,journey.offsetHeight-stage.offsetHeight);
      const progress=Math.max(0,Math.min(1,-journey.getBoundingClientRect().top/travel));
      const next=progress<.14?-1:Math.min(3,Math.floor((progress-.14)/.215));
      const drift=progress-0.5;
      progressRef.current=progress;
      journey.style.setProperty('--star-x',`${(-progress*132).toFixed(2)}px`);
      journey.style.setProperty('--star-y',`${(progress*86).toFixed(2)}px`);
      journey.style.setProperty('--backdrop-x',`${(-progress*148).toFixed(2)}px`);
      journey.style.setProperty('--backdrop-y',`${(progress*94).toFixed(2)}px`);
      journey.style.setProperty('--backdrop-scale',(1.035+progress*.31).toFixed(4));
      journey.style.setProperty('--halo-x',`${(drift*-105).toFixed(2)}px`);
      journey.style.setProperty('--halo-y',`${(drift*58).toFixed(2)}px`);
      journey.style.setProperty('--entry-opacity',Math.max(0,1-progress*8).toFixed(4));
      journey.style.setProperty('--space-exit',Math.max(0,Math.min(1,(progress-.84)/.16)).toFixed(4));
      if(next!==previousStageRef.current){
        previousStageRef.current=next;
        setActiveStage(next);
      }
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
    const sizeObserver=typeof ResizeObserver!=='undefined'?new ResizeObserver(schedule):null;
    sizeObserver?.observe(journey);
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    update();
    return()=>{
      if(frame)cancelAnimationFrame(frame);
      sizeObserver?.disconnect();
      window.removeEventListener('scroll',schedule);
      window.removeEventListener('resize',schedule);
    };
  },[]);

  return <section className="sanctuary-journey" ref={journeyRef} aria-label="A journey through the night sky">
    <div className={`journey-stage stage-current-${activeStage+1}`}>
      <img className="journey-web-backdrop backdrop-carina" src={carinaNebulaImage} alt="" aria-hidden="true"/>
      <img className="journey-web-backdrop backdrop-meteors" src={perseidShowerImage} alt="" aria-hidden="true"/>
      <img className="journey-web-backdrop backdrop-galaxy" src={galaxyImage} alt="" aria-hidden="true"/>
      <div className="journey-sky" aria-hidden="true"><div className="journey-starfield"/><div className="journey-halo"/><div className="journey-horizon"/></div>
      <Suspense fallback={null}><CosmicScene progressRef={progressRef}/></Suspense>
      <div className={`threshold-copy ${activeStage===-1?'is-current':''}`} aria-hidden={activeStage!==-1}>
        <span className="journey-kicker"><i/> THE NIGHT SANCTUARY · 夜の聖域</span>
        <h1>Enter the<br/><em>infinite night.</em></h1>
        <p>Take a breath beneath the stars. A quiet universe unfolds one world at a time.</p>
        <div className="journey-scroll-cue" aria-hidden="true"><span>SCROLL TO BEGIN</span><ArrowDown size={15}/></div>
      </div>

      {activeStage>=0&&<JourneyChapter chapter={chapters[activeStage]}/>}

      <div className="depth-caption" aria-hidden="true">
        <span>無限 · WITHOUT END</span>
        <strong>One world gives way<br/>to another.</strong>
        <b>∞</b>
      </div>

      <div className="journey-index" aria-hidden="true">
        <span>{activeStage<0?'夜':chapters[activeStage].kanji}</span>
        <i/>
        <b>{activeStage<0?'THE NIGHT SKY':`REQUIREMENT 0${activeStage+1} / 04`}</b>
      </div>
      {activeStage===0&&<div className="cosmic-object-tag halley-tag" aria-hidden="true"><i/><span>1P / HALLEY’S COMET</span><small>ORIONID PARENT COMET</small></div>}
      {activeStage===1&&<div className="cosmic-object-tag earth-tag" aria-hidden="true"><i/><span>EARTH ↔ LUNA</span><small>MOON IN ORBIT</small></div>}
      {activeStage===2&&<div className="cosmic-object-tag galaxy-tag" aria-hidden="true"><i/><span>SPIRAL GALAXY</span><small>HUBBLE DEEP SKY</small></div>}
      {activeStage===3&&<div className="cosmic-object-tag nebula-tag" aria-hidden="true"><i/><span>CARINA NEBULA</span><small>STAR-FORMING REGION</small></div>}
      <div className="cosmic-credits">
        {activeStage===0&&<>
          <a className="cosmic-credit" href="https://science.nasa.gov/image-article/apod-2007-august-12-raining-perseids/" target="_blank" rel="noreferrer">NASA APOD · FRED BRUENJES / PERSEIDS</a>
          <a className="cosmic-credit" href="https://science.nasa.gov/photojournal/comet-halley/" target="_blank" rel="noreferrer">NASA / ESA / GIOTTO · HALLEY</a>
        </>}
        {activeStage===1&&<a className="cosmic-credit" href="https://science.nasa.gov/moon/" target="_blank" rel="noreferrer">NASA BLUE MARBLE · LUNAR SURFACE IMAGERY</a>}
        {activeStage===2&&<a className="cosmic-credit" href="https://science.nasa.gov/asset/hubble/a-sea-of-spiral-galaxies/" target="_blank" rel="noreferrer">NASA / ESA / HUBBLE · GALAXY IMAGERY</a>}
        {activeStage===3&&<>
          <a className="cosmic-credit" href="https://science.nasa.gov/asset/hubble/carina-nebula-2/" target="_blank" rel="noreferrer">NASA / ESA / HUBBLE · CARINA NEBULA</a>
          <a className="cosmic-credit" href="https://science.nasa.gov/photojournal/saturn-in-color/" target="_blank" rel="noreferrer">NASA / JPL / CASSINI · SATURN</a>
          <a className="cosmic-credit" href="https://maps.jpl.nasa.gov/tmaps/jupiter.html" target="_blank" rel="noreferrer">JPL / CALTECH · JUPITER MAP</a>
        </>}
      </div>
    </div>
    <div className="journey-static-chapters">
      {chapters.map(chapter=><JourneyChapter chapter={chapter} key={chapter.number}/>)}
    </div>
  </section>;
}
