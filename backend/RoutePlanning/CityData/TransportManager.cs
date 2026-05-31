using DomainLib.Interfaces;
using DomainLib.Routes;
using DomainLib;
using System;
using System.Collections.Generic;

namespace RoutePlanning.CityData
{
    internal class TransportManager<TStation, TRoute> where TStation : IStation where TRoute : IRoute
    {
        private const double TargetCellKm = 1.0;
        private const int MinGridDim = 3;
        private const int MaxGridDim = 60;
        private const double KmPerDegreeLat = 111.0;

        private readonly Dictionary<ulong, TRoute> _routesById;
        private readonly Dictionary<ulong, HashSet<ulong>> _routeIdsByStopId;

        private readonly List<TStation>[,] _grid;
        private readonly int _gridRows;
        private readonly int _gridCols;
        private readonly double _minLat;
        private readonly double _minLon;
        private readonly double _latStep;
        private readonly double _lonStep;

        public TransportManager(IEnumerable<TStation> stops, IEnumerable<TRoute> routes)
        {
            TStation[] allStops = [.. stops];

            _routesById = new Dictionary<ulong, TRoute>();
            foreach (TRoute route in routes)
            {
                _routesById[route.ID] = route;
            }

            _routeIdsByStopId = new Dictionary<ulong, HashSet<ulong>>();
            foreach (TStation stop in allStops)
            {
                HashSet<ulong> set = new HashSet<ulong>();
                foreach (RouteInfo ri in stop.Routes)
                {
                    set.Add(ri.RouteID);
                }
                _routeIdsByStopId[stop.ID] = set;
            }

            if (allStops.Length == 0)
            {
                _gridRows = MinGridDim;
                _gridCols = MinGridDim;
                _minLat = 0;
                _minLon = 0;
                _latStep = 1;
                _lonStep = 1;
                _grid = new List<TStation>[_gridRows, _gridCols];
                for (int r = 0; r < _gridRows; r++)
                    for (int c = 0; c < _gridCols; c++)
                        _grid[r, c] = new List<TStation>();
                return;
            }

            double minLat = allStops[0].Latitude, maxLat = allStops[0].Latitude;
            double minLon = allStops[0].Longitude, maxLon = allStops[0].Longitude;

            for (int i = 1; i < allStops.Length; i++)
            {
                double lat = allStops[i].Latitude;
                double lon = allStops[i].Longitude;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
                if (lon < minLon) minLon = lon;
                if (lon > maxLon) maxLon = lon;
            }

            double padding = 0.001;
            _minLat = minLat - padding;
            _minLon = minLon - padding;

            double midLat = (minLat + maxLat) / 2.0;
            double kmPerDegreeLon = KmPerDegreeLat * Math.Cos(midLat * Math.PI / 180.0);

            double heightKm = (maxLat - minLat + 2 * padding) * KmPerDegreeLat;
            double widthKm = (maxLon - minLon + 2 * padding) * kmPerDegreeLon;

            _gridRows = Math.Clamp((int)Math.Ceiling(heightKm / TargetCellKm), MinGridDim, MaxGridDim);
            _gridCols = Math.Clamp((int)Math.Ceiling(widthKm / TargetCellKm), MinGridDim, MaxGridDim);

            _latStep = (maxLat - minLat + 2 * padding) / _gridRows;
            _lonStep = (maxLon - minLon + 2 * padding) / _gridCols;

            if (_latStep <= 0) _latStep = 1;
            if (_lonStep <= 0) _lonStep = 1;

            _grid = new List<TStation>[_gridRows, _gridCols];
            for (int r = 0; r < _gridRows; r++)
                for (int c = 0; c < _gridCols; c++)
                    _grid[r, c] = new List<TStation>();

            foreach (TStation stop in allStops)
            {
                (int row, int col) = GetCell(stop.Latitude, stop.Longitude);
                _grid[row, col].Add(stop);
            }
        }

        private (int row, int col) GetCell(double lat, double lon)
        {
            int row = (int)((lat - _minLat) / _latStep);
            int col = (int)((lon - _minLon) / _lonStep);

            if (row < 0) row = 0;
            if (row >= _gridRows) row = _gridRows - 1;
            if (col < 0) col = 0;
            if (col >= _gridCols) col = _gridCols - 1;

            return (row, col);
        }

        public TStation[] GetClosestStopsToPoint(double latitude, double longitude, int amount = 3, int searchRad = 1000)
        {
            (int centerRow, int centerCol) = GetCell(latitude, longitude);

            List<TStation> ans = new List<TStation>();

            int rowMin = Math.Max(0, centerRow - 1);
            int rowMax = Math.Min(_gridRows - 1, centerRow + 1);
            int colMin = Math.Max(0, centerCol - 1);
            int colMax = Math.Min(_gridCols - 1, centerCol + 1);

            for (int r = rowMin; r <= rowMax; r++)
            {
                for (int c = colMin; c <= colMax; c++)
                {
                    List<TStation> cell = _grid[r, c];
                    for (int i = 0; i < cell.Count; i++)
                    {
                        if (SpatialMath.InRadius(latitude, longitude, cell[i].Latitude, cell[i].Longitude, searchRad))
                        {
                            ans.Add(cell[i]);
                        }
                    }
                }
            }

            ans.Sort((el1, el2) =>
                SpatialMath.Distance(latitude, longitude, el1.Latitude, el1.Longitude)
                .CompareTo(SpatialMath.Distance(latitude, longitude, el2.Latitude, el2.Longitude)));

            if (ans.Count <= amount)
            {
                return [.. ans];
            }
            else
            {
                return [.. ans[0..amount]];
            }
        }

        public TStation? GetRoutesIntersection(ulong routeID1, ulong routeID2)
        {
            if (!_routesById.TryGetValue(routeID1, out TRoute? route1))
            {
                return default;
            }

            for (int i = 0; i < route1.Stops.Count; i++)
            {
                ulong stopId = route1.Stops[i].ID;
                if (_routeIdsByStopId.TryGetValue(stopId, out HashSet<ulong>? routeIds) && routeIds.Contains(routeID2))
                {
                    return (TStation)route1.Stops[i];
                }
            }

            return default;
        }

        public TRoute? DirectRouteBetween(TStation start, TStation end)
        {
            TRoute? ans = default;
            int bestDiff = int.MaxValue;

            HashSet<ulong> startRoutes = new HashSet<ulong>();
            Dictionary<ulong, int> startOrders = new Dictionary<ulong, int>();

            foreach (RouteInfo ri in start.Routes)
            {
                startRoutes.Add(ri.RouteID);
                startOrders[ri.RouteID] = ri.Order;
            }

            foreach (RouteInfo ri2 in end.Routes)
            {
                if (!startRoutes.Contains(ri2.RouteID))
                {
                    continue;
                }

                int startOrder = startOrders[ri2.RouteID];
                int diff = ri2.Order - startOrder;

                if (diff > 0 && diff < bestDiff)
                {
                    bestDiff = diff;
                    if (_routesById.TryGetValue(ri2.RouteID, out TRoute? route))
                    {
                        ans = route;
                    }
                }
            }

            return ans;
        }

        public TRoute? GetRouteById(ulong routeId)
        {
            if (_routesById.TryGetValue(routeId, out TRoute? route))
            {
                return route;
            }

            return default;
        }
    }
}