using DomainLib.Routes;
using DomainLib.Stations;
using DomainLib.Enumerators;
using System;
using System.Collections.Generic;
using DomainLib.Interfaces;
using DomainLib.Service;
using RoutePlanning.Service;
using DomainLib;

namespace RoutePlanning.CityData
{
    internal sealed class CityTransportFacade
    {
        public TransportManager<BusStop, BusRoute>? BusManager { get; }
        public TransportManager<TramStop, TramRoute>? TramManager { get; }
        public TransportManager<TrolleybusStop, TrolleybusRoute>? TrolleybusManager { get; }
        public MetroManager? MetroManager { get; }

        public bool HasBusSystem => BusManager != null;
        public bool HasTramSystem => TramManager != null;
        public bool HasTrolleybusSystem => TrolleybusManager != null;
        public bool HasMetroSystem => MetroManager != null;

        public CityTransportFacade(
            IEnumerable<BusStop>? busStops, IEnumerable<BusRoute>? busRoutes,
            IEnumerable<TramStop>? tramstops, IEnumerable<TramRoute>? tramRoutes,
            IEnumerable<TrolleybusStop>? trolleybusStops, IEnumerable<TrolleybusRoute>? trolleybusRoutes,
            IEnumerable<MetroStation>? metroStations, IEnumerable<MetroRoute>? metroRoutes)
        {
            BusManager = null;
            TramManager = null;
            TrolleybusManager = null;
            MetroManager = null;

            if (busStops != null && busRoutes != null)
            {
                BusManager = new TransportManager<BusStop, BusRoute>(busStops, busRoutes);
            }
            if (tramstops != null && tramRoutes != null)
            {
                TramManager = new TransportManager<TramStop, TramRoute>(tramstops, tramRoutes);
            }
            if (trolleybusStops != null && trolleybusRoutes != null)
            {
                TrolleybusManager = new TransportManager<TrolleybusStop, TrolleybusRoute>(trolleybusStops, trolleybusRoutes);
            }
            if (metroStations != null && metroRoutes != null)
            {
                MetroManager = new MetroManager(metroStations, metroRoutes);
            }
        }

        public Pair<IStation[], MetroStation[]> GetClosestStations(double latitude, double longitude, TransportFilter filter, int amount = 20, int searchRad = 1000)
        {
            List<IStation> ansSt = new List<IStation>();
            List<MetroStation> ansM = new List<MetroStation>();

            if (filter.BusesIncluded)
            {
                ansSt.AddRange(GetClosestBusStops(latitude, longitude, 16, searchRad));
            }
            if (filter.TramsIncluded)
            {
                ansSt.AddRange(GetClosestTramStops(latitude, longitude, 5, searchRad));
            }
            if (filter.TrolleybusesIncluded)
            {
                ansSt.AddRange(GetClosestTrolleybusStops(latitude, longitude, 10, searchRad));
            }
            if (filter.MetroIncluded)
            {
                ansM.AddRange(GetClosestMetroStations(latitude, longitude, 4, searchRad));
            }

            ansSt.Sort((el1, el2) =>
                SpatialMath.Distance(latitude, longitude, el1.Latitude, el1.Longitude).CompareTo(SpatialMath.Distance(latitude, longitude, el2.Latitude, el2.Longitude)));
            ansM.Sort((el1, el2) =>
                SpatialMath.Distance(latitude, longitude, el1.Latitude, el1.Longitude).CompareTo(SpatialMath.Distance(latitude, longitude, el2.Latitude, el2.Longitude)));

            if (ansSt.Count > amount)
            {
                ansSt = ansSt[0..amount];
            }
            if (ansM.Count > amount)
            {
                ansM = ansM[0..amount];
            }

            return new([.. ansSt], [.. ansM]);
        }

        public Pair<IStation[], MetroStation[]> GetClosestStations(Station st, TransportFilter filter, int amount = 20, int searchRad = 1000)
        {
            return GetClosestStations(st.Latitude, st.Longitude, filter, amount, searchRad);
        }

        public BusStop[] GetClosestBusStops(double latitude, double longitude, int amount = 16, int searchRad = 1000)
        {
            if (!HasBusSystem)
            {
                return [];
            }

            return BusManager!.GetClosestStopsToPoint(latitude, longitude, amount, searchRad);
        }

        public BusStop[] GetClosestBusStops(Station st, int amount = 16, int searchRad = 1000)
        {
            return GetClosestBusStops(st.Latitude, st.Longitude, amount, searchRad);
        }

        public TramStop[] GetClosestTramStops(double latitude, double longitude, int amount = 5, int searchRad = 1000)
        {
            if (!HasTramSystem)
            {
                return [];
            }

            return TramManager!.GetClosestStopsToPoint(latitude, longitude, amount, searchRad);
        }

        public TramStop[] GetClosestTramStops(Station st, int amount = 5, int searchRad = 1000)
        {
            return GetClosestTramStops(st.Latitude, st.Longitude, amount, searchRad);
        }

        public TrolleybusStop[] GetClosestTrolleybusStops(double latitude, double longitude, int amount = 10, int searchRad = 1000)
        {
            if (!HasTrolleybusSystem)
            {
                return [];
            }

            return TrolleybusManager!.GetClosestStopsToPoint(latitude, longitude, amount, searchRad);
        }

        public TrolleybusStop[] GetClosestTrolleybusStops(Station st, int amount = 10, int searchRad = 1000)
        {
            return GetClosestTrolleybusStops(st.Latitude, st.Longitude, amount, searchRad);
        }

        public MetroStation[] GetClosestMetroStations(double latitude, double longitude, int amount = 5, int searchRad = 1000)
        {
            if (!HasMetroSystem)
            {
                return [];
            }

            return MetroManager!.GetClosestStopsToPoint(latitude, longitude, amount, searchRad);
        }

        public MetroStation[] GetClosestMetroStations(Station st, int amount = 5, int searchRad = 1000)
        {
            return GetClosestMetroStations(st.Latitude, st.Longitude, amount, searchRad);
        }
    }
}
