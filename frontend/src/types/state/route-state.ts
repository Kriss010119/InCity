export type RoutePointType = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type PlaceType = {
  id: string;
  title: string;
  type: 'event' | 'sight';
};

export type RouteStateType = {
  from: RoutePointType | null;
  to: RoutePointType | null;
  places: PlaceType[];
};
