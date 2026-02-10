import styles from './Footer.module.css';
import { useLocale } from '../../hooks/useLocale';

export const Footer = () => {
  const { t } = useLocale();
  
  return (
    <footer className={styles.footer}>
      <div className={styles["footer-content"]}>
        <div className={styles["footer-logo"]}>
          <img
            src="/icons/TBankIcon.svg"
            alt="T-Bank"
            className={styles["footer-icon"]}
          />
          <span className={styles["footer-app-name"]}>InCity</span>
        </div>

        <nav className={styles["footer-nav"]}>
          <a href="/" className={styles["footer-link"]}>{t('nav.home')}</a>
          <a href="/map" className={styles["footer-link"]}>{t('nav.map')}</a>
          <a 
            href="https://www.tbank.ru/travel/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles["footer-link"]}
          >
            Т-Путешествия
          </a>
          <a 
            href="https://www.hse.ru" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles["footer-link"]}
          >
            НИУ ВШЭ
          </a>
        </nav>
      </div>

      <div className={styles["footer-bottom"]}>
        <div className={styles["footer-developers"]}>
          {t('footer.developers')}
        </div>
        <div className={styles["footer-copyright"]}>
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
};