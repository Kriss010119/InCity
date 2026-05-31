using System;
using System.Collections.Generic;
using DomainLib.Stations;
using DomainLib.Routes;
using DomainLib;

namespace RoutePlanning.CityData
{
    /// <summary>
    /// Результат поиска кратчайшего пути в метро (Дейкстра).
    /// Содержит последовательность сегментов, каждый из которых — проезд по одной линии.
    /// </summary>
    internal class MetroPathResult
    {
        public List<MetroPathSegment> Segments { get; }
        public double TotalCost { get; }
        public int TransferCount { get; }

        public MetroPathResult(List<MetroPathSegment> segments, double totalCost, int transferCount)
        {
            Segments = segments;
            TotalCost = totalCost;
            TransferCount = transferCount;
        }
    }

    /// <summary>
    /// Один сегмент пути по метро — проезд по одной линии от станции до станции.
    /// </summary>
    internal class MetroPathSegment
    {
        public MetroStation From { get; }
        public MetroStation To { get; }
        public MetroStation[] Intermediate { get; }
        public MetroRoute Route { get; }
        public int StopCount { get; }

        public MetroPathSegment(MetroStation from, MetroStation to, MetroStation[] intermediate, MetroRoute route, int stopCount)
        {
            From = from;
            To = to;
            Intermediate = intermediate;
            Route = route;
            StopCount = stopCount;
        }
    }

    internal class MetroManager
    {
        private MetroStation[] _stations;
        private MetroRoute[] _routes;

        /// <summary>
        /// Граф смежности: stationID → список (соседStationID, вес, маршрут через который связаны).
        /// </summary>
        private Dictionary<ulong, List<MetroEdge>> _graph;

        /// <summary>
        /// Быстрый доступ к станциям по ID.
        /// </summary>
        private Dictionary<ulong, MetroStation> _stationById;

        private const double RideCostPerStop = 2.0;
        private const double TransferCost = 5.0;

        public MetroManager(IEnumerable<MetroStation> stations, IEnumerable<MetroRoute> routes)
        {
            _stations = [.. stations];
            _routes = [.. routes];
            _stationById = new Dictionary<ulong, MetroStation>();
            _graph = new Dictionary<ulong, List<MetroEdge>>();

            foreach (MetroStation st in _stations)
            {
                _stationById[st.ID] = st;
            }

            BuildGraph();
        }

        /// <summary>
        /// Строит граф метро. Рёбра:
        /// 1) Между соседними станциями на каждой линии.
        ///    Для кольцевых линий добавляется ребро между последней и первой станцией.
        /// 2) Пересадки: между станциями, связанными через MetroStation.Transfers.
        /// </summary>
        private void BuildGraph()
        {
            foreach (MetroRoute route in _routes)
            {
                if (route.Stations.Count < 2)
                {
                    continue;
                }

                foreach (MetroStation st in route.Stations)
                {
                    _stationById.TryAdd(st.ID, st);
                }

                for (int i = 0; i < route.Stations.Count - 1; i++)
                {
                    AddEdge(route.Stations[i].ID, route.Stations[i + 1].ID, RideCostPerStop, route, EdgeType.Ride);
                }

                if (route.IsLoop && route.Stations.Count >= 3)
                {
                    MetroStation first = route.Stations[0];
                    MetroStation last = route.Stations[^1];

                    if (first.ID != last.ID)
                    {
                        AddEdge(last.ID, first.ID, RideCostPerStop, route, EdgeType.Ride);
                    }
                }
            }

            foreach (MetroStation station in _stationById.Values)
            {
                if (!station.IsTransfer || station.Transfers == null)
                {
                    continue;
                }

                foreach (KeyValuePair<ulong, List<MetroRouteInfo>> transfer in station.Transfers)
                {
                    ulong targetStationId = transfer.Key;

                    if (_stationById.ContainsKey(targetStationId))
                    {
                        AddTransferEdge(station.ID, targetStationId);
                    }
                }
            }
        }

        private void AddEdge(ulong fromId, ulong toId, double cost, MetroRoute route, EdgeType type)
        {
            if (!_graph.TryGetValue(fromId, out List<MetroEdge>? edges))
            {
                edges = new List<MetroEdge>();
                _graph[fromId] = edges;
            }

            edges.Add(new MetroEdge(toId, cost, route, type));
        }

        private void AddTransferEdge(ulong fromId, ulong toId)
        {
            if (!_graph.TryGetValue(fromId, out List<MetroEdge>? edges))
            {
                edges = new List<MetroEdge>();
                _graph[fromId] = edges;
            }

            foreach (MetroEdge existing in edges)
            {
                if (existing.TargetStationId == toId && existing.Type == EdgeType.Transfer)
                {
                    return;
                }
            }

            edges.Add(new MetroEdge(toId, TransferCost, null!, EdgeType.Transfer));
        }

