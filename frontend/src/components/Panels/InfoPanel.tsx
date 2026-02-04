/* eslint-disable @typescript-eslint/no-unused-vars */
import { Clock, Navigation, Award, MapPin } from 'lucide-react';
import styles from './InfoPanel.module.css';
import type { Attraction, RouteStep } from '../../types/types';

type InfoPanelProps = {
  routeData?: {
    from?: string;
    to?: string;
  } | null;
}

export const InfoPanel = ({ routeData }: InfoPanelProps) => {
  const routeInfo = {
    distance: '15.2 км',
    time: '45 мин',
    points: 8,
    transport: 1
  };

  const routeSteps: RouteStep[] = [
    { id: 1, action: 'Станция 1', location: 'Станция 1', time: 40},
    { id: 2, action: 'Станция 2', location: 'Станция 2', time: 30},
    { id: 3, action: 'Станция 3', location: 'Станция 3', time: 40},
    { id: 4, action: 'Музей', location: 'Музей адрес', time: 100},
  ];

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Информация о маршруте</h3>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <Navigation size={20} />
          <span className={styles.value}>{routeInfo.distance}</span>
          <span className={styles.label}>Расстояние</span>
        </div>
        <div className={styles.stat}>
          <Clock size={20} />
          <span className={styles.value}>{routeInfo.time}</span>
          <span className={styles.label}>Время</span>
        </div>
        <div className={styles.stat}>
          <MapPin size={20} />
          <span className={styles.value}>{routeInfo.points}</span>
          <span className={styles.label}>Точек</span>
        </div>
        <div className={styles.stat}>
          <MapPin size={20} />
          <span className={styles.value}>{routeInfo.transport}</span>
          <span className={styles.label}>Пересадки</span>
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>План маршрута</h4>
        <div className={styles.steps}>
          {routeSteps.map((step, index) => (
            <div key={step.id} className={styles.step}>
              <div className={styles.number}>{index + 1}</div>
              <div className={styles.stepInfo}>
                <span className={styles.action}>{step.action}</span>
                <span className={styles.location}>{step.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};