import { ExternalLink } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale';
import styles from '../../PlaceDetailsModal.module.css';

type DescriptionProps = {
  text: string;
  wikipediaUrl?: string;
};

export const Description = ({ text, wikipediaUrl }: DescriptionProps) => {
  const { t } = useLocale();

  return (
    <div className={styles.description}>
      <h3>{t('placeDetails.about')}</h3>
      <p>{text}</p>

      {wikipediaUrl && (
        <a
          href={wikipediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.readMore}
        >
          {t('placeDetails.readMore')}
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
};
