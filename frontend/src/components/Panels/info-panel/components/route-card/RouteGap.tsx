import { Bus, Train } from 'lucide-react';
import type { RouteGapProps } from '../types';
import styles from './RouteCard.module.css';
import { useLocale } from '../../../../../hooks';

export const RouteGap = ({ gap }: RouteGapProps) => {
  const { t } = useLocale();
  
  const getTransportIcon = (transport: string) => {
    return transport === 'metro' ? 
      <Train size={14} className={styles.transportIcon} /> : 
      <Bus size={14} className={styles.transportIcon} />;
  };

  return (
    <div className={styles.gap}>
      <div className={styles.gapHeader}>
        <div className={styles.gapTransport}>
          {getTransportIcon(gap.transport)}
          <span className={styles.gapRouteNumber}>
            {gap.transport === 'metro' ? t('transport.metro') : t('transport.bus')} {gap.routeNumber}
          </span>
        </div>
      </div>
      
      <div className={styles.gapStops}>
        <div className={styles.stop}>
          <div className={styles.stopDot} />
          <span className={styles.stopName}>{gap.startNode.name}</span>
        </div>
        
        {gap.nodesVisited.map((node) => (
          <div key={node.nodeId} className={styles.stop}>
            <div className={styles.stopDotSmall} />
            <span className={styles.stopNameSmall}>{node.name}</span>
          </div>
        ))}
        
        <div className={styles.stop}>
          <div className={styles.stopDotEnd} />
          <span className={styles.stopName}>{gap.endNode.name}</span>
        </div>
      </div>
    </div>
  );
};