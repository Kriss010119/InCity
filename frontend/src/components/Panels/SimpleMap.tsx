import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './SimpleMap.module.css';

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'start' | 'end' | 'point';
}

export const SimpleMap = () => {
  const center: [number, number] = [55.7558, 37.6173];
  
  const demoMarkers: MapMarker[] = [
    { id: '1', lat: 55.7558, lng: 37.6173, title: 'Москва', type: 'start' },
    { id: '2', lat: 55.7517, lng: 37.6178, title: 'Красная площадь', type: 'point' },
    { id: '3', lat: 55.7339, lng: 37.5871, title: 'Арбат', type: 'end' },
  ];

  const demoRoute: [number, number][] = [
    [55.7558, 37.6173],
    [55.7517, 37.6178],
    [55.7339, 37.5871],
  ];

  const getTypeLabel = (type: string): string => {
    switch(type) {
      case 'start': return 'Начальная точка';
      case 'end': return 'Конечная точка';
      default: return 'Промежуточная точка';
    }
  };

  return (
    <div className={styles.wrapper}>
      <MapContainer
        center={center}
        zoom={13}
        className={styles.container}
        zoomControl={false}
      >
        <TileLayer
          attribution=''
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {demoMarkers.map(marker => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
          >
            <Popup>
              <div className={styles.popup}>
                <strong>{marker.title}</strong>
                <div className={styles.popupType}>{getTypeLabel(marker.type)}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {demoRoute.length > 1 && (
          <Polyline
            positions={demoRoute}
            pathOptions={{
              color: '#ffdd2d',
              weight: 3,
              opacity: 0.8,
              dashArray: '5, 5'
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};