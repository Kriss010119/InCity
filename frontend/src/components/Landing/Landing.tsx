import styles from './Landing.module.css';
import { useRef } from 'react';
import { TransportIcon } from '../transport-icon/TransportIcon';
import { useLocale } from '../../hooks/useLocale';

export const Landing = () => {
  const borderFrameRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  const handleScrollToForm = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const formElement = document.getElementById('form');
    if (formElement) {
      const offset = 70;
      const elementPosition = formElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className={styles.landing}>
      <div className={styles['transport-container']}>
        <TransportIcon key="car" type="car" />
        <TransportIcon key="plane" type="plane" />
        <TransportIcon key="train" type="train" />
      </div>

      <div className={styles['landing-container']}>
        <div className={styles['title-border']}>
          <div className={styles['border-frame']} ref={borderFrameRef}></div>

          <h1 className={styles['main-title']}>{t('landing.title')}</h1>

          <p className={styles['subtitle']}>{t('landing.subtitle')}</p>

          <a href="#form" onClick={handleScrollToForm}>
            Построить маршрут
          </a>
        </div>
      </div>
    </section>
  );
};
