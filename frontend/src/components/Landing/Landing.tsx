import styles from './Landing.module.css';
import { useRef, useState } from 'react';
import { TransportIcon } from '../transport-icon/TransportIcon';
import { useLocale } from '../../hooks/useLocale';
import { useTicket } from '../../context/TicketContext';

export const Landing = () => {
    const borderFrameRef = useRef<HTMLDivElement>(null);
    const { ticketData } = useTicket();
    const [, setIsTicketApplied] = useState(!!ticketData);
    const { t } = useLocale();
    
    return (
        <section className={styles.landing}>
            <div className={styles["transport-container"]}>
                <TransportIcon key="car" type="car" />
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
                        {t('landing.title')}
                    </h1>
                    
                    <p className={styles["subtitle"]}>
                        {t('landing.subtitle')}
                    </p>
                </div>
            </div>
        </section>
    );
};