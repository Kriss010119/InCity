import React from 'react';
import { 
  Landmark, TreePine, Building2, Award, Theater, 
  Church, Microscope, UtensilsCrossed, Palette, 
  Users, Baby, Music, Film, Calendar, ShoppingBag,
  Briefcase, Heart, Castle, Scroll,
  Mountain, Wind, Coffee, Globe,
  BookOpen, Telescope, Sparkles,
  Waves
} from 'lucide-react';

export type FilterOption = {
  id: string;
  name: string;
  icon?: React.ReactNode;
  category?: string;
};

export type FilterCategory = {
  id: string;
  name: string;
  icon?: React.ReactNode;
  options: FilterOption[];
};

export const MAIN_CATEGORIES: FilterCategory[] = [
  {
    id: 'museum',
    name: 'Музеи',
    icon: React.createElement(Landmark),
    options: [
      { id: 'historical', name: 'Исторические музеи', icon: React.createElement(Scroll), category: 'museum' },
      { id: 'art', name: 'Художественные музеи', icon: React.createElement(Palette), category: 'museum' },
      { id: 'nature', name: 'Природные музеи', icon: React.createElement(TreePine), category: 'museum' },
      { id: 'war', name: 'Военные музеи', icon: React.createElement(Award), category: 'museum' },
      { id: 'gallery', name: 'Галереи', icon: React.createElement(Palette), category: 'museum' },
      { id: 'general-museum', name: 'Общие музеи', icon: React.createElement(Landmark), category: 'museum' },
    ],
  },
  {
    id: 'park-and-garden',
    name: 'Парки и сады',
    icon: React.createElement(TreePine),
    options: [
      { id: 'urban', name: 'Городские парки', icon: React.createElement(TreePine), category: 'park-and-garden' },
      { id: 'natural', name: 'Природные парки', icon: React.createElement(Mountain), category: 'park-and-garden' },
    ],
  },
  {
    id: 'architecture',
    name: 'Архитектура',
    icon: React.createElement(Building2),
    options: [
      { id: 'historic-architecture', name: 'Историческая архитектура', icon: React.createElement(Castle), category: 'architecture' },
      { id: 'castles', name: 'Замки и дворцы', icon: React.createElement(Castle), category: 'architecture' },
    ],
  },
  {
    id: 'monument',
    name: 'Памятники',
    icon: React.createElement(Award),
    options: [
      { id: 'sculpture', name: 'Скульптуры', icon: React.createElement(Award), category: 'monument' },
      { id: 'memorials', name: 'Мемориалы', icon: React.createElement(Award), category: 'monument' },
      { id: 'fountains', name: 'Фонтаны', icon: React.createElement(Wind), category: 'monument' },
    ],
  },
  {
    id: 'theatre',
    name: 'Театры и концерты',
    icon: React.createElement(Theater),
    options: [
      { id: 'academic', name: 'Академические театры', icon: React.createElement(Theater), category: 'theatre' },
      { id: 'concert-hall', name: 'Концертные залы', icon: React.createElement(Music), category: 'theatre' },
      { id: 'cinema-hall', name: 'Кинотеатры', icon: React.createElement(Film), category: 'theatre' },
    ],
  },
  {
    id: 'religious',
    name: 'Религиозные объекты',
    icon: React.createElement(Church),
    options: [
      { id: 'christian', name: 'Христианские', icon: React.createElement(Church), category: 'religious' },
      { id: 'monasteries', name: 'Монастыри', icon: React.createElement(Church), category: 'religious' },
      { id: 'muslim', name: 'Мусульманские', icon: React.createElement(Church), category: 'religious' },
      { id: 'jewish', name: 'Иудейские', icon: React.createElement(Church), category: 'religious' },
    ],
  },
  {
    id: 'science-education',
    name: 'Наука и образование',
    icon: React.createElement(Microscope),
    options: [
      { id: 'libraries', name: 'Библиотеки', icon: React.createElement(BookOpen), category: 'science-education' },
      { id: 'observatories', name: 'Обсерватории', icon: React.createElement(Telescope), category: 'science-education' },
      { id: 'planetariums', name: 'Планетарии', icon: React.createElement(Globe), category: 'science-education' },
    ],
  },
  {
    id: 'gastronomy',
    name: 'Гастрономия',
    icon: React.createElement(UtensilsCrossed),
    options: [
      { id: 'restaurant', name: 'Рестораны', icon: React.createElement(UtensilsCrossed), category: 'gastronomy' },
      { id: 'cafe', name: 'Кафе', icon: React.createElement(Coffee), category: 'gastronomy' },
      { id: 'fine-dining', name: 'Высокая кухня', icon: React.createElement(Award), category: 'gastronomy' },
    ],
  },
  {
    id: 'contemporary-art',
    name: 'Современное искусство',
    icon: React.createElement(Palette),
    options: [
      { id: 'contemporary-galleries', name: 'Галереи совр. искусства', icon: React.createElement(Palette), category: 'contemporary-art' },
      { id: 'public-art', name: 'Паблик-арт', icon: React.createElement(Sparkles), category: 'contemporary-art' },
    ],
  },
  {
    id: 'famous-people',
    name: 'Знаменитые люди',
    icon: React.createElement(Users),
    options: [
      { id: 'house-museums', name: 'Дома-музеи', icon: React.createElement(Building2), category: 'famous-people' },
      { id: 'residences', name: 'Резиденции', icon: React.createElement(Castle), category: 'famous-people' },
    ],
  },
  {
    id: 'children',
    name: 'Детские объекты',
    icon: React.createElement(Baby),
    options: [
      { id: 'aquariums', name: 'Аквариумы', icon: React.createElement(Waves), category: 'children' },
      { id: 'dolphinarium', name: 'Дельфинарии', icon: React.createElement(Waves), category: 'children' },
      { id: 'circuses', name: 'Цирки', icon: React.createElement(Baby), category: 'children' },
      { id: 'zoos', name: 'Зоопарки', icon: React.createElement(TreePine), category: 'children' },
    ],
  },
];


