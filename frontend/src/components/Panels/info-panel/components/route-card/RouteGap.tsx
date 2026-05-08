import {
  getTransportIcon,
  getTransportColor,
  getTransportLabel,
} from '../../../../../constants/transportConstants';
import type { RouteGapProps } from '../../../../../types';
import styles from './RouteCard.module.css';

interface ExtendedRouteGapProps extends RouteGapProps {
  gapId: string;
  isSelected: boolean;
  onSelect: () => void;
}

const renderTransportIcon = (transport: string, color: string) => {
  const IconComponent = getTransportIcon(transport);
  return <IconComponent style={{ color }} className={styles.transportIcon} />;
};

export const RouteGap = ({ gap, gapId, isSelected, onSelect }: ExtendedRouteGapProps) => {
  const iconColor = getTransportColor(gap.transport, gap.routeNumber, gap.startNode.name, {
    lat: gap.startNode.latitude,
    lng: gap.startNode.longitude,
    routeNumber: gap.routeNumber,
  });

  const transportLabel = getTransportLabel(gap.transport, gap.routeNumber, gap.startNode.name, {
    lat: gap.startNode.latitude,
    lng: gap.startNode.longitude,
    routeNumber: gap.routeNumber,
  });

  return (
    <div
      id={gapId}
      className={`${styles.gap} ${isSelected ? styles.active : ''}`}
      onClick={onSelect}
      data-gap-id={gapId}
    >
      <div className={styles.gapHeader}>
        <div className={styles.gapTransport}>
          {renderTransportIcon(gap.transport, iconColor)}
          <span className={styles.gapRouteNumber}>
            {gap.transport === 'walk'
              ? transportLabel
              : `${transportLabel} №${gap.routeNumber || ''}`.trim()}
          </span>
        </div>
      </div>

      <div className={styles.gapStops}>
        <div className={styles.stop}>
          <div className={styles.stopDot} style={{ backgroundColor: iconColor }} />
          <span className={styles.stopName}>{gap.startNode.name}</span>
        </div>

        {gap.nodesVisited.map((node) => (
          <div key={node.nodeId} className={styles.stop}>
            <div className={styles.stopDotSmall} />
            <span className={styles.stopNameSmall}>{node.name}</span>
          </div>
        ))}

        <div className={styles.stop}>
          <div className={styles.stopDotEnd} style={{ backgroundColor: iconColor }} />
          <span className={styles.stopName}>{gap.endNode.name}</span>
        </div>
      </div>
    </div>
  );
};
