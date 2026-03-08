import { 
  Building2, TreePine, Landmark, Drama, 
  UtensilsCrossed, Hotel 
} from 'lucide-react';

export const CATEGORY_COLORS: Record<string, string> = {
  'Музеи и галереи': '#e30611',
  'Парки и сады': '#2e7d32',
  'Детские объекты': '#ff6d00',
  'Достопримечательности': '#ffdd2d',
  'Отель': '#1976d2',
  'Рестораны': '#c2185b',
  'Театры': '#7b1fa2',
  'Зоопарки и аквариумы': '#ff6d00',
  'Музеи искусств': '#e30611',
  'Городские парки': '#2e7d32'
};

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Музеи и галереи': <Landmark size={64} />,
  'Парки и сады': <TreePine size={64} />,
  'Детские объекты': <Building2 size={64} />,
  'Достопримечательности': <Landmark size={64} />,
  'Отель': <Hotel size={64} />,
  'Рестораны': <UtensilsCrossed size={64} />,
  'Театры': <Drama size={64} />,
  'Зоопарки и аквариумы': <Building2 size={64} />,
  'Музеи искусств': <Landmark size={64} />,
  'Городские парки': <TreePine size={64} />
};

export const WEEKDAYS_MAP: Record<string, string> = {
  'Mo': 'Пн', 'Tu': 'Вт', 'We': 'Ср', 'Th': 'Чт', 
  'Fr': 'Пт', 'Sa': 'Сб', 'Su': 'Вс'
};

export const EXCLUDED_TAGS = [
  'name', 'type', 'image', 'wikidata', 'wikipedia', 
  'wikimedia_commons', 'phone', 'website', 'opening_hours', 'payment'
];