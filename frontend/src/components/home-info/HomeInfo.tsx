import { useLocale } from '../../hooks';
import { CompactInputForm } from '../CompactInputForm/CompactInputForm';
import styles from './HomeInfo.module.css';
import { InfoCard } from './InfoCard';
import type { HomeInfoItem } from './types';

export const HomeInfo = () => {
  const { t } = useLocale();
  const items = t<HomeInfoItem[]>('infoSection.items');

  return (
    <div>
      <section className={styles['info-section']}>
        {Array.isArray(items) &&
          items.map((item: HomeInfoItem, i: number) => <InfoCard key={i} item={item} i={i} />)}
      </section>

      <section className={styles['form-section']} id="form">
        <CompactInputForm />
      </section>
    </div>
  );
};
