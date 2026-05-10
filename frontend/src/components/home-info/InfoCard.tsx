import { useInView } from '../../hooks';
import styles from './HomeInfo.module.css';


export const InfoCard = ({ item, i }: { item: any; i: number }) => {
  const { ref, isVisible } = useInView(0.3);

  return (
    <div
      ref={ref}
      className={`
        ${styles['info-card']}
        ${isVisible ? styles['visible'] : ''}
        ${i % 2 === 0 ? styles['even'] : styles['odd']}
      `.trim()}
      style={{
        transitionDelay: isVisible ? `${i * 0.01}s` : '0s',
      }}
    >
      <h3>{item.title}</h3>
      <p>{item.text}</p>
    </div>
  );
};
