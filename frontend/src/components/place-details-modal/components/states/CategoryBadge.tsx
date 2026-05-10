import { CATEGORY_COLORS } from '../../constants';
import type { CategoryBadgeProps } from '../../../../types';
import styles from '../../PlaceDetailsModal.module.css';

export const CategoryBadge = ({ category, subcategory }: CategoryBadgeProps) => {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS[subcategory] || '#6b6b6b';

  return (
    <div className={styles.category} style={{ backgroundColor: color }}>
      {category} • {subcategory}
    </div>
  );
};
