import {useEffect,useState} from 'react';
import {Activity,ArrowUpRight,Compass,Eye,Globe2,Gauge,MapPin,Moon,Search,ShieldCheck} from 'lucide-react';
import RealMap from './RealMap.jsx';

const DEFAULT_LAT='30.7333';
const DEFAULT_LON='76.7794';
const WEATHER_URL='https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL='https://geocoding-api.open-meteo.com/v1/search';

const honor=weather=>!weather||weather.cloud==null||weather.humidity==null||weather.visibility==null
  ?null
  :Math.round(Math.max(0,100-weather.cloud)*.55+Math.max(0,100-Math.max(0,weather.humidity-45)*1.1)*.15+Math.min(100,weather.visibility/24000*100)*.3);

function Eyebrow({children}){return <div className="eyebrow"><span/>{children}</div>}
function Panel({children}){return <section className="panel">{children}</section>}
function Metric({icon:Icon,label,value,unit='',sub,tone=''}){return <div className="metric"><div className={`metric-icon ${tone}`}><Icon size={17}/></div><span className="metric-label">{label}</span><div className="metric-value">{value}<small>{unit}</small></div><div className="metric-sub">{sub}</div></div>}
function PageIntro({eyebrow,title,desc}){return <div className="page-intro"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{desc}</p></div>}

function formatPlace(place){
  return [place.name,place.admin1,place.country].filter((part,index,list)=>part&&list.indexOf(part)===index).join(', ');
}

async function getWeather(lat,lon){
  const params=new URLSearchParams({
    latitude:String(lat),
    longitude:String(lon),
    current:'relative_humidity_2m,cloud_cover,visibility,temperature_2m,wind_speed_10m',
    timezone:'auto',
  });
  const response=await fetch(`${WEATHER_URL}?${params}`);
  if(!response.ok)throw new Error('Could not load weather for those coordinates.');
  const data=await response.json();
  if(!data.current)throw new Error('Weather data was unavailable for that location.');
  return {
    cloud:data.current.cloud_cover,
    humidity:data.current.relative_humidity_2m,
    visibility:data.current.visibility,
    temp:data.current.temperature_2m,
    wind:data.current.wind_speed_10m,
  };
}

