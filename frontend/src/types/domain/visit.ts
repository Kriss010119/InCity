export type VisitPoint = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  subcategory: string;
  square: number | null;
  estimatedVisitMinutes: number;
  osmType: string | null;
  tags: string[];
};

export type VisitPointGroup = {
  mainAttraction: VisitPoint;
  otherAttractions: VisitPoint[];
  estimatedTimeInMinutes: number;
};
