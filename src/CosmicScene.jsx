import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import earthMapUrl from './assets/earth-satellite-v2.webp';
import moonMapUrl from './assets/moon-lunar-v1.webp';
import milkyWayUrl from './assets/milkyway-v1.webp';
import nebulaUrl from './assets/nebula-v1.webp';
import jupiterMapUrl from './assets/nasa-jupiter-map.jpg';
import saturnPhotoUrl from './assets/nasa-saturn-cassini.jpg';
import halleyPhotoUrl from './assets/nasa-halley-giotto.jpg';

function makeGalaxy(THREE,starTexture){
  const count=5200,positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  const seedRandom=()=>{let seed=1847;return()=>{seed=(seed*48271)%2147483647;return(seed-1)/2147483646}};
  const random=seedRandom();
  const inner=new THREE.Color('#ffe6b8'),middle=new THREE.Color('#e49bdc'),outer=new THREE.Color('#8ab7f4');
  for(let i=0;i<count;i++){
    const arm=Math.floor(random()*4),radius=Math.pow(random(),.68)*4.2;
    const angle=arm*Math.PI/2+radius*1.42+(random()-.5)*.72;
    const spread=(random()-.5)*(.18+radius*.08);
    positions[i*3]=Math.cos(angle)*radius+spread;
    positions[i*3+1]=Math.sin(angle)*radius*.57+spread*.5;
    positions[i*3+2]=(random()-.5)*.48;
    const c=radius<1.15?inner.clone().lerp(middle,radius/1.15):middle.clone().lerp(outer,(radius-1.15)/3.05);
    const brightness=.55+random()*.45;
    colors[i*3]=c.r*brightness;colors[i*3+1]=c.g*brightness;colors[i*3+2]=c.b*brightness;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const material=new THREE.PointsMaterial({size:.105,map:starTexture,alphaTest:.01,sizeAttenuation:true,vertexColors:true,transparent:true,opacity:.88,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  const galaxy=new THREE.Points(geometry,material);
  return galaxy;
}

function makeStarTexture(THREE){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d'),center=64;
  const glow=ctx.createRadialGradient(center,center,0,center,center,center);
  glow.addColorStop(0,'rgba(255,255,255,1)');glow.addColorStop(.06,'rgba(244,249,255,.92)');
  glow.addColorStop(.19,'rgba(204,226,255,.4)');glow.addColorStop(.48,'rgba(133,177,255,.09)');glow.addColorStop(1,'rgba(95,143,255,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,128,128);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function makeStars(THREE,starTexture){
  const count=4200,positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    positions[i*3]=(Math.random()-.5)*56;
    positions[i*3+1]=(Math.random()-.5)*32;
    positions[i*3+2]=18-Math.random()*94;
    const color=new THREE.Color().setHSL(.52+Math.random()*.14,.28+Math.random()*.5,.62+Math.random()*.34);
    colors[i*3]=color.r;colors[i*3+1]=color.g;colors[i*3+2]=color.b;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  return new THREE.Points(geometry,new THREE.PointsMaterial({size:.19,map:starTexture,alphaTest:.012,sizeAttenuation:true,vertexColors:true,transparent:true,opacity:.88,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
}

function makeMeteor(THREE){
  const group=new THREE.Group();
  const points=[new THREE.Vector3(-2.25,1.2,0),new THREE.Vector3(-1.3,.68,0),new THREE.Vector3(-.48,.25,0),new THREE.Vector3(0,0,0)];
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xadddff,transparent:true,opacity:.78,blending:THREE.AdditiveBlending,depthWrite:false}));
  const head=new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),new THREE.MeshBasicMaterial({color:0xfff5d8}));
  group.add(line,head);
  return group;
}

export default function CosmicScene({progressRef}){
  const hostRef=useRef(null);

  useEffect(()=>{
    const host=hostRef.current;
    if(!host)return;
    let renderer,frame=0,resizeObserver;
    const geometries=[],materials=[],textures=[];
    try{
      renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
      renderer.setClearColor(0x000000,0);
      renderer.setSize(host.clientWidth||window.innerWidth,host.clientHeight||window.innerHeight,false);
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.22;
      host.appendChild(renderer.domElement);
    }catch{
      return undefined;
    }

    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(44,1,.1,160);
    camera.position.set(0,.2,18.5);
    camera.lookAt(0,.2,4.5);
    scene.add(new THREE.HemisphereLight(0xb4ccff,0x151222,1.45));
    const keyLight=new THREE.DirectionalLight(0xffecd2,3.1);keyLight.position.set(-6,7,10);scene.add(keyLight);
    const rimLight=new THREE.DirectionalLight(0x517bff,1.2);rimLight.position.set(9,2,-5);scene.add(rimLight);
    const fillLight=new THREE.PointLight(0x8f65db,3,24);fillLight.position.set(-2,-1,2);scene.add(fillLight);

    const loader=new THREE.TextureLoader();
    const loadTexture=(url)=>{const texture=loader.load(url);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.push(texture);return texture};
    const earthMap=loadTexture(earthMapUrl),moonMap=loadTexture(moonMapUrl);
    const starTexture=makeStarTexture(THREE);textures.push(starTexture);
    const stars=makeStars(THREE,starTexture);scene.add(stars);geometries.push(stars.geometry);materials.push(stars.material);
    const galaxy=makeGalaxy(THREE,starTexture);
    const galaxyGroup=new THREE.Group();galaxyGroup.position.set(-2.8,3.2,-48);galaxyGroup.scale.set(1.55,1.18,1);galaxyGroup.rotation.set(.92,0,-.3);
    const galaxyImageGeometry=new THREE.PlaneGeometry(13.5,6.75);geometries.push(galaxyImageGeometry);
    const galaxyImageMaterial=new THREE.MeshBasicMaterial({map:loadTexture(milkyWayUrl),color:0xe2e8ff,transparent:true,opacity:.48,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});materials.push(galaxyImageMaterial);
    const galaxyImage=new THREE.Mesh(galaxyImageGeometry,galaxyImageMaterial);galaxyImage.position.z=-5;galaxyGroup.add(galaxyImage,galaxy);scene.add(galaxyGroup);
    geometries.push(galaxy.geometry);materials.push(galaxy.material);
    const nebulaGroup=new THREE.Group();nebulaGroup.position.set(-1.2,-.6,-68);scene.add(nebulaGroup);
    const nebulaTexture=loadTexture(nebulaUrl);
    [
      {x:0,y:0,z:0,w:19,h:9.5,opacity:.2,tint:0xe4d8ff,rotation:.02},
      {x:2.8,y:.8,z:-1.6,w:15,h:7.5,opacity:.13,tint:0x91baff,rotation:-.17},
      {x:-2.6,y:-.8,z:-3,w:13,h:6.5,opacity:.1,tint:0xffb8cf,rotation:.13},
    ].forEach(layer=>{
      const geometry=new THREE.PlaneGeometry(layer.w,layer.h);geometries.push(geometry);
      const material=new THREE.MeshBasicMaterial({map:nebulaTexture,color:layer.tint,transparent:true,opacity:layer.opacity,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});materials.push(material);
      const cloud=new THREE.Mesh(geometry,material);cloud.position.set(layer.x,layer.y,layer.z);cloud.rotation.z=layer.rotation;nebulaGroup.add(cloud);
    });
    const earthGroup=new THREE.Group();earthGroup.position.set(3.8,-.15,-29);earthGroup.rotation.z=.13;scene.add(earthGroup);
    const earthGeometry=new THREE.SphereGeometry(2.65,112,80);geometries.push(earthGeometry);
    const earthMaterial=new THREE.MeshPhysicalMaterial({map:earthMap,bumpMap:earthMap,bumpScale:.018,roughness:.72,metalness:0,clearcoat:.06,clearcoatRoughness:.82});materials.push(earthMaterial);
    const earth=new THREE.Mesh(earthGeometry,earthMaterial);earth.rotation.y=-.7;earthGroup.add(earth);
    const atmosphereGeometry=new THREE.SphereGeometry(2.75,96,64);geometries.push(atmosphereGeometry);
    const atmosphereMaterial=new THREE.ShaderMaterial({
      transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false,
      vertexShader:'varying vec3 vNormal; varying vec3 vView; void main(){vNormal=normalize(normalMatrix*normal);vec4 viewPos=modelViewMatrix*vec4(position,1.0);vView=normalize(-viewPos.xyz);gl_Position=projectionMatrix*viewPos;}',
      fragmentShader:'varying vec3 vNormal; varying vec3 vView; void main(){float rim=pow(1.0-max(dot(normalize(vNormal),normalize(vView)),0.0),3.0);gl_FragColor=vec4(0.2,0.52,1.0,rim*0.62);}',
    });materials.push(atmosphereMaterial);
    earthGroup.add(new THREE.Mesh(atmosphereGeometry,atmosphereMaterial));

    const moonOrbit=new THREE.Group();earthGroup.add(moonOrbit);
    const orbitCurve=new THREE.EllipseCurve(0,0,3.68,2.78,0,Math.PI*2,false,0);
    const orbitPoints=orbitCurve.getPoints(160).map(point=>new THREE.Vector3(point.x,point.y,0));
    const orbitGeometry=new THREE.BufferGeometry().setFromPoints(orbitPoints);geometries.push(orbitGeometry);
    const orbitMaterial=new THREE.LineBasicMaterial({color:0x8dc9ff,transparent:true,opacity:.42,blending:THREE.AdditiveBlending});materials.push(orbitMaterial);
    moonOrbit.add(new THREE.LineLoop(orbitGeometry,orbitMaterial));
    const moonGeometry=new THREE.SphereGeometry(.72,64,48);geometries.push(moonGeometry);
    const moonMaterial=new THREE.MeshStandardMaterial({map:moonMap,bumpMap:moonMap,bumpScale:.065,roughness:1,metalness:0});materials.push(moonMaterial);
    const moon=new THREE.Mesh(moonGeometry,moonMaterial);moon.position.set(3.68,0,0);moonOrbit.add(moon);
    const jupiterMap=loadTexture(jupiterMapUrl);
    const jupiterGroup=new THREE.Group();jupiterGroup.position.set(-2.6,2.6,-64);jupiterGroup.rotation.z=-.13;scene.add(jupiterGroup);
    const jupiterGeometry=new THREE.SphereGeometry(1.45,80,64);geometries.push(jupiterGeometry);
    const jupiterMaterial=new THREE.MeshStandardMaterial({map:jupiterMap,roughness:.96});materials.push(jupiterMaterial);
    const jupiter=new THREE.Mesh(jupiterGeometry,jupiterMaterial);jupiter.rotation.z=.16;jupiterGroup.add(jupiter);
    const saturnPhoto=loadTexture(saturnPhotoUrl);
    const saturnGroup=new THREE.Group();saturnGroup.position.set(3.2,-2.6,-65);saturnGroup.rotation.z=-.08;scene.add(saturnGroup);
    const saturnPhotoGeometry=new THREE.PlaneGeometry(8.5,8.5);geometries.push(saturnPhotoGeometry);
    const saturnPhotoMaterial=new THREE.MeshBasicMaterial({map:saturnPhoto,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false,toneMapped:false});materials.push(saturnPhotoMaterial);
    saturnGroup.add(new THREE.Mesh(saturnPhotoGeometry,saturnPhotoMaterial));

    const comet=new THREE.Group();scene.add(comet);
    const halleyPhoto=loadTexture(halleyPhotoUrl);
    const halleyPhotoGeometry=new THREE.PlaneGeometry(10.5,6.7);geometries.push(halleyPhotoGeometry);
    const halleyPhotoMaterial=new THREE.MeshBasicMaterial({map:halleyPhoto,transparent:true,opacity:.94,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false,toneMapped:false});materials.push(halleyPhotoMaterial);
    comet.add(new THREE.Mesh(halleyPhotoGeometry,halleyPhotoMaterial));

    const meteors=[];
    for(let i=0;i<12;i++){
      const meteor=makeMeteor(THREE);scene.add(meteor);meteors.push({object:meteor,phase:Math.random()*24,cycle:18+Math.random()*10,duration:2.8+Math.random()*2.2,speed:.75+Math.random()*.42,z:Math.random()*5-3});
      geometries.push(...meteor.children.map(child=>child.geometry));
      materials.push(...meteor.children.map(child=>child.material));
    }

    const clock=new THREE.Clock();
    const resize=()=>{
      const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight),aspect=width/height;
      camera.aspect=aspect;
      camera.fov=aspect<.85?57:44;
      camera.updateProjectionMatrix();
      renderer.setSize(width,height,false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
      const narrow=aspect<.85;
      earthGroup.position.x=narrow?2.45:3.8;
      earthGroup.scale.setScalar(narrow?.68:1);
      jupiterGroup.position.set(narrow?-2.2:-2.6,narrow?4.1:2.6,-64);
      jupiterGroup.scale.setScalar(narrow?.78:1);
      saturnGroup.position.set(narrow?1.8:3.2,narrow?-4.6:-2.6,-65);
      saturnGroup.scale.setScalar(narrow?.76:1);
      galaxyGroup.position.set(narrow?-.6:-2.8,narrow?4.5:3.2,-48);
      galaxyGroup.scale.set(narrow?1.15:1.55,narrow?1.1:1.18,1);
    };
    resize();
    resizeObserver=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
    resizeObserver?.observe(host);
    window.addEventListener('resize',resize);

    const prefersReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const render=()=>{
      frame=requestAnimationFrame(render);
      const delta=Math.min(clock.getDelta(),.05),elapsed=clock.elapsedTime,progress=progressRef?.current||0;
      if(!prefersReducedMotion){
        earth.rotation.y=elapsed*.026;
        moonOrbit.rotation.z=elapsed*.28;
        moon.rotation.y=elapsed*.007;
        jupiter.rotation.y=elapsed*.032;
        saturnGroup.rotation.z=-.08+Math.sin(elapsed*.08)*.018;
        galaxyGroup.rotation.z=-.3+elapsed*.004;
        stars.rotation.y=elapsed*.0004;
        stars.material.opacity=.83+Math.sin(elapsed*.62)*.025;
        nebulaGroup.rotation.y=Math.sin(elapsed*.024)*.022;
        nebulaGroup.rotation.z=Math.sin(elapsed*.016)*.012;
        const push=progress;
        const flightX=Math.sin(push*Math.PI*2.6)*1.35+Math.sin(elapsed*.13)*.11;
        const flightY=.18+Math.sin(push*Math.PI*2.2)*.62+Math.sin(elapsed*.17)*.07;
        const flightZ=18.5-push*76;
        const meteorPass=push>=.14&&push<=.355;
        const meteorProgress=Math.max(0,Math.min(1,(push-.14)/.215));
        comet.visible=meteorPass;
        comet.position.set(-8+meteorProgress*16+Math.sin(elapsed*.3)*.2,2.9+Math.sin(elapsed*.55)*.4,-8.5);
        comet.rotation.z=-.06+Math.sin(elapsed*.21)*.025;
        comet.scale.setScalar(1.12+Math.sin(elapsed*1.2)*.035);
        meteors.forEach(({object,phase,cycle,duration,speed,z},index)=>{
          const time=(elapsed+phase)%cycle,active=meteorPass&&time<duration;
          object.visible=active;
          if(active){
            const t=time/duration;
            object.position.set(-8+t*16*speed+(index%3-1)*.9,4.7-t*8.9,z-8.5);
            object.scale.setScalar(.85+speed*.44);
            object.children[0].material.opacity=.36+.58*Math.sin(t*Math.PI);
          }
        });
        camera.position.x+=(flightX-camera.position.x)*Math.min(1,delta*2.8);
        camera.position.y+=(flightY-camera.position.y)*Math.min(1,delta*2.4);
        camera.position.z+=(flightZ-camera.position.z)*Math.min(1,delta*2.5);
        camera.lookAt(flightX+Math.sin(push*Math.PI*2)*.28,flightY*.45,camera.position.z-14);
      }else{
        earth.rotation.y=-.7;
        moonOrbit.rotation.z=.95;
        moon.rotation.y=0;
        jupiter.rotation.y=.16;
        galaxyGroup.rotation.z=-.3;
        stars.rotation.y=0;
        nebulaGroup.rotation.set(0,0,0);
        comet.visible=true;
        comet.position.set(0,2.8,-8.5);
        meteors.forEach(({object},index)=>{object.visible=index<9;});
        camera.position.set(0,.2,18.5);
        camera.lookAt(0,.2,4.5);
      }
      renderer.render(scene,camera);
    };
    frame=requestAnimationFrame(render);

    return()=>{
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize',resize);
      geometries.forEach(geometry=>geometry.dispose());
      materials.forEach(material=>material.dispose());
      textures.forEach(texture=>texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  },[progressRef]);

  return <div className="cosmic-scene" ref={hostRef} aria-hidden="true"/>;
}
