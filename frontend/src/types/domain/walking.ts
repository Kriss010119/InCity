export type WalkingSegment = {
  id: string;
  sectionIndex: number;
  startPoint: {
    name: string;
    lat: number;
    lng: number;
  };
  endPoint: {
    name: string;
    lat: number;
    lng: number;
  };
  estimatedTime?: number;
};