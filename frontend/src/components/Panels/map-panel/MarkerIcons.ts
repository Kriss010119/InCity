import L from 'leaflet';
import styles from './MapPanel.module.css';

const createIconSvg = (color: string, type: string = 'default'): string => {
  const icons = {
    start: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>`,

    end: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>`,

    event: `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 12 32 12 32C12 32 24 18.6274 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="11" r="3" fill="white"/>
    </svg>`,

    default: `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 12 32 12 32C12 32 24 18.6274 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="11" r="3" fill="white"/>
    </svg>`,

    selected: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.26801 0 0 6.26801 0 14C0 21.732 14 38 14 38C14 38 28 21.732 28 14C28 6.26801 21.732 0 14 0Z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="13" r="5" fill="white"/>
      <circle cx="14" cy="13" r="2.5" fill="${color}"/>
    </svg>`,
  };

  return icons[type as keyof typeof icons] || icons.default;
};

const createIcon = (color: string, type: string = 'default') => {
  const sizes = {
    start: [32, 32],
    end: [32, 32],
    event: [24, 32],
    default: [24, 32],
    selected: [28, 38],
  };

  const size = sizes[type as keyof typeof sizes] || [24, 32];

  return L.divIcon({
    html: createIconSvg(color, type),
    className: styles.customMarker,
    iconSize: size as [number, number],
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]],
  });
};

export const MARKER_ICONS = {
  start: createIcon('#FFD700', 'start'),
  end: createIcon('#FFD700', 'end'),
  event: createIcon('#B39DDB', 'event'),
  point: createIcon('#9E9E9E', 'default'),
  selected: createIcon('#E53935', 'selected'),
};
