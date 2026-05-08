import type { RouteResponse, VisitPoint } from '../domain';

export type TabType = 'route' | 'attractions';

export type InfoPanelProps = {
  routeResponse?: RouteResponse | null;
  isLoading?: boolean;
  onAttractionClick?: (place: VisitPoint) => void;
  onCollapseChange?: (isCollapsed: boolean) => void;
};

export type AttractionCardProps = {
  place: VisitPoint;
  onClick: (place: VisitPoint) => void;
};

export type RouteSectionProps = {
  section: RouteResponse['sections'][0];
  index: number;
};

export type RouteGapProps = {
  gap: RouteResponse['sections'][0]['gaps'][0];
};
