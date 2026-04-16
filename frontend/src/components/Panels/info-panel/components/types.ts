import type { RouteResponse, VisitPoint } from "../../../../types/types";

export type TabType = 'route' | 'attractions';

export interface InfoPanelProps {
  routeData?: FormData | null;
  routeResponse?: RouteResponse | null;
  isLoading?: boolean;
  onAttractionClick?: (place: VisitPoint) => void;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export interface AttractionCardProps {
  place: VisitPoint;
  onClick: (place: VisitPoint) => void;
}

export interface RouteSectionProps {
  section: RouteResponse['sections'][0];
  index: number;
}

export interface RouteGapProps {
  gap: RouteResponse['sections'][0]['gaps'][0];
}