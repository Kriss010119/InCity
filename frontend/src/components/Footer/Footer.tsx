import styles from './Footer.module.css';

export const Footer = () => {
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
          <a href="/" className={styles["footer-link"]}>Главная</a>
          <a href="/map" className={styles["footer-link"]}>Карта</a>
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
          Разработано студентами 2 курса НИУ ВШЭ ФКН ПИ Осиной Дарьей и Кудрявцевым Георгием
        </div>
        <div className={styles["footer-copyright"]}>
          © 2026 InCity. Все права защищены.
        </div>
      </div>
    </footer>
  );
}