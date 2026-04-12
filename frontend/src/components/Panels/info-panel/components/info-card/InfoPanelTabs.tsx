import { useLocale } from '../../../../../hooks';
import styles from './InfoCard.module.css';

interface InfoPanelTabsProps {
  activeTab: 'route' | 'attractions';
  onTabChange: (tab: 'route' | 'attractions') => void;
}

export const InfoPanelTabs = ({ activeTab, onTabChange }: InfoPanelTabsProps) => {
  const { t } = useLocale();
  
  return (
    <div className={styles.tabs}>
      <button
        className={`${styles.tab} ${activeTab === 'route' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('route')}
      >
        {t('infoPanel.route')}
      </button>
      <button
        className={`${styles.tab} ${activeTab === 'attractions' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('attractions')}
      >
        {t('infoPanel.attractions')}
      </button>
    </div>
  );
};