import { Link } from 'react-router-dom';
import { Footer, Header } from '../../components';
import styles from './NotFound.module.css';

export const NotFound = () => {
  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.code}>404</div>
          <h1 className={styles.title}>Страница не найдена</h1>
          <p className={styles.text}>
            Похоже, вы забрели в незнакомое место. 
            Но не волнуйтесь, мы поможем вернуться на главную!
          </p>
          <Link to="/" className={styles.button}>
            Вернуться на главную
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
};