import {useEffect,useRef} from 'react';

const COLORS=['#f7e5bd','#b8d8ff','#d6b6ff','#c5f3ef'];

export default function CursorTrail(){
  const canvasRef=useRef(null);

  useEffect(()=>{
    const canvas=canvasRef.current;
    const context=canvas?.getContext('2d');
    if(!canvas||!context||!window.matchMedia('(hover: hover) and (pointer: fine)').matches||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;

    let width=0;
    let height=0;
    let frame=0;
    let previousFrame=0;
    let lastMove=-10000;
    let pointerX=-1000;
    let pointerY=-1000;
    const particles=[];

    const resize=()=>{
      const ratio=Math.min(window.devicePixelRatio||1,1.5);
      width=window.innerWidth;
      height=window.innerHeight;
      canvas.width=Math.round(width*ratio);
      canvas.height=Math.round(height*ratio);
      context.setTransform(ratio,0,0,ratio,0,0);
    };

    const draw=(time)=>{
      frame=0;
      const delta=Math.min(34,time-(previousFrame||time));
      previousFrame=time;
      context.clearRect(0,0,width,height);
      context.globalCompositeOperation='lighter';

      const glowStrength=Math.max(0,1-(time-lastMove)/750);
      if(glowStrength>0){
        const glow=context.createRadialGradient(pointerX,pointerY,0,pointerX,pointerY,56);
        glow.addColorStop(0,`rgba(198,218,255,${.16*glowStrength})`);
        glow.addColorStop(.35,`rgba(165,142,239,${.08*glowStrength})`);
        glow.addColorStop(1,'rgba(165,142,239,0)');
        context.fillStyle=glow;
        context.beginPath();
        context.arc(pointerX,pointerY,56,0,Math.PI*2);
        context.fill();
        context.strokeStyle=`rgba(231,220,255,${.34*glowStrength})`;
        context.lineWidth=1;
        context.beginPath();
        context.arc(pointerX,pointerY,7+glowStrength*2,0,Math.PI*2);
        context.stroke();
      }

      let hasParticles=false;
      for(let index=particles.length-1;index>=0;index--){
        const particle=particles[index];
        const age=time-particle.born;
        const opacity=Math.max(0,1-age/particle.life);
        if(opacity<=0){particles.splice(index,1);continue;}
        hasParticles=true;
        particle.x+=particle.vx*delta;
        particle.y+=particle.vy*delta;
        particle.vx*=.995;
        particle.vy*=.995;
        context.globalAlpha=opacity;
        context.fillStyle=particle.color;
        context.shadowColor=particle.color;
        context.shadowBlur=particle.radius*5;
        context.beginPath();
        context.arc(particle.x,particle.y,particle.radius,0,Math.PI*2);
        context.fill();
        if(particle.spark){
          context.globalAlpha=opacity*.65;
          context.lineWidth=.7;
          context.beginPath();
          context.moveTo(particle.x-particle.radius*2.8,particle.y);
          context.lineTo(particle.x+particle.radius*2.8,particle.y);
          context.moveTo(particle.x,particle.y-particle.radius*2.8);
          context.lineTo(particle.x,particle.y+particle.radius*2.8);
          context.strokeStyle=particle.color;
          context.stroke();
        }
      }
      context.globalAlpha=1;
      context.globalCompositeOperation='source-over';
      context.shadowBlur=0;

      if(hasParticles||glowStrength>0)frame=requestAnimationFrame(draw);
    };

    const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw)};
    const onPointerMove=(event)=>{
      if(event.pointerType&&event.pointerType!=='mouse'&&event.pointerType!=='pen')return;
      const x=event.clientX;
      const y=event.clientY;
      const startX=pointerX<-100?x:pointerX;
      const startY=pointerY<-100?y:pointerY;
      const distance=Math.hypot(x-startX,y-startY);
      const count=Math.min(10,Math.floor(distance/11));
      for(let index=0;index<count;index++){
        const progress=(index+1)/count;
        particles.push({
          x:startX+(x-startX)*progress,
          y:startY+(y-startY)*progress,
          vx:(Math.random()-.5)*.045,
          vy:-.025-Math.random()*.045,
          radius:.8+Math.random()*1.6,
          life:650+Math.random()*550,
          born:performance.now(),
          color:COLORS[Math.floor(Math.random()*COLORS.length)],
          spark:Math.random()>.86,
        });
      }
      if(particles.length>110)particles.splice(0,particles.length-110);
      pointerX=x;
      pointerY=y;
      lastMove=performance.now();
      schedule();
    };

    resize();
    window.addEventListener('resize',resize,{passive:true});
    window.addEventListener('pointermove',onPointerMove,{passive:true});
    return()=>{
      window.removeEventListener('resize',resize);
      window.removeEventListener('pointermove',onPointerMove);
      if(frame)cancelAnimationFrame(frame);
    };
  },[]);

  return <canvas className="cosmic-cursor-trail" ref={canvasRef} aria-hidden="true"/>;
}
