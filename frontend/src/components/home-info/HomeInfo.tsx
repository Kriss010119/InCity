import { useLocale } from '../../hooks';
import type { HomeInfoItem } from '../../types';
import { CompactInputForm } from '../CompactInputForm/CompactInputForm';
import styles from './HomeInfo.module.css';
import { InfoCard } from './InfoCard';


export const HomeInfo = () => {
  const { t } = useLocale();
  const items = t<HomeInfoItem[]>('infoSection.items');

  return (
    <div>
      <section className={styles['info-section']}>
        {Array.isArray(items) && items.map((item: HomeInfoItem, i: number) => <InfoCard key={i} item={item} i={i} />)}      
      </section>

     <section className={styles['info-section']} id='form'>
          <CompactInputForm />
          <img src='' alt='Пример построенного маршрута на карте'></img>
      </section>
    </div>
  );
};