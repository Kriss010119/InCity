using System;
using System.Collections.Generic;
using DomainLib.Stations;
using DomainLib.Routes;
using DomainLib;
using DomainLib.Service;

namespace RoutePlanning.CityData
{
    internal class MetroManager
    {
        private MetroStation[] _stations;
        private MetroRoute[] _routes;

        public MetroManager(IEnumerable<MetroStation> stations, IEnumerable<MetroRoute> routes)
        {
            _stations = [.. stations];
            _routes = [.. routes];
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

        public MetroRoute? GetDirectRouteBetween(MetroStation st1, MetroStation st2)
        {
            foreach (MetroRoute mr in _routes)
            {
                if (mr.Stations.Any(el => el.ID == st1.ID) && mr.Stations.Any(el => el.ID == st2.ID))
                {
                    return mr;
                }
            }

            return null;
        }

        public Pair<MetroStation, MetroStation>? GetRoutesIntersections(MetroRoute mr1, MetroRoute mr2)
        {
            foreach (MetroStation st1 in mr1.Stations)
            {
                foreach (MetroStation st2 in mr2.Stations)
                {
                    if (st1.ID == st2.ID)
                    {
                        return new(st1, st2);
                    }

                    if (st1.IsTransfer && st1.Transfers!.Any(el1 => el1.Key == st2.ID))
                    {
                        return new(st1, st2);
                    }
                }
            }

            return null;
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
    }
}