export default function Watchtower(){
  const [lat,setLat]=useState(DEFAULT_LAT);
  const [lon,setLon]=useState(DEFAULT_LON);
  const [locationName,setLocationName]=useState('Chandigarh, India');
  const [mapPoint,setMapPoint]=useState({lat:DEFAULT_LAT,lon:DEFAULT_LON,name:'Chandigarh, India'});
  const [weather,setWeather]=useState(null);
  const [query,setQuery]=useState(null);
  const [placeSearch,setPlaceSearch]=useState('');
  const [places,setPlaces]=useState([]);
  const [loading,setLoading]=useState(false);
  const [searching,setSearching]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    let active=true;
    getWeather(DEFAULT_LAT,DEFAULT_LON).then(result=>{
      if(active)setWeather(result);
    }).catch(()=>{
      if(active)setError('Weather is unavailable right now. Try reading conditions again.');
    });
    return ()=>{active=false};
  },[]);

  async function readConditions(nextLat=lat,nextLon=lon,nextName=locationName){
    setLoading(true);
    setError('');
    try{
      const result=await getWeather(nextLat,nextLon);
      setLat(String(nextLat));
      setLon(String(nextLon));
      setLocationName(nextName);
      setMapPoint({lat:String(nextLat),lon:String(nextLon),name:nextName});
      setWeather(result);
      setQuery({lat:String(nextLat),lon:String(nextLon),name:nextName,w:result});
    }catch(readError){
      setError(readError.message||'Could not read weather for this location.');
    }finally{
      setLoading(false);
    }
  }

  async function searchPlaces(event){
    event.preventDefault();
    const term=placeSearch.trim();
    if(term.length<2){
      setError('Enter at least two letters to search for a place.');
      return;
    }
    setSearching(true);
    setError('');
    setPlaces([]);
    try{
      const params=new URLSearchParams({name:term,count:'5',language:'en',format:'json'});
      const response=await fetch(`${GEOCODING_URL}?${params}`);
      if(!response.ok)throw new Error('Place search is unavailable right now.');
      const data=await response.json();
      setPlaces(data.results||[]);
      if(!data.results?.length)setError('No matching places. Try adding a state or country.');
    }catch(searchError){
      setError(searchError.message||'Could not search for that place.');
    }finally{
      setSearching(false);
    }
  }

  async function choosePlace(place){
    const nextName=formatPlace(place);
    setPlaces([]);
    setPlaceSearch(nextName);
    await readConditions(place.latitude.toFixed(5),place.longitude.toFixed(5),nextName);
  }

  function useMyLocation(){
    if(!navigator.geolocation){
      setError('Location access is unavailable in this browser.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(({coords})=>{
      const nextLat=coords.latitude.toFixed(5);
      const nextLon=coords.longitude.toFixed(5);
      setPlaceSearch('');
      setPlaces([]);
      void readConditions(nextLat,nextLon,'Your location');
    },()=>{
      setLoading(false);
      setError('Location access was denied or unavailable. You can search for a place or enter coordinates.');
    },{timeout:10000,maximumAge:60000});
  }

  async function submitCoordinates(event){
    event.preventDefault();
    setPlaces([]);
    await readConditions(lat,lon,'Selected coordinates');
  }

  const currentWeather=query?.w||weather;

  return <>
    <PageIntro eyebrow="THE WATCHTOWER · 01" title={<>Find your <em>dark sky.</em></>} desc="Search for a real place, inspect it on the map, and read the latest weather before you head out."/>
    <div className="metrics">
      <Metric icon={Gauge} label="NIGHT HONOR SCORE" value={honor(currentWeather)??'—'} unit="/100" sub="Weather-based estimate"/>
      <Metric icon={Eye} label="CLOUD COVER" value={currentWeather?.cloud??'—'} unit="%" sub="Less cloud is better" tone="blue"/>
      <Metric icon={Activity} label="HUMIDITY" value={currentWeather?.humidity??'—'} unit="%" sub="Current relative humidity" tone="purple"/>
      <Metric icon={Globe2} label="VISIBILITY" value={currentWeather?.visibility==null?'—':(currentWeather.visibility/1000).toFixed(1)} unit="km" sub="Reported atmospheric range" tone="rose"/>
    </div>

    <div className="watch-grid">
      <Panel>
        <div className="panel-heading">
          <div><Eyebrow>SCOUTING MAP</Eyebrow><h3>{locationName}</h3></div>
          <span className="live-label"><i/> OPENSTREETMAP</span>
        </div>
        <RealMap lat={mapPoint.lat} lon={mapPoint.lon} locationName={mapPoint.name}/>
        <div className="map-source-note">Weather for the pin comes from <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>. Place names use GeoNames location data through Open-Meteo.</div>
      </Panel>

      <Panel>
        <Eyebrow>COORDINATE SCOUT</Eyebrow>
        <h3>Choose a place to check.</h3>
        <p>Search by city or location name, use your device location, or enter coordinates.</p>

        <form className="form-stack" onSubmit={searchPlaces}>
          <label htmlFor="place-search">SEARCH FOR A PLACE</label>
          <div className="place-search-row">
            <input id="place-search" className="field" type="search" minLength="2" value={placeSearch} onChange={event=>setPlaceSearch(event.target.value)} placeholder="City, state, or country"/>
            <button className="btn primary" disabled={searching||placeSearch.trim().length<2} aria-label="Search places">{searching?'Searching…':<Search size={15}/>}</button>
          </div>
        </form>

        {places.length>0&&<div className="place-results" aria-label="Place search results">{places.map(place=><button className="place-result" type="button" key={`${place.id}-${place.latitude}-${place.longitude}`} onClick={()=>choosePlace(place)}><MapPin size={15}/><span><b>{place.name}</b><small>{[place.admin1,place.country].filter(Boolean).join(' · ')}</small></span><ArrowUpRight size={14}/></button>)}</div>}

        <div className="map-or-divider"><span>OR USE COORDINATES</span></div>
        <form onSubmit={submitCoordinates} className="form-stack coordinate-form">
          <label htmlFor="scout-latitude">LATITUDE</label>
          <input id="scout-latitude" className="field" type="number" step="any" min="-90" max="90" required value={lat} onChange={event=>setLat(event.target.value)}/>
          <label htmlFor="scout-longitude">LONGITUDE</label>
          <input id="scout-longitude" className="field" type="number" step="any" min="-180" max="180" required value={lon} onChange={event=>setLon(event.target.value)}/>
          <button className="btn primary full" disabled={loading}>{loading?'Reading the sky…':<><Compass size={15}/> Read conditions</>}</button>
          <button type="button" className="btn ghost full" disabled={loading} onClick={useMyLocation}><MapPin size={15}/> Use my location</button>
        </form>

        {error&&<p className="error" role="status">{error}</p>}
        {query&&<div className="result-card"><span>LIVE WEATHER RESULT</span><b>{query.name}</b><small>{query.lat}, {query.lon}</small><strong>{honor(query.w)}<small>/100 Honor Score</small></strong><p>{query.w.temp}°C · Wind {query.w.wind} km/h</p></div>}
        <div className="truth"><ShieldCheck size={17}/><span><b>Honor Score is an estimate.</b> It combines cloud cover, humidity, and visibility. It does not measure light pollution or guarantee a clear sky.</span></div>
      </Panel>
    </div>

    <Panel>
      <Eyebrow>WAYFINDER'S NOTES</Eyebrow>
      <h3>Before you depart</h3>
      <div className="tips">
        <div><Moon/><b>Check the Moon</b><p>Moonlight can wash out faint galaxies and nebulae.</p></div>
        <div><Eye/><b>Find dark skies</b><p>Move away from city lights and let your eyes adapt.</p></div>
        <div><ShieldCheck/><b>Verify on arrival</b><p>Recheck access, weather, and local safety conditions.</p></div>
      </div>
    </Panel>
  </>;
}
