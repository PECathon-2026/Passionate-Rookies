import {ArrowUpRight,MapPin} from 'lucide-react';

const DEFAULT_LAT=30.7333;
const DEFAULT_LON=76.7794;

export default function RealMap({lat,lon,locationName}){
  const parsedLat=Number(lat);
  const parsedLon=Number(lon);
  const valid=String(lat).trim()!==''&&String(lon).trim()!==''&&Number.isFinite(parsedLat)&&parsedLat>=-90&&parsedLat<=90&&Number.isFinite(parsedLon)&&parsedLon>=-180&&parsedLon<=180;
  const mapLat=valid?parsedLat:DEFAULT_LAT;
  const mapLon=valid?parsedLon:DEFAULT_LON;
  const mercatorLat=Math.max(-85.0511,Math.min(85.0511,mapLat));
  const latitudeSpan=.045;
  const longitudeSpan=Math.min(30,latitudeSpan/Math.max(.15,Math.cos(mercatorLat*Math.PI/180)));
  const bounds=[
    Math.max(-180,mapLon-longitudeSpan),
    Math.max(-85.0511,mercatorLat-latitudeSpan),
    Math.min(180,mapLon+longitudeSpan),
    Math.min(85.0511,mercatorLat+latitudeSpan),
  ].join(',');
  const params=new URLSearchParams({bbox:bounds,layer:'mapnik',marker:`${mercatorLat},${mapLon}`});
  const mapUrl=`https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
  const fullMapUrl=`https://www.openstreetmap.org/?mlat=${mercatorLat}&mlon=${mapLon}#map=13/${mercatorLat}/${mapLon}`;

  return <>
    <div className="large-map">
      <iframe title={`OpenStreetMap centered on ${locationName||`${mapLat.toFixed(5)}, ${mapLon.toFixed(5)}`}`} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>
      <div className="map-coordinate-chip"><MapPin size={13}/><span>{valid?`${locationName?`${locationName} · `:''}${mapLat.toFixed(5)}, ${mapLon.toFixed(5)}`:'Enter valid coordinates'}</span></div>
    </div>
    <div className="map-caption">
      <span>{valid?'Map shows the last selected location. Read conditions to apply coordinate edits.':'Showing the default Chandigarh location.'}</span>
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
      <a href={fullMapUrl} target="_blank" rel="noreferrer">Open full map <ArrowUpRight size={13}/></a>
    </div>
  </>;
}
