import { Map, Sliders, Info } from 'lucide-react';
import styles from './MobileTabBar.module.css';

export type MobileTab = 'input' | 'map' | 'info';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  hasRouteData?: boolean;
}

export const MobileTabBar = ({ activeTab, onTabChange }: MobileTabBarProps) => {
  const handleTabChange = (tab: MobileTab) => {
    onTabChange(tab);
  };

  return (
    <div className={styles.mobileTabBar}>
      <button
        className={`${styles.tabButton} ${activeTab === 'input' ? styles.active : ''}`}
        onClick={() => handleTabChange('input')}
      >
        <Sliders size={20} />
        <span>Маршрут</span>
      </button>
      
      <button
        className={`${styles.tabButton} ${activeTab === 'map' ? styles.active : ''}`}
        onClick={() => handleTabChange('map')}
      >
        <Map size={20} />
        <span>Карта</span>
      </button>
      
      <button
        className={`${styles.tabButton} ${activeTab === 'info' ? styles.active : ''}`}
        onClick={() => handleTabChange('info')}
      >
        <Info size={20} />
        <span>Детали</span>
      </button>
    </div>
  );
};