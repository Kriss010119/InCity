import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from './InfoCard.module.css';
import { useLocale } from '../../../../../hooks';

interface InfoPanelHeaderProps {
  isCollapsed: boolean;
  onCollapse: () => void;
}

export const InfoPanelHeader = ({ isCollapsed, onCollapse }: InfoPanelHeaderProps) => {
  const { t } = useLocale();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return null;
  }

  return (
    <div className={isCollapsed ? styles.collapsedHeader : styles.panelHeader}>
      <button
        className={`${styles.collapseButton} ${isCollapsed ? styles.fixedButton : ''}`}
        onClick={onCollapse}
        aria-label={isCollapsed ? t('infoPanel.expand') : t('infoPanel.hide')}
      >
        <ChevronRight
          size={16}
          style={{
            transform: isCollapsed ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.3s ease',
          }}
        />
        <span className={styles.collapseButtonText}>
          {isCollapsed ? t('infoPanel.expand') : t('infoPanel.hide')}
        </span>
      </button>
    </div>
  );
};