        /// <summary>
        /// Ищет кратчайший путь между двумя станциями метро алгоритмом Дейкстры.
        /// Возвращает null если путь не найден.
        /// </summary>
        public MetroPathResult? FindShortestPath(MetroStation from, MetroStation to)
        {
            if (from.ID == to.ID)
            {
                return null;
            }

            if (!_graph.ContainsKey(from.ID))
            {
                return null;
            }

            Dictionary<ulong, double> dist = new Dictionary<ulong, double>();
            Dictionary<ulong, (ulong prevId, MetroEdge edge)> prev = new Dictionary<ulong, (ulong, MetroEdge)>();
            SortedSet<(double cost, ulong id)> pq = new SortedSet<(double cost, ulong id)>();

            dist[from.ID] = 0;
            pq.Add((0, from.ID));

            while (pq.Count > 0)
            {
                (double currentCost, ulong currentId) = pq.Min;
                pq.Remove(pq.Min);

                if (currentId == to.ID)
                {
                    break;
                }

                if (currentCost > dist.GetValueOrDefault(currentId, double.MaxValue))
                {
                    continue;
                }

                if (!_graph.TryGetValue(currentId, out List<MetroEdge>? edges))
                {
                    continue;
                }

                foreach (MetroEdge edge in edges)
                {
                    double newCost = currentCost + edge.Cost;
                    double oldCost = dist.GetValueOrDefault(edge.TargetStationId, double.MaxValue);

                    if (newCost < oldCost)
                    {
                        dist[edge.TargetStationId] = newCost;
                        prev[edge.TargetStationId] = (currentId, edge);
                        pq.Add((newCost, edge.TargetStationId));
                    }
                }
            }

            if (!dist.ContainsKey(to.ID))
            {
                return null;
            }

            return ReconstructPath(from, to, prev, dist[to.ID]);
        }

        /// <summary>
        /// Восстанавливает путь из результата Дейкстры.
        /// Группирует последовательные рёбра одного маршрута в сегменты.
        /// </summary>
        private MetroPathResult? ReconstructPath(MetroStation from, MetroStation to,
            Dictionary<ulong, (ulong prevId, MetroEdge edge)> prev, double totalCost)
        {
            List<(ulong fromId, ulong toId, MetroEdge edge)> edgeChain = new List<(ulong, ulong, MetroEdge)>();

            ulong current = to.ID;
            while (prev.ContainsKey(current))
            {
                (ulong prevId, MetroEdge edge) = prev[current];
                edgeChain.Add((prevId, current, edge));
                current = prevId;
            }

            edgeChain.Reverse();

            if (edgeChain.Count == 0)
            {
                return null;
            }

            List<MetroPathSegment> segments = new List<MetroPathSegment>();
            int transferCount = 0;

            int segStart = 0;

            while (segStart < edgeChain.Count)
            {
                if (edgeChain[segStart].edge.Type == EdgeType.Transfer)
                {
                    transferCount++;
                    segStart++;
                    continue;
                }

                MetroRoute segRoute = edgeChain[segStart].edge.Route;
                int segEnd = segStart;

                while (segEnd + 1 < edgeChain.Count
                       && edgeChain[segEnd + 1].edge.Type == EdgeType.Ride
                       && edgeChain[segEnd + 1].edge.Route.ID == segRoute.ID)
                {
                    segEnd++;
                }

                if (!_stationById.TryGetValue(edgeChain[segStart].fromId, out MetroStation? segFrom)
                    || !_stationById.TryGetValue(edgeChain[segEnd].toId, out MetroStation? segTo))
                {
                    segStart = segEnd + 1;
                    continue;
                }

                List<MetroStation> intermediate = new List<MetroStation>();
                for (int i = segStart; i < segEnd; i++)
                {
                    if (_stationById.TryGetValue(edgeChain[i].toId, out MetroStation? midStation))
                    {
                        intermediate.Add(midStation);
                    }
                }

                int stopCount = segEnd - segStart + 1;
                segments.Add(new MetroPathSegment(segFrom, segTo, [.. intermediate], segRoute, stopCount));

                segStart = segEnd + 1;
            }

            if (segments.Count == 0)
            {
                return null;
            }

            return new MetroPathResult(segments, totalCost, transferCount);
        }

        public MetroStation[] GetClosestStopsToPoint(double latitude, double longitude, int amount = 3, int searchRad = 1000)
        {
            List<MetroStation> ans = new List<MetroStation>();

            for (int i = 0; i < _stations.Length; i++)
            {
                if (SpatialMath.InRadius(latitude, longitude, _stations[i].Latitude, _stations[i].Longitude, searchRad))
                {
                    ans.Add(_stations[i]);
                }
            }

            ans.Sort((el1, el2) =>
                SpatialMath.Distance(latitude, longitude, el1.Latitude, el1.Longitude).CompareTo(SpatialMath.Distance(latitude, longitude, el2.Latitude, el2.Longitude)));

            if (ans.Count <= amount)
            {
                return [.. ans];
            }
            else
            {
                return [.. ans[0..amount]];
            }
        }

        public MetroRoute? GetRouteById(ulong routeId)
        {
            foreach (MetroRoute route in _routes)
            {
                if (route.ID == routeId)
                {
                    return route;
                }
            }

            return null;
        }

        private enum EdgeType
        {
            Ride,
            Transfer
        }

        private readonly struct MetroEdge
        {
            public ulong TargetStationId { get; }
            public double Cost { get; }
            public MetroRoute Route { get; }
            public EdgeType Type { get; }

            public MetroEdge(ulong targetStationId, double cost, MetroRoute route, EdgeType type)
            {
                TargetStationId = targetStationId;
                Cost = cost;
                Route = route;
                Type = type;
            }
        }
    }
}