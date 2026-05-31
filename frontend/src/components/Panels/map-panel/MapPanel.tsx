import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TileLayer } from 'react-leaflet';
import { PlaceDetailsModal } from '../../place-details-modal/PlaceDetailsModal';
import { MapContainer } from './components/MapContainer';
import { MapClickHandler, MapResizeHandler } from './components/MapHandlers';
import { MapMarkers } from './components/MapMarkers';
import { MapHint } from './components/MapHint';
import { LoadingState } from './components/LoadingState';
import { CurvedRouteSegments } from './components/CurvedRouteSegments';
import { TransportStops } from './components/TransportStops';
import { MapController } from './components/MapController';
import {
  getTileLayerAttribution,
  getTileLayerUrl,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  HOTEL_ZOOM,
} from './constants';
import { buildFullRouteSegments, createPlaceFromMarker } from './utils';
import L from 'leaflet';
import styles from './MapPanel.module.css';
import type { CityType, MapMarker, MapPanelProps, VisitPoint } from '../../../types';
import { useReverseGeocode } from '../../../hooks';
import { useMapMarkers } from '../../../hooks/useMapMarkers';
import { RouteArrows } from './components/RouteArrows';
import { ZoomHandler } from './components/ZoomHandler';

import { extractSectionIndexFromGapId } from '../info-panel/components/route-card/utils';
import { detectMetroCity } from '../../../constants/metroConstants';
import { usePlaceCache } from '../../../context/PlaceCacheContext';
import { useTheme } from '../../../context/ThemeContext';

export const MapPanel = ({
  destinationLat,
  destinationLng,
  destinationName,
  isHotelTicket,
  routeResponse,
  isLoading,
  isInfoPanelCollapsed = false,
  isSelectingMode = false,
  onDestinationSelect,
  selectedGapId,
  onSelectGap,
}: MapPanelProps) => {
  const [selectedPlace, setSelectedPlace] = useState<VisitPoint | null>(null);

  const getInitialCenter = useCallback((): [number, number] => {
    if (destinationLat && destinationLng) {
      return [destinationLat, destinationLng];
    }
    return DEFAULT_CENTER;
  }, [destinationLat, destinationLng]);

  const getInitialZoom = useCallback((): number => {
    if (destinationLat && destinationLng) {
      return HOTEL_ZOOM;
    }
    return DEFAULT_ZOOM;
  }, [destinationLat, destinationLng]);

  const [mapCenter, setMapCenter] = useState<[number, number]>(getInitialCenter);
  const [mapZoom, setMapZoom] = useState<number>(getInitialZoom);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  const [shouldFlyTo, setShouldFlyTo] = useState(false);
  const [targetCenter, setTargetCenter] = useState<[number, number] | null>(null);
  const [targetZoom, setTargetZoom] = useState<number | null>(null);
  const [targetBounds, setTargetBounds] = useState<L.LatLngBounds | null>(null);
  const { reverseGeocode } = useReverseGeocode();
  const { preloadPlace } = usePlaceCache();

  const prevCollapsedRef = useRef(isInfoPanelCollapsed);
  const prevSelectedGapRef = useRef(selectedGapId);
  const isInitialMount = useRef(true);

  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  const tileLayerUrl = getTileLayerUrl(isDarkTheme);
  const tileLayerAtribution = getTileLayerAttribution(isDarkTheme);

  const mapKey = useMemo(() => {
    return theme === 'dark' ? 1 : 0;
  }, [theme]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (destinationLat && destinationLng) {
      const timeoutId = setTimeout(() => {
        setMapCenter([destinationLat, destinationLng]);
        setTargetCenter([destinationLat, destinationLng]);
        setTargetZoom(HOTEL_ZOOM);
        setMapZoom(HOTEL_ZOOM);
        setShouldFlyTo(true);
      }, 0);

      const resetTimeoutId = setTimeout(() => {
        setShouldFlyTo(false);
      }, 1000);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(resetTimeoutId);
      };
    }
  }, [destinationLat, destinationLng]);

  useEffect(() => {
    if (!routeResponse?.visitPoints) {
      return;
    }
    routeResponse.visitPoints.forEach((group) => {
      preloadPlace(group.mainAttraction);
      group.otherAttractions.forEach((point) => preloadPlace(point));
    });
  }, [routeResponse, preloadPlace]);

  const handleClusterClick = useCallback((lat: number, lng: number) => {
    const ZOOM_TO_SHOW_DETAILS = 16;
    setTargetCenter([lat, lng]);
    setTargetZoom(ZOOM_TO_SHOW_DETAILS);
    setShouldFlyTo(true);
    setMapCenter([lat, lng]);
    setMapZoom(ZOOM_TO_SHOW_DETAILS);
    setTimeout(() => setShouldFlyTo(false), 1000);
  }, []);

  const {
    markers,
    clearSelectedMarker,
    handleClusterClick: clusterClickHandler,
  } = useMapMarkers({
    routeResponse,
    isHotelTicket,
    destinationLat,
    destinationLng,
    destinationName,
    currentZoom,
    clusterThreshold: 15,
    onClusterClick: handleClusterClick,
  });

  const visitPoints = useMemo(() => routeResponse?.visitPoints || [], [routeResponse]);

  const allRouteSegments = useMemo(
    () => buildFullRouteSegments(routeResponse, visitPoints, destinationLat, destinationLng),
    [routeResponse, visitPoints, destinationLat, destinationLng],
  );

  const segmentCities = useMemo(() => {
    const cities = new Map<string, CityType>();

    allRouteSegments.forEach((segment) => {
      if (segment.type === 'metro' && segment.routeNumber) {
        const firstPoint = segment.points[0];
        if (firstPoint && firstPoint.length === 2) {
          const city = detectMetroCity(segment.startName || '', {
            lat: firstPoint[0],
            lng: firstPoint[1],
            routeNumber: segment.routeNumber,
          });
          cities.set(segment.id, city);
        }
      }
    });

    return cities;
  }, [allRouteSegments]);

  const segmentsWithCity = useMemo(() => {
    return allRouteSegments.map((segment) => ({
      ...segment,
      metroCity: segment.type === 'metro' ? segmentCities.get(segment.id) : undefined,
    }));
  }, [allRouteSegments, segmentCities]);

  const displayedSegments = useMemo(() => {
    if (!selectedGapId) {
      return segmentsWithCity;
    }

    const sectionMatch = selectedGapId.match(/^section-(\d+)$/);
    const sectionIndex = sectionMatch
      ? parseInt(sectionMatch[1], 10)
      : extractSectionIndexFromGapId(selectedGapId);

    if (sectionIndex === -1) {
      return segmentsWithCity;
    }

    return segmentsWithCity.filter((segment) => {
      const segmentSectionIndex = extractSectionIndexFromGapId(segment.gapId || '');

      if (segmentSectionIndex === sectionIndex) {
        return true;
      }

      if (
        segment.id.includes(`transport-${sectionIndex}-`) ||
        segment.id.includes(`walk-to-section-${sectionIndex}`) ||
        segment.id.includes(`walk-section-${sectionIndex}`) ||
        segment.id.includes(`walk-transport-to-cluster-${sectionIndex}`) ||
        segment.id.includes(`walk-cluster-${sectionIndex}-`) ||
        segment.id.includes(`walk-transfer-${sectionIndex}-`)
      ) {
        return true;
      }

      return false;
    });
  }, [segmentsWithCity, selectedGapId]);

  useEffect(() => {
    if (selectedGapId !== prevSelectedGapRef.current) {
      prevSelectedGapRef.current = selectedGapId;

      if (selectedGapId) {
        const sectionIndex = extractSectionIndexFromGapId(selectedGapId);
        if (sectionIndex !== -1) {
          const sectionPoints: [number, number][] = [];
          allRouteSegments.forEach((segment) => {
            const segmentSectionIndex = extractSectionIndexFromGapId(segment.gapId || '');
            if (
              segmentSectionIndex === sectionIndex ||
              segment.id.includes(`transport-${sectionIndex}-`) ||
              segment.id.includes(`walk-to-section-${sectionIndex}`) ||
              segment.id.includes(`walk-section-${sectionIndex}`) ||
              segment.id.includes(`walk-transport-to-cluster-${sectionIndex}`) ||
              segment.id.includes(`walk-cluster-${sectionIndex}-`) ||
              segment.id.includes(`walk-transfer-${sectionIndex}-`)
            ) {
              segment.points.forEach((point) => {
                if (point && point.length === 2 && !isNaN(point[0]) && !isNaN(point[1])) {
                  sectionPoints.push([point[0], point[1]]);
                }
              });
            }
          });

          if (sectionPoints.length > 0) {
            const bounds = L.latLngBounds(sectionPoints);
            const frameId = requestAnimationFrame(() => {
              setTargetBounds(bounds);
            });
            return () => cancelAnimationFrame(frameId);
          }
        }
      } else {
        const frameId = requestAnimationFrame(() => {
          setTargetBounds(null);
        });
        return () => cancelAnimationFrame(frameId);
      }
    }
  }, [selectedGapId, allRouteSegments]);

  const computedBounds = useMemo(() => {
    if (!selectedGapId || displayedSegments.length === 0) {
      return null;
    }

    const allPoints: [number, number][] = [];
    displayedSegments.forEach((segment) => {
      segment.points.forEach((point) => {
        if (point && point.length === 2 && !isNaN(point[0]) && !isNaN(point[1])) {
          allPoints.push([point[0], point[1]]);
        }
      });
    });

    if (allPoints.length > 1) {
      return L.latLngBounds(allPoints);
    }

    const segment = displayedSegments.find((s) => s.gapId === selectedGapId);
    if (segment && segment.points.length > 1) {
      return L.latLngBounds(segment.points.map((p) => [p[0], p[1]]));
    }

    return null;
  }, [selectedGapId, displayedSegments]);

  useEffect(() => {
    if (destinationLat && destinationLng) {
      clearSelectedMarker();
    }
  }, [destinationLat, destinationLng, clearSelectedMarker]);

  useEffect(() => {
    if (prevCollapsedRef.current !== isInfoPanelCollapsed) {
      prevCollapsedRef.current = isInfoPanelCollapsed;

      const rafId = requestAnimationFrame(() => {
        setMapKey((prev) => prev + 1);
      });

      return () => cancelAnimationFrame(rafId);
    }
  }, [isInfoPanelCollapsed]);

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      const address = await reverseGeocode(lat, lng);
      if (onDestinationSelect) {
        onDestinationSelect(lat, lng, address);
      }
      setTargetCenter([lat, lng]);
      setTargetZoom(16);
      setShouldFlyTo(true);
      setMapCenter([lat, lng]);
      setMapZoom(16);
      setTimeout(() => setShouldFlyTo(false), 2000);
    },
    [reverseGeocode, onDestinationSelect],
  );

  const handleMarkerClick = useCallback(
    (marker: MapMarker) => {
      if (marker.clusterData?.isCluster) {
        clusterClickHandler(marker);
      } else {
        const place = createPlaceFromMarker(marker);
        setSelectedPlace(place);
      }
    },
    [clusterClickHandler],
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <>
      <div className={styles.wrapper}>
        <MapContainer key={mapKey} center={mapCenter} zoom={mapZoom}>
          <MapController
            center={targetCenter || mapCenter}
            zoom={targetZoom || mapZoom}
            shouldUpdate={shouldFlyTo}
            targetBounds={targetBounds || computedBounds}
          />
          <ZoomHandler onZoomChange={setCurrentZoom} />
          <MapResizeHandler isInfoPanelCollapsed={isInfoPanelCollapsed} />
          <MapClickHandler onMapClick={handleMapClick} isSelectingMode={isSelectingMode} />
          <TileLayer attribution={tileLayerAtribution} url={tileLayerUrl} />

          <CurvedRouteSegments
            segments={displayedSegments}
            selectedGapId={selectedGapId}
            onSelectGap={onSelectGap}
          />
          <RouteArrows segments={displayedSegments} />
          <TransportStops routeResponse={routeResponse} />
          <MapMarkers markers={markers} onMarkerClick={handleMarkerClick} />
        </MapContainer>
        <MapHint isSelectingMode={isSelectingMode} />

        {selectedGapId && (
          <div className={styles.selectedGapInfo}>
            <span>
              {selectedGapId.startsWith('section-')
                ? `Участок ${parseInt(selectedGapId.split('-')[1]) + 1}`
                : 'Выбран транспортный сегмент'}
            </span>
            <button onClick={() => onSelectGap?.(null)} className={styles.clearSelectionButton}>
              ✕
            </button>
          </div>
        )}
      </div>
      {selectedPlace && (
        <PlaceDetailsModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      )}
    </>
  );
};
