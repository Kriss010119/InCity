import { TransportIcon } from '../';
import styles from './Landing.module.css';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

export const Landing = () => {
    const borderFrameRef = useRef<HTMLDivElement>(null);
    
    return (
        <section className={styles.landing}>
            <div className={styles["transport-container"]}>
                <TransportIcon 
                    key="car" 
                    type="car" 
                />
                <TransportIcon key="plane" type="plane" />
                <TransportIcon key="train" type="train" />
            </div>
            
            <div className={styles["landing-container"]}>
                <div className={styles["title-border"]}>
                    <div 
                        className={styles["border-frame"]} 
                        ref={borderFrameRef}
                    ></div>
                    
                    <h1 className={styles["main-title"]}>
                        Исследуй маршруты и открывай новое вместе с InCity
                    </h1>
                    
                    <p className={styles["subtitle"]}>
                        Путешествия, события и достопримечательности — 
                        всё в одном месте благодаря интеллектуальному планировщику
                    </p>
                </div>
                
                <Link to="/map" className={styles["cta-button"]}>
                    Начать планировать
                </Link>
            </div>
        </section>
    );
}