import type { VisitPoint } from '../../types/types';

export type PlaceDetailsModalProps = {
  place: VisitPoint | null;
  onClose: () => void;
}

export type ImageGalleryProps = {
  images: string[];
  placeName: string;
  currentIndex: number;
  onError: (url: string) => void;
}

export type ImagePlaceholderProps = {
  icon: React.ReactNode;
  hasImageTag: boolean;
}

export type CategoryBadgeProps = {
  category: string;
  subcategory: string;
}

export type PlaceHeaderProps = {
  name: string;
  estimatedTime: number;
}

export type InfoCardProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

export type TagsSectionProps = {
  tags: string[];
}