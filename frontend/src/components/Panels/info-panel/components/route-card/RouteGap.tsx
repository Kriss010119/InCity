import { getTransportIcon, getTransportColor, getTransportLabel } from '../../../../../constants/transportConstants';
import type { RouteGapProps } from '../../../../../types';
import styles from './RouteCard.module.css';

interface ExtendedRouteGapProps extends RouteGapProps {
  gapId: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const RouteGap = ({ gap, gapId, isSelected, onSelect }: ExtendedRouteGapProps) => {
  const Icon = getTransportIcon(gap.transport);
  const iconColor = getTransportColor(gap.transport);
  const transportLabel = getTransportLabel(gap.transport);

  return (
    <div 
      id={gapId}
      className={`${styles.gap} ${isSelected ? styles.active : ''}`}
      onClick={onSelect}
      data-gap-id={gapId}
    >
      <div className={styles.gapHeader}>
        <div className={styles.gapTransport}>
          <Icon size={16} style={{ color: iconColor }} className={styles.transportIcon} />
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