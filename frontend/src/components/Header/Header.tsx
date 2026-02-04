import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import styles from './Header.module.css';

export const Header = () => {
  const { toggleTheme, themeIcon } = useTheme();

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
          Главная
        </NavLink>

        <NavLink
          to="/map"
          className={({ isActive }) =>
            `${styles["nav-link"]} ${isActive ? styles.active : ''}`
          }
        >
          Карта
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