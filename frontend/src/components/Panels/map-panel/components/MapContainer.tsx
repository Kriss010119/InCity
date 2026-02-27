import { MapContainer as LeafletMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from '../MapPanel.module.css';

type MapContainerProps = {
  key: number;
  center: [number, number];
  zoom: number;
  children: React.ReactNode;
};

export const MapContainer = ({ key, center, zoom, children }: MapContainerProps) => {
  return (
    <LeafletMap
      key={key}
      center={center}
      zoom={zoom}
      className={styles.map}
      zoomControl={false}
    >
      {children}
    </LeafletMap>
  );
};