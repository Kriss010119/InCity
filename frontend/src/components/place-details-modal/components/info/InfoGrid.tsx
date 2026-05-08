import { MapPin, Phone, Calendar, DollarSign, Users } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale';
import { InfoCard } from './InfoCard';
import type { VisitPoint } from '../../../../types';
import styles from '../../PlaceDetailsModal.module.css';
import { extractTagValue, formatOpeningHours } from '../../../../utils/categoryUtils';

type PlaceDetails = {
  address?: string;
  phone?: string;
  openingHours?: string;
  website?: string;
  price?: string;
  ageRestriction?: number | string;
};

type InfoGridProps = {
  place: VisitPoint;
  details: Partial<PlaceDetails>;
};

export const InfoGrid = ({ place, details }: InfoGridProps) => {
  const { t } = useLocale();
  const extractValue = (key: string) => extractTagValue(place.tags, key);

  return (
    <div className={styles.infoGrid}>
      {(details.address || extractValue('addr:street')) && (
        <InfoCard icon={<MapPin size={20} />} title={t('placeDetails.address')}>
          {details.address ||
            `${extractValue('addr:street') || ''} ${extractValue('addr:housenumber') || ''}`.trim()}
        </InfoCard>
      )}

      {details.phone && (
        <InfoCard icon={<Phone size={20} />} title={t('placeDetails.phone')}>
          <a href={`tel:${details.phone}`} className={styles.phoneLink}>
            {details.phone}
          </a>
        </InfoCard>
      )}

      {details.openingHours && (
        <InfoCard icon={<Calendar size={20} />} title={t('placeDetails.workingHours')}>
          <div className={styles.openingHours}>
            {formatOpeningHours(details.openingHours)
              .split(';')
              .map((line, i) => (
                <div key={i} className={styles.hoursLine}>
                  {line.trim()}
                </div>
              ))}
          </div>
        </InfoCard>
      )}

      {details.price && (
        <InfoCard icon={<DollarSign size={20} />} title={t('placeDetails.price')}>
          <span className={styles.price}>{details.price}</span>
        </InfoCard>
      )}

      {details.ageRestriction && (
        <InfoCard icon={<Users size={20} />} title={t('placeDetails.ageRestriction')}>
          <span className={styles.ageRestriction}>{details.ageRestriction}+</span>
        </InfoCard>
      )}
    </div>
  );
};
