import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../hooks/useLocale';
import styles from './Header.module.css';

export const Header = () => {
  const { toggleTheme, themeIcon } = useTheme();
  const { t } = useLocale();

  return (
    <header className={styles.header}>
      <div className={styles["logo-container"]}>
        <a href="https://www.tbank.ru/travel/" target="_blank" rel="noopener noreferrer">
            <img
            src="/icons/TBankIcon.svg"
            alt="T-Bank"
            className={styles['tbank-icon']}
            />
        </a>
        <span className={styles.logo}>InCity</span>
        
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${styles["nav-link"]} ${isActive ? styles.active : ''}`
          }
          end
        >
          {t('nav.home')}
        </NavLink>

        <NavLink
          to="/map"
          className={({ isActive }) =>
            `${styles["nav-link"]} ${isActive ? styles.active : ''}`
          }
        >
          {t('nav.map')}
        </NavLink>
      </nav>

      <button 
        className={styles["theme-toggle"]} 
        onClick={toggleTheme} 
        aria-label="Toggle theme"
      >
        <img 
          src={themeIcon} 
          alt="Theme icon" 
          className={styles['theme-icon']} 
        />
      </button>
    </header>
  );
}