export const EVENT_TYPES: FilterCategory = {
  id: 'events',
  name: 'Типы событий',
  icon: React.createElement(Calendar, { size: 16 }),
  options: [
    { id: 'cinema', name: 'Кинопоказы', icon: React.createElement(Film, { size: 16 }), category: 'events' },
    { id: 'exhibitions', name: 'Выставки', icon: React.createElement(Palette, { size: 16 }), category: 'events' },
    { id: 'concerts', name: 'Концерты', icon: React.createElement(Music, { size: 16 }), category: 'events' },
    { id: 'festivals', name: 'Фестивали', icon: React.createElement(Calendar, { size: 16 }), category: 'events' },
    { id: 'fairs', name: 'Ярмарки', icon: React.createElement(ShoppingBag, { size: 16 }), category: 'events' },
    { id: 'business', name: 'Бизнес-ивенты', icon: React.createElement(Briefcase, { size: 16 }), category: 'events' },
    { id: 'kids-events', name: 'Детские события', icon: React.createElement(Baby, { size: 16 }), category: 'events' },
    { id: 'charity', name: 'Благотворительные акции', icon: React.createElement(Heart, { size: 16 }), category: 'events' },
  ],
};

export const DURATION_OPTIONS = [
  { id: 'very-short', name: 'Очень короткий', description: 'до 2 часов' },
  { id: 'short',      name: 'Короткий',       description: '2-3 часа' },
  { id: 'medium',     name: 'Средний',        description: '3-6 часов' },
  { id: 'long',       name: 'Длинный',        description: 'от 6 часов' },
];

export const TRANSPORT_OPTIONS = [
  { id: 'metro',      name: 'Метро' },
  { id: 'bus',        name: 'Автобус' },
  { id: 'tram',       name: 'Трамвай' },
  { id: 'trolleybus', name: 'Троллейбус' },
];

export const mapAttractionsToBackend = (attractions: string[]) => {
  const main: string[] = [];
  const sub: string[] = [];
  
  attractions.forEach(id => {
    if (id === 'historical' || id === 'art' || id === 'nature' || id === 'war' || 
        id === 'gallery' || id === 'general-museum') {
      main.push('museum');
      sub.push(id);
    }
    else if (id === 'urban' || id === 'natural') {
      main.push('park-and-garden');
      sub.push(id);
    }
    else if (id === 'historic-architecture' || id === 'castles') {
      main.push('architecture');
      sub.push(id);
    }
    else if (id === 'sculpture' || id === 'memorials' || id === 'fountains') {
      main.push('monument');
      sub.push(id);
    }
    else if (id === 'academic' || id === 'concert-hall' || id === 'cinema-hall') {
      main.push('theatre');
      sub.push(id);
    }
    else if (id === 'christian' || id === 'monasteries' || id === 'muslim' || id === 'jewish') {
      main.push('religious');
      sub.push(id);
    }
    else if (id === 'libraries' || id === 'observatories' || id === 'planetariums') {
      main.push('science-education');
      sub.push(id);
    }
    else if (id === 'restaurant' || id === 'cafe' || id === 'fine-dining') {
      main.push('gastronomy');
      sub.push(id);
    }
    else if (id === 'contemporary-galleries' || id === 'public-art') {
      main.push('contemporary-art');
      sub.push(id);
    }
    else if (id === 'house-museums' || id === 'residences') {
      main.push('famous-people');
      sub.push(id);
    }
    else if (id === 'aquariums' || id === 'dolphinarium' || id === 'circuses' || id === 'zoos') {
      main.push('children');
      sub.push(id);
    }
  });
  
  return { main, sub };
};

export const FILTER_CATEGORIES = MAIN_CATEGORIES;
export const OBJECT_CATEGORIES = MAIN_CATEGORIES;
export const ALL_FILTER_OPTIONS = MAIN_CATEGORIES.flatMap(c => c.options);