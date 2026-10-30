import {useEffect} from 'react';

const revealTargets = '.panel, .metric, .page-intro, .section-heading, .ticker, .event-card, .journal-entry, .calendar-strip, .tips, .filters, .notice, .result-card';

export default function ScrollEffects(){
  useEffect(()=>{
    const root=document.querySelector('.shell');
    if(!root)return;

    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let revealObserver=null;
    let mutations=null;
    if(!reduced&&'IntersectionObserver' in window){
      revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      }),{threshold:.12,rootMargin:'0px 0px -44px 0px'});

      const observe=node=>{
        if(node.nodeType!==1)return;
        if(node.matches(revealTargets)&&!node.hasAttribute('data-reveal')){
          node.setAttribute('data-reveal','');
          revealObserver.observe(node);
        }
        node.querySelectorAll(revealTargets).forEach(item=>{
          if(!item.hasAttribute('data-reveal')){
            item.setAttribute('data-reveal','');
            revealObserver.observe(item);
          }
        });
      };

      observe(root);
      mutations=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(observe)));
      mutations.observe(root,{childList:true,subtree:true});
    }

    const updateProgress=()=>{
      const range=document.documentElement.scrollHeight-window.innerHeight;
      const percent=range>0?window.scrollY/range*100:0;
      document.documentElement.style.setProperty('--scroll-progress',`${percent}%`);
    };
    let frame=0;
    const onScroll=()=>{
      if(frame)cancelAnimationFrame(frame);
      frame=requestAnimationFrame(updateProgress);
    };
    const sizeObserver=typeof ResizeObserver!=='undefined'?new ResizeObserver(updateProgress):null;
    sizeObserver?.observe(root);
    updateProgress();
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',updateProgress);

    return()=>{
      if(frame)cancelAnimationFrame(frame);
      revealObserver?.disconnect();
      mutations?.disconnect();
      sizeObserver?.disconnect();
      window.removeEventListener('scroll',onScroll);
      window.removeEventListener('resize',updateProgress);
    };
  },[]);

  return <div className="scroll-progress" aria-hidden="true"/>;
}
