import type { VisitPoint } from '../domain';

export type PlaceDetails = {
  description?: string;
  images?: string[];
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  wikidata?: string;
  wikipedia?: string;
  wikipediaExtract?: string;
  wikipediaImage?: string;
  wikipediaUrl?: string;
  imageLicense?: string;
  imageAuthor?: string;
  source?: 'cache' | 'wikipedia' | 'wikidata' | 'osm';
};

export type PlaceDetailsModalProps = {
  place: VisitPoint | null;
  onClose: () => void;
};

export type ImageGalleryProps = {
  images: string[];
  placeName: string;
  currentIndex: number;
  onError: (url: string) => void;
};

export type ImagePlaceholderProps = {
  icon: React.ReactNode;
  hasImageTag: boolean;
};

export type CategoryBadgeProps = {
  category: string;
  subcategory: string;
};

export type PlaceHeaderProps = {
  name: string;
  estimatedTime: number;
};

export type InfoCardProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};
