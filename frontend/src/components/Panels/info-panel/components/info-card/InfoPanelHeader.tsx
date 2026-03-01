import { ChevronRight } from 'lucide-react';
import styles from '../../InfoPanel.module.css';
import { useLocale } from '../../../../../hooks';

interface InfoPanelHeaderProps {
  isCollapsed: boolean;
  onCollapse: () => void;
}

export const InfoPanelHeader = ({ isCollapsed, onCollapse }: InfoPanelHeaderProps) => {
  const { t } = useLocale();
  
  return (
    <div className={styles.panelHeader}>
      <button 
        className={styles.collapseButton}
        onClick={onCollapse}
        aria-label={isCollapsed ? t('infoPanel.expand') : t('infoPanel.hide')}
      >
        <ChevronRight size={16} />
        <span className={styles.collapseButtonText}>
          {isCollapsed ? t('infoPanel.expand') : t('infoPanel.hide')}
        </span>
      </button>
    </div>
  );
};