/* eslint-disable @typescript-eslint/no-explicit-any */

import { useInView, useLocale } from '../../hooks';

import styles from './HomeInfo.module.css';

export const HomeInfo = () => {
  const { t } = useLocale();
  const items = t('infoSection.items');

  return (
    <section className={styles["info-section"]}>
      {Array.isArray(items) && items.map((item: any, i: number) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { ref, isVisible } = useInView(0.3);
        
        return (
          <div
            key={i}
            ref={ref}
            className={`
                ${styles['info-card']}
                ${isVisible ? styles['visible'] : ''}
                ${i % 2 === 0 ? styles['even'] : styles['odd']}
                `.trim()}
            style={{
              transitionDelay: isVisible ? `${i * 0.01}s` : '0s'
            }}
          >
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        );
      })}
    </section>
  );
}