using DomainLib.Interfaces;
using DomainLib.Routes;
using DomainLib;
using System;

namespace RoutePlanning.CityData
{
    internal class TransportManager<TStation, TRoute> where TStation : IStation where TRoute : IRoute
    {
        private readonly TStation[] _stops;
        private readonly TRoute[] _routes;

        public TransportManager(IEnumerable<TStation> stops, IEnumerable<TRoute> routes)
        {
            _stops = [.. stops];
            _routes = [.. routes];
        }

        public TStation[] GetClosestStopsToPoint(double latitude, double longitude, int amount = 3, int searchRad = 1000)
        {
            List<TStation> ans = new List<TStation>();

            for (int i = 0; i < _stops.Length; i++)
            {
                if (SpatialMath.InRadius(latitude, longitude, _stops[i].Latitude, _stops[i].Longitude, searchRad))
                {
                    ans.Add(_stops[i]);
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

        public TStation? GetRoutesIntersection(ulong routeID1, ulong routeID2)
        {
            TRoute? route1 = _routes.FirstOrDefault(el => el.ID == routeID1);
            TRoute? route2 = _routes.FirstOrDefault(el => el.ID == routeID2);

            if (route1 == null || route2 == null)
            {
                return default;
            }

            foreach (TStation stop in route1.Stops)
            {
                if (route2.Stops.FirstOrDefault(el => el.ID == stop.ID) != null)
                {
                    return stop;
                }
            }

            return default;
        }

        public TRoute? DirectRouteBetween(TStation start, TStation end)
        {
            TRoute? ans = default;
            int bestDiff = int.MinValue;

            foreach (TRoute route in _routes)
            {
                ulong routeID = route.ID;

                RouteInfo? r1 = start.Routes.FirstOrDefault(el => el.RouteID == routeID);
                RouteInfo? r2 = end.Routes.FirstOrDefault(l => l.RouteID == routeID);

                if (r1 == null || r2 == null)
                {
                    continue;
                }

                if (r1.Order < r2.Order && bestDiff > r2.Order - r1.Order)
                {
                    bestDiff = r2.Order - r1.Order;
                    ans = route;
                }
            }

            return ans;
        }

        public TRoute? GetRouteById(ulong routeId)
        {
            foreach (TRoute route in _routes)
            {
                if (route.ID == routeId)
                {
                    return route;
                }
            }

            return default;
        }
    }
}
