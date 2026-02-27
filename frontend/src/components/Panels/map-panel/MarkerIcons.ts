import L from 'leaflet';
import styles from './MapPanel.module.css';

const createIconSvg = (color: string, type: string = 'default'): string => {
  const icons = {
    start: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 6.5 28.5 12 36C17.5 28.5 24 18.6274 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
      <path d="M12 6L16 12L12 10L8 12L12 6Z" fill="white" opacity="0.8"/>
    </svg>`,
    
    end: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 6.5 28.5 12 36C17.5 28.5 24 18.6274 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
      <circle cx="12" cy="12" r="2" fill="${color}"/>
    </svg>`,
    
    selected: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 6.5 28.5 12 36C17.5 28.5 24 18.6274 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
      <circle cx="12" cy="12" r="3" fill="${color}"/>
      <path d="M12 16L12 20M12 4L12 8" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    
    default: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 6.5 28.5 12 36C17.5 28.5 24 18.6274 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
      <path d="M12 8V16M8 12H16" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  };

  return icons[type as keyof typeof icons] || icons.default;
};

const createIcon = (color: string, type: string = 'default') => {
  return L.divIcon({
    html: createIconSvg(color, type),
    className: styles.customMarker,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36]
  });
};

export const MARKER_ICONS = {
  start: createIcon('#ffdd2d', 'start'),
  end: createIcon('#e30611', 'end'),
  point: createIcon('#6b6b6b', 'point'),
  selected: createIcon('#9c27b0', 'selected')
};