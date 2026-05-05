using System;
using System.Collections.Generic;
using MidLayer.Contracts;
using DomainLib.Interfaces;
using DomainLib.Attractions;
using DomainLib.Stations;
using DomainLib.Routes;
using RoutePlanning.AttractionConnecting;

namespace MidLayer.Parsers
{
    /// <summary>
    /// Построитель ответов: преобразует доменные объекты в DTO для фронтенда.
    /// </summary>
    public static class ResponseBuilder
    {
        public static RouteResponse BuildRouteResponse(Cluster[] clusters, Section[] sections)
        {
            List<ClusterDto> visitPoints = new List<ClusterDto>();

            foreach (Cluster cluster in clusters)
            {
                visitPoints.Add(MapCluster(cluster));
            }

            List<SectionDto> sectionDtos = new List<SectionDto>();

            foreach (Section section in sections)
            {
                sectionDtos.Add(MapSection(section));
            }

            return new RouteResponse
            {
                VisitPoints = [.. visitPoints],
                Sections = [.. sectionDtos]
            };
        }

        private static ClusterDto MapCluster(Cluster cluster)
        {
            int mainIndex = 0;
            int bestScore = 0;

            for (int i = 0; i < cluster.Attractions.Length; i++)
            {
                IAttraction curr = cluster.Attractions[i];
                int score = 0;

                if (curr is Attraction atr)
                {
                    score = atr.EstimatedVisitMinutes * atr.Tags.Count;
                }

                if (score > bestScore)
                {
                    bestScore = score;
                    mainIndex = i;
                }
            }

            VisitPointDto main = MapAttraction(cluster.Attractions[mainIndex]);

            List<VisitPointDto> others = new List<VisitPointDto>();
            for (int i = 0; i < cluster.Attractions.Length; i++)
            {
                if (i != mainIndex)
                {
                    others.Add(MapAttraction(cluster.Attractions[i]));
                }
            }

            return new ClusterDto
            {
                MainAttraction = main,
                OtherAttractions = [.. others]
            };
        }

        private static VisitPointDto MapAttraction(IAttraction attraction)
        {
            VisitPointDto dto = new VisitPointDto
            {
                Id = attraction.ID,
                Name = attraction.Name,
                Latitude = attraction.Latitude,
                Longitude = attraction.Longitude,
                Category = attraction.Category,
                EstimatedVisitMinutes = attraction.EstimatedVisitMinutes
            };

            if (attraction is Attraction attr)
            {
                dto.Subcategory = attr.Subcategory;
                dto.Square = attr.Square;
                dto.Tags = [.. attr.Tags];
            }

            return dto;
        }

        private static SectionDto MapSection(Section section)
        {
            List<GapDto> gaps = new List<GapDto>();

            foreach (var gap in section.Gaps)
            {
                gaps.Add(MapGap(gap));
            }

            foreach (MetroGap metroGap in section.MetroGaps)
            {
                gaps.Add(MapMetroGap(metroGap));
            }

            return new SectionDto
            {
                Gaps = [.. gaps],
                EstimatedTimeInMinutes = section.EstimatedTimeInMinutes,
                NumberOfTransfers = section.NumberOfTransfers
            };
        }

        /// <summary>
        /// Маппит Gap в DTO. Sequence каждой остановки = её Order в маршруте (из RouteInfo),
        /// а не порядковый номер внутри gap-а.
        /// </summary>
        private static GapDto MapGap(Gap<IStation> gap)
        {
            // Находим RouteID маршрута этого gap-а по startNode
            ulong routeId = FindRouteId(gap.StartNode, gap.EndNode);

            // Sequence для startNode = его Order в маршруте
            int startOrder = GetRouteOrder(gap.StartNode, routeId);
            int endOrder = GetRouteOrder(gap.EndNode, routeId);

            List<NodeDto> visited = new List<NodeDto>();

            foreach (IStation node in gap.NodesVisited)
            {
                int order = GetRouteOrder(node, routeId);
                visited.Add(MapStationNode(node, "platform", order));
            }

            return new GapDto
            {
                StartNode = MapStationNode(gap.StartNode, "platform", startOrder),
                EndNode = MapStationNode(gap.EndNode, "platform", endOrder),
                Transport = gap.Transport,
                RouteNumber = gap.RouteNumber,
                NodesVisited = [.. visited]
            };
        }

        /// <summary>
        /// Находит RouteID общего маршрута двух остановок.
        /// Ищет маршрут где startNode.Order менее endNode.Order (правильное направление).
        /// </summary>
        private static ulong FindRouteId(IStation startNode, IStation endNode)
        {
            foreach (RouteInfo ri1 in startNode.Routes)
            {
                foreach (RouteInfo ri2 in endNode.Routes)
                {
                    if (ri1.RouteID == ri2.RouteID && ri1.Order < ri2.Order)
                    {
                        return ri1.RouteID;
                    }
                }
            }

            // Fallback: первый общий маршрут
            foreach (RouteInfo ri1 in startNode.Routes)
            {
                foreach (RouteInfo ri2 in endNode.Routes)
                {
                    if (ri1.RouteID == ri2.RouteID)
                    {
                        return ri1.RouteID;
                    }
                }
            }

            return 0;
        }

        /// <summary>
        /// Получает Order остановки на конкретном маршруте.
        /// </summary>
        private static int GetRouteOrder(IStation station, ulong routeId)
        {
            RouteInfo? ri = station.Routes.Find(r => r.RouteID == routeId);
            return ri?.Order ?? 0;
        }

        private static GapDto MapMetroGap(MetroGap gap)
        {
            // Для метро используем MetroRouteInfo
            ulong routeId = FindMetroRouteId(gap.StartNode, gap.EndNode);

            int startOrder = GetMetroRouteOrder(gap.StartNode, routeId);
            int endOrder = GetMetroRouteOrder(gap.EndNode, routeId);

            List<NodeDto> visited = new List<NodeDto>();

            foreach (MetroStation node in gap.NodesVisited)
            {
                int order = GetMetroRouteOrder(node, routeId);
                visited.Add(MapMetroNode(node, order));
            }

            return new GapDto
            {
                StartNode = MapMetroNode(gap.StartNode, startOrder),
                EndNode = MapMetroNode(gap.EndNode, endOrder),
                Transport = gap.Transport,
                RouteNumber = gap.RouteNumber,
                NodesVisited = [.. visited]
            };
        }

        private static ulong FindMetroRouteId(MetroStation start, MetroStation end)
        {
            if (start.Routes != null && end.Routes != null)
            {
                foreach (MetroRouteInfo ri1 in start.Routes)
                {
                    foreach (MetroRouteInfo ri2 in end.Routes)
                    {
                        if (ri1.RouteID == ri2.RouteID)
                        {
                            return ri1.RouteID;
                        }
                    }
                }
            }

            return 0;
        }

        private static int GetMetroRouteOrder(MetroStation station, ulong routeId)
        {
            if (station.Routes != null)
            {
                MetroRouteInfo? ri = station.Routes.Find(r => r.RouteID == routeId);
                if (ri != null) return ri.Order;
            }

            return 0;
        }

        private static NodeDto MapStationNode(IStation station, string role, int sequence)
        {
            return new NodeDto
            {
                NodeId = station.ID,
                Name = station.Name,
                Latitude = station.Latitude,
                Longitude = station.Longitude,
                Role = role,
                Sequence = sequence
            };
        }

        private static NodeDto MapMetroNode(MetroStation station, int sequence)
        {
            return new NodeDto
            {
                NodeId = station.ID,
                Name = station.Name,
                Latitude = station.Latitude,
                Longitude = station.Longitude,
                Role = "stop",
                Sequence = sequence
            };
        }
    }
}