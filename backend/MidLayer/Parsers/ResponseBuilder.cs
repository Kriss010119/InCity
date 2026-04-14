using System;
using System.Collections.Generic;
using MidLayer.Contracts;
using DomainLib.Interfaces;
using DomainLib.Attractions;
using DomainLib.Stations;
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
            // Определяем главную достопримечательность (максимальный InterestRate = EstimatedVisitMinutes * Tags.Count)
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

            gaps.Sort((a, b) => a.StartNode.Sequence.CompareTo(b.StartNode.Sequence));

            return new SectionDto
            {
                Gaps = [.. gaps],
                EstimatedTimeInMinutes = section.EstimatedTimeInMinutes,
                NumberOfTransfers = section.NumberOfTransfers
            };
        }

        private static GapDto MapGap(Gap<IStation> gap)
        {
            List<NodeDto> visited = new List<NodeDto>();
            int seq = gap.Order * 100 + 1;

            foreach (IStation node in gap.NodesVisited)
            {
                visited.Add(MapStationNode(node, "platform", seq++));
            }

            return new GapDto
            {
                StartNode = MapStationNode(gap.StartNode, "platform", gap.Order * 100),
                EndNode = MapStationNode(gap.EndNode, "platform", seq),
                Transport = gap.Transport,
                RouteNumber = gap.RouteNumber,
                NodesVisited = [.. visited]
            };
        }

        private static GapDto MapMetroGap(MetroGap gap)
        {
            List<NodeDto> visited = new List<NodeDto>();
            int seq = gap.Order * 100 + 1;

            foreach (MetroStation node in gap.NodesVisited)
            {
                visited.Add(MapMetroNode(node, seq++));
            }

            return new GapDto
            {
                StartNode = MapMetroNode(gap.StartNode, gap.Order * 100),
                EndNode = MapMetroNode(gap.EndNode, seq),
                Transport = gap.Transport,
                RouteNumber = gap.RouteNumber,
                NodesVisited = [.. visited]
            };
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