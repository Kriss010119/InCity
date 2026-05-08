import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tooltip } from 'react-leaflet';
import { Clock, MapPin, Building2 } from 'lucide-react';
import type { MapMarker } from '../../../../types';
import { getCategoryColor } from '../../../../utils/categoryUtils';
import styles from '../MapPanel.module.css';
import { usePlaceCache } from '../../../../context/PlaceCacheContext';

type MarkerTooltipProps = {
  marker: MapMarker;
};

export const MarkerTooltip = ({ marker }: MarkerTooltipProps) => {
  const { getCachedData } = usePlaceCache();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageError(false);
  }, [marker.placeData]);

  const cachedData = useMemo(() => {
    if (!marker.placeData) return null;
    return getCachedData(marker.placeData.id);
  }, [marker.placeData, getCachedData]);

  const image = useMemo(() => {
    if (imageError) return null;
    return cachedData?.images?.[0] ?? null;
  }, [cachedData, imageError]);

  const description = useMemo(() => {
    return cachedData?.details?.wikipediaExtract ?? null;
  }, [cachedData]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const categoryLabel =
    marker.type === 'selected'
      ? 'Точка назначения'
      : marker.type === 'end'
        ? 'Отель'
        : marker.category || 'Достопримечательность';
  const isSpecial = marker.type === 'selected' || marker.type === 'end';
  const categoryColor = isSpecial ? '#FFD700' : getCategoryColor(marker.category || '');

  return (
    <Tooltip
      direction="top"
      offset={[0, -18]}
      opacity={1}
      permanent={false}
      className={styles.markerTooltip}
      interactive={false}
    >
      <div className={styles.tooltipCard}>
        {image && !imageError ? (
          <div className={styles.tooltipImage}>
            <img src={image} alt={marker.title} loading="lazy" onError={handleImageError} />
          </div>
        ) : (
          <div className={styles.tooltipImagePlaceholder}>
            <Building2 size={24} className={styles.icon} />
          </div>
        )}

        <div className={styles.tooltipBody}>
          <h4 className={styles.tooltipTitle}>{marker.title}</h4>

          <span
            className={styles.tooltipBadge}
            style={{ backgroundColor: categoryColor, borderColor: categoryColor }}
          >
            {categoryLabel}
          </span>

          {marker.address && (
            <div className={styles.tooltipAddress}>
              <MapPin size={12} className={styles.icon} />
              <span>{marker.address}</span>
            </div>
          )}

          {marker.estimatedTime && !isSpecial && (
            <div className={styles.tooltipTime}>
              <Clock size={12} className={styles.icon} />
              <span>~{marker.estimatedTime} мин</span>
            </div>
          )}

          {description ? (
            <p className={styles.tooltipDescription}>{description.substring(0, 200)}...</p>
          ) : (
            marker.type === 'point' && (
              <p className={styles.tooltipHint}>Нажмите, чтобы узнать больше</p>
            )
          )}
        </div>
      </div>
    </Tooltip>
  );
};
