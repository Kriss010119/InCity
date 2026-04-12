/* eslint-disable react-refresh/only-export-components */
import { 
  Landmark, TreePine, Building2, Award, Theater, 
  Church, Microscope, UtensilsCrossed, Palette, 
  Users, Baby, Music, Film, Calendar, ShoppingBag,
  Briefcase, Heart, Castle, Scroll,
  Mountain, Wind, Coffee, Globe,
  BookOpen, Telescope, Sparkles,
  Waves, TreePine as TreeIcon
} from 'lucide-react';
import React from 'react';

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
    icon: <Landmark size={16} />,
    options: [
      { id: 'historical', name: 'Исторические музеи', icon: <Scroll size={14} />, category: 'museum' },
      { id: 'art', name: 'Художественные музеи', icon: <Palette size={14} />, category: 'museum' },
      { id: 'nature', name: 'Природные музеи', icon: <TreePine size={14} />, category: 'museum' },
      { id: 'war', name: 'Военные музеи', icon: <Award size={14} />, category: 'museum' },
      { id: 'gallery', name: 'Галереи', icon: <Palette size={14} />, category: 'museum' },
      { id: 'general-museum', name: 'Общие музеи', icon: <Landmark size={14} />, category: 'museum' },
    ],
  },
  {
    id: 'park-and-garden',
    name: 'Парки и сады',
    icon: <TreePine size={16} />,
    options: [
      { id: 'urban', name: 'Городские парки', icon: <TreePine size={14} />, category: 'park-and-garden' },
      { id: 'natural', name: 'Природные парки', icon: <Mountain size={14} />, category: 'park-and-garden' },
    ],
  },
  {
    id: 'architecture',
    name: 'Архитектура',
    icon: <Building2 size={16} />,
    options: [
      { id: 'historic-architecture', name: 'Историческая архитектура', icon: <Castle size={14} />, category: 'architecture' },
      { id: 'castles', name: 'Замки и дворцы', icon: <Castle size={14} />, category: 'architecture' },
    ],
  },
  {
    id: 'monument',
    name: 'Памятники',
    icon: <Award size={16} />,
    options: [
      { id: 'sculpture', name: 'Скульптуры', icon: <Award size={14} />, category: 'monument' },
      { id: 'memorials', name: 'Мемориалы', icon: <Award size={14} />, category: 'monument' },
      { id: 'fountains', name: 'Фонтаны', icon: <Wind size={14} />, category: 'monument' },
    ],
  },
  {
    id: 'theatre',
    name: 'Театры и концерты',
    icon: <Theater size={16} />,
    options: [
      { id: 'academic', name: 'Академические театры', icon: <Theater size={14} />, category: 'theatre' },
      { id: 'concert-hall', name: 'Концертные залы', icon: <Music size={14} />, category: 'theatre' },
      { id: 'cinema-hall', name: 'Кинотеатры', icon: <Film size={14} />, category: 'theatre' },
    ],
  },
  {
    id: 'religious',
    name: 'Религиозные объекты',
    icon: <Church size={16} />,
    options: [
      { id: 'christian', name: 'Христианские', icon: <Church size={14} />, category: 'religious' },
      { id: 'monasteries', name: 'Монастыри', icon: <Church size={14} />, category: 'religious' },
      { id: 'muslim', name: 'Мусульманские', icon: <Church size={14} />, category: 'religious' },
      { id: 'jewish', name: 'Иудейские', icon: <Church size={14} />, category: 'religious' },
    ],
  },
  {
    id: 'science-education',
    name: 'Наука и образование',
    icon: <Microscope size={16} />,
    options: [
      { id: 'libraries', name: 'Библиотеки', icon: <BookOpen size={14} />, category: 'science-education' },
      { id: 'observatories', name: 'Обсерватории', icon: <Telescope size={14} />, category: 'science-education' },
      { id: 'planetariums', name: 'Планетарии', icon: <Globe size={14} />, category: 'science-education' },
    ],
  },
  {
    id: 'gastronomy',
    name: 'Гастрономия',
    icon: <UtensilsCrossed size={16} />,
    options: [
      { id: 'restaurant', name: 'Рестораны', icon: <UtensilsCrossed size={14} />, category: 'gastronomy' },
      { id: 'cafe', name: 'Кафе', icon: <Coffee size={14} />, category: 'gastronomy' },
      { id: 'fine-dining', name: 'Высокая кухня', icon: <Award size={14} />, category: 'gastronomy' },
    ],
  },
  {
    id: 'contemporary-art',
    name: 'Современное искусство',
    icon: <Palette size={16} />,
    options: [
      { id: 'contemporary-galleries', name: 'Галереи совр. искусства', icon: <Palette size={14} />, category: 'contemporary-art' },
      { id: 'public-art', name: 'Паблик-арт', icon: <Sparkles size={14} />, category: 'contemporary-art' },
    ],
  },
  {
    id: 'famous-people',
    name: 'Знаменитые люди',
    icon: <Users size={16} />,
    options: [
      { id: 'house-museums', name: 'Дома-музеи', icon: <Building2 size={14} />, category: 'famous-people' },
      { id: 'residences', name: 'Резиденции', icon: <Castle size={14} />, category: 'famous-people' },
    ],
  },
  {
    id: 'children',
    name: 'Детские объекты',
    icon: <Baby size={16} />,
    options: [
      { id: 'aquariums', name: 'Аквариумы', icon: <Waves size={14} />, category: 'children' },
      { id: 'dolphinarium', name: 'Дельфинарии', icon: <Waves size={14} />, category: 'children' },
      { id: 'circuses', name: 'Цирки', icon: <Baby size={14} />, category: 'children' },
      { id: 'zoos', name: 'Зоопарки', icon: <TreeIcon size={14} />, category: 'children' },
    ],
  },
];


export const EVENT_TYPES: FilterCategory = {
  id: 'events',
  name: 'Типы событий',
  icon: <Calendar size={16} />,
  options: [
    { id: 'cinema', name: 'Кинопоказы', icon: <Film size={14} />, category: 'events' },
    { id: 'exhibitions', name: 'Выставки', icon: <Palette size={14} />, category: 'events' },
    { id: 'concerts', name: 'Концерты', icon: <Music size={14} />, category: 'events' },
    { id: 'festivals', name: 'Фестивали', icon: <Calendar size={14} />, category: 'events' },
    { id: 'fairs', name: 'Ярмарки', icon: <ShoppingBag size={14} />, category: 'events' },
    { id: 'business', name: 'Бизнес-ивенты', icon: <Briefcase size={14} />, category: 'events' },
    { id: 'kids-events', name: 'Детские события', icon: <Baby size={14} />, category: 'events' },
    { id: 'charity', name: 'Благотворительные акции', icon: <Heart size={14} />, category: 'events' },
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
export const ALL_FILTER_OPTIONS = MAIN_CATEGORIES.flatMap(c => c.options);
export const OBJECT_CATEGORIES = MAIN_CATEGORIES;