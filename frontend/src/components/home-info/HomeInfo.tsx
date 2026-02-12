import { useLocale } from '../../hooks';
import styles from './HomeInfo.module.css';
import { InfoCard } from './InfoCard';
import type { HomeInfoItem } from './types';

export const HomeInfo = () => {
  const { t } = useLocale();
  const items = t<HomeInfoItem[]>('infoSection.items');

  return (
    <section className={styles['info-section']}>
      {Array.isArray(items) &&
        items.map((item: HomeInfoItem, i: number) => <InfoCard key={i} item={item} i={i} />)}
    </section>
  );
};