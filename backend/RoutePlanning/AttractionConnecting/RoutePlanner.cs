using System;
using System.Collections.Generic;
using RoutePlanning.CityData;
using RoutePlanning.AttractionCollecting;
using DomainLib.Routes;
using DomainLib.Stations;
using DomainLib.Interfaces;
using DomainLib.Attractions;
using DomainLib.Enumerators;
using DomainLib.Service;
using RoutePlanning.Service;
using DomainLib;

namespace RoutePlanning.AttractionConnecting
{
    /// <summary>
    /// Класс планировки маршрута.
    /// </summary>
    public class RoutePlanner
    {
        private readonly CityTransportFacade CTF;
        private readonly AttractionCollector AT;

        private const double BusMinutesPerStop = 1.35;
        private const double TrolleybusMinutesPerStop = 1.35;
        private const double TramMinutesPerStop = 1.35;
        private const double MetroMinutesPerStop = 2.0;

        private const int BusTransferMinutes = 10;
        private const int TramTransferMinutes = 10;
        private const int TrolleybusTransferMinutes = 10;
        private const int MetroTransferMinutes = 5;

        public RoutePlanner(IEnumerable<BusStop>? busStops, IEnumerable<BusRoute>? busRoutes,
            IEnumerable<TramStop>? tramstops, IEnumerable<TramRoute>? tramRoutes,
            IEnumerable<TrolleybusStop>? trolleybusStops, IEnumerable<TrolleybusRoute>? trolleybusRoutes,
            IEnumerable<MetroStation>? metroStations, IEnumerable<MetroRoute>? metroRoutes,
            IEnumerable<IAttraction> attractions)
        {
            CTF = new CityTransportFacade(busStops, busRoutes, tramstops, tramRoutes, trolleybusStops,
                trolleybusRoutes, metroStations, metroRoutes);
            AT = new AttractionCollector(attractions);
        }

        /// <summary>
        /// Метод построения маршрута.
        /// </summary>
        /// <param name="rootLat">Долгота точки старта.</param>
        /// <param name="rootLon">Широта точки старта.</param>
        /// <param name="filter">фильтр транспорта.</param>
        /// <param name="time">Время, отведенное на прохождение маршрута.</param>
        /// <param name="minTimeForCluster">Минимальная граница для отведенного времени посещения для отобранных кластеров.</param>
        /// <returns></returns>
        public Pair<Cluster[], Section[]> Execute(double rootLat, double rootLon, TransportFilter filter, int time, int minTimeForCluster)
        {
            Cluster[] visitPoints = AT.SelectClusters(rootLat, rootLon, time, minTimeForCluster);
            Pair<List<Cluster>, List<Section>> result = BuildRoute(rootLat, rootLon, filter, visitPoints, time, minTimeForCluster);
            return new Pair<Cluster[], Section[]>([.. result.First], [.. result.Second]);
        }

        private Pair<List<Cluster>, List<Section>> BuildRoute(double rootLat, double rootLon, TransportFilter filter, Cluster[] visitPoints, int time, int minTimeForCluster)
        {
            List<Cluster> confirmed = new();
            List<Section> ans = new();

            if (visitPoints.Length == 0)
            {
                return new Pair<List<Cluster>, List<Section>>(confirmed, ans);
            }

            for (int i = 0; i < visitPoints.Length; i++)
            {
                double lat1, lon1;
                double searchRad1 = 500, searchRad2 = 500;
                if (confirmed.Count == 0)
                {
                    lat1 = rootLat;
                    lon1 = rootLon;
                }
                else
                {
                    IAttraction lastConfirmed = GetMainAttraction(confirmed[^1]);
                    lat1 = lastConfirmed.Latitude;
                    lon1 = lastConfirmed.Longitude;
                    if (lastConfirmed != null && lastConfirmed.Category == AttractionCategories.ParksAndGardens)
                    {
                        searchRad1 = Math.Sqrt((lastConfirmed as Attraction)!.Square ?? 810000) / 1.5;
                    }
                }

                IAttraction target = GetMainAttraction(visitPoints[i]);
                double lat2 = target.Latitude;
                double lon2 = target.Longitude;
                double dist = SpatialMath.Distance(lat1, lon1, lat2, lon2);

                if (target != null && target.Category == AttractionCategories.ParksAndGardens)
                {
                    searchRad2 = Math.Sqrt((target as Attraction)!.Square ?? 810000) / 1.5;
                }

                if (TryToFindRouteBetweenPoints(lat1, lon1, lat2, lon2, dist, filter, out Section sec, searchRad1, searchRad2))
                {
                    confirmed.Add(visitPoints[i]);
                    ans.Add(sec);
                    continue;
                }

                int timeCurr = confirmed.Sum(el => el.EstimatedTime) + visitPoints[i..].Sum(el => el.EstimatedTime);
                Cluster[] replacements = AT.GetReplacements(visitPoints, [.. confirmed], i, false, rootLat, rootLon, time, timeCurr, minTimeForCluster);

                foreach (Cluster replacement in replacements)
                {
                    IAttraction repMain = GetMainAttraction(replacement);
                    double repDist = SpatialMath.Distance(lat1, lon1, repMain.Latitude, repMain.Longitude);

                    if (repMain != null && repMain.Category == AttractionCategories.ParksAndGardens)
                    {
                        searchRad2 = Math.Sqrt((repMain as Attraction)!.Square ?? 810000) / 1.5;
                    }

                    if (TryToFindRouteBetweenPoints(lat1, lon1, repMain.Latitude, repMain.Longitude, repDist, filter, out Section repSec, searchRad1, searchRad2))
                    {
                        confirmed.Add(replacement);
                        ans.Add(repSec);
                        break;
                    }
                }
            }

            if (confirmed.Count == 0)
            {
                return new Pair<List<Cluster>, List<Section>>(confirmed, ans);
            }


            while (confirmed.Count > 0)
            {
                IAttraction lastConfirmed = GetMainAttraction(confirmed[^1]);
                double lat1 = lastConfirmed.Latitude;
                double lon1 = lastConfirmed.Longitude;
                double dist = SpatialMath.Distance(lat1, lon1, rootLat, rootLon);
                double searchRad = 500;

                if (lastConfirmed != null && lastConfirmed.Category == AttractionCategories.ParksAndGardens)
                {
                    searchRad = Math.Sqrt((lastConfirmed as Attraction)!.Square ?? 810000) / 1.5;
                }

                if (TryToFindRouteBetweenPoints(lat1, lon1, rootLat, rootLon, dist, filter, out Section sec, searchRad))
                {
                    ans.Add(sec);
                    return new Pair<List<Cluster>, List<Section>>(confirmed, ans);
                }

                int timeCurr = confirmed.Sum(el => el.EstimatedTime);
                Cluster[] replacements = AT.GetReplacements(visitPoints, [.. confirmed], confirmed.Count - 1, true, rootLat, rootLon, time, timeCurr, minTimeForCluster);
                bool found = false;

                foreach (Cluster replacement in replacements)
                {
                    IAttraction repMain = GetMainAttraction(replacement);
                    double searchRadRep = 500;
                    double searchRadPrev = 500;

                    if (repMain != null && repMain.Category == AttractionCategories.ParksAndGardens)
                    {
                        searchRadRep = Math.Sqrt((repMain as Attraction)!.Square ?? 810000) / 1.5;
                    }

                    double prevLat, prevLon;
                    if (confirmed.Count == 1)
                    {
                        prevLat = rootLat;
                        prevLon = rootLon;
                    }
                    else
                    {
                        IAttraction prev = GetMainAttraction(confirmed[^2]);
                        prevLat = prev.Latitude;
                        prevLon = prev.Longitude;

                        if (prev != null && prev.Category == AttractionCategories.ParksAndGardens)
                        {
                            searchRadPrev = Math.Sqrt((prev as Attraction)!.Square ?? 810000) / 1.5;
                        }
                    }

                    double distToRep = SpatialMath.Distance(prevLat, prevLon, repMain.Latitude, repMain.Longitude);

                    if (!TryToFindRouteBetweenPoints(prevLat, prevLon, repMain.Latitude, repMain.Longitude, distToRep, filter, out Section secToRep, searchRadPrev, searchRadRep))
                    {
                        continue;
                    }

                    double distRepToRoot = SpatialMath.Distance(repMain.Latitude, repMain.Longitude, rootLat, rootLon);

                    if (TryToFindRouteBetweenPoints(repMain.Latitude, repMain.Longitude, rootLat, rootLon, distRepToRoot, filter, out Section secToRoot, searchRadPrev))
                    {
                        confirmed[^1] = replacement;
                        ans[^1] = secToRep;
                        ans.Add(secToRoot);
                        found = true;
                        break;
                    }
                }

                if (found)
                {
                    return new Pair<List<Cluster>, List<Section>>(confirmed, ans);
                }

                confirmed.RemoveAt(confirmed.Count - 1);
                ans.RemoveAt(ans.Count - 1);
            }

            return new Pair<List<Cluster>, List<Section>>(confirmed, ans);
        }


        /// <summary>
        /// Пытается найти маршрут между двумя точками, пробуя методы в порядке приоритета:
        /// прямой маршрут → маршрут с пересадкой внутри одного вида → маршрут с пересадкой между видами транспорта.
        /// </summary>
        private bool TryToFindRouteBetweenPoints(double lat1, double lon1, double lat2, double lon2, double dist, TransportFilter filter, out Section sect, double searchRadFor1 = 600, double searchRadFor2 = 600)
        {
            if (dist <= 800)
            {
                sect = new Section([], [], (int)(dist / 66), 0, false);
                return true;
            }
            searchRadFor1 *= GetDistanceMultilpier(dist);
            searchRadFor2 *= GetDistanceMultilpier(dist);

            int SR1 = searchRadFor1 >= int.MaxValue ? int.MaxValue : (int)searchRadFor1;
            int SR2 = searchRadFor2 >= int.MaxValue ? int.MaxValue : (int)searchRadFor2;

            Pair<IStation[], MetroStation[]> stationsForPoint1 = CTF.GetClosestStations(lat1, lon1, filter, searchRad: SR1);
            Pair<IStation[], MetroStation[]> stationsForPoint2 = CTF.GetClosestStations(lat2, lon2, filter, searchRad: SR2);

            bool hasDirectRoute = TryToFindDirectRoute(stationsForPoint1, stationsForPoint2, lat1, lon1, lat2, lon2, out var sect1);
            if (hasDirectRoute && JudgeSection(sect1) == 1)
            {
                sect = sect1;
                return true;
            }

            bool hasIntersectionRoute = TryToFindIntersectionRoute(stationsForPoint1, stationsForPoint2, lat1, lon1, lat2, lon2, out var sect2);
            if (hasIntersectionRoute && JudgeSection(sect2) == 1)
            {
                sect = sect2;
                return true;
            }

            bool hasTransferRoute = TryToFindTransferRoute(stationsForPoint1, stationsForPoint2, dist, filter, lat1, lon1, lat2, lon2, out var sect3);
            if (hasTransferRoute && JudgeSection(sect3) == 1)
            {
                sect = sect3;
                return true;
            }

            sect = null!;
            if (hasDirectRoute)
            {
                sect = sect1;
            }

            if (hasIntersectionRoute && BetterTiming(sect2, sect))
            {
                sect = sect2;
            }

            if (hasTransferRoute && BetterTiming(sect3, sect))
            {
                sect = sect3;
            }

            return hasDirectRoute || hasIntersectionRoute || hasTransferRoute;
        }

        private static bool IsValidStopPair(double stopALat, double stopALon, double stopBLat, double stopBLon,
            double targetLat, double targetLon, double startLat, double startLon)
        {
            double distBToTarget = SpatialMath.Distance(stopBLat, stopBLon, targetLat, targetLon);
            double distAToTarget = SpatialMath.Distance(stopALat, stopALon, targetLat, targetLon);
            double distStartToTarget = SpatialMath.Distance(startLat, startLon, targetLat, targetLon);
            double distStartToA = SpatialMath.Distance(startLat, startLon, stopALat, stopALon);

            return distBToTarget + distStartToA < distStartToTarget && distBToTarget < distAToTarget;
        }

        /// <summary>
        /// Ищет прямой маршрут (без пересадок) между наборами станций у двух точек.
        /// Перебирает все пары наземных остановок и станций метро, выбирает вариант с минимальным временем.
        /// </summary>
        private bool TryToFindDirectRoute(Pair<IStation[], MetroStation[]> st1, Pair<IStation[], MetroStation[]> st2, double startLat, double startLon, double targetLat, double targetLon, out Section sect)
        {
            sect = null!;
            double bestWalkDistance = double.MaxValue;

            if (CTF.HasMetroSystem)
            {
                foreach (MetroStation ms1 in st1.Second)
                {
                    foreach (MetroStation ms2 in st2.Second)
                    {
                        if (!IsValidStopPair(ms1.Latitude, ms1.Longitude, ms2.Latitude, ms2.Longitude, targetLat, targetLon, startLat, startLon))
                        {
                            continue;
                        }

                        Section? candidate = TryBuildMetroSection(ms1, ms2);

                        if (candidate != null)
                        {
                            switch (JudgeSection(candidate))
                            {
                                case -1: continue;
                                case 1: sect = candidate; return true;
                                case 0: break;
                            }

                            double walkDist = SpatialMath.Distance(startLat, startLon, ms1.Latitude, ms1.Longitude)
                                            + SpatialMath.Distance(ms2.Latitude, ms2.Longitude, targetLat, targetLon);

                            if (BetterTiming(candidate, sect, walkDist, bestWalkDistance))
                            {
                                bestWalkDistance = walkDist;
                                sect = candidate;
                            }
                        }
                    }
                }
            }

            foreach (IStation stop1 in st1.First)
            {
                foreach (IStation stop2 in st2.First)
                {
                    if (stop1 is Station s1 && stop2 is Station s2 && s1.Type != s2.Type)
                    {
                        continue;
                    }

                    if (!IsValidStopPair(stop1.Latitude, stop1.Longitude, stop2.Latitude, stop2.Longitude, targetLat, targetLon, startLat, startLon))
                    {
                        continue;
                    }

                    Section? candidate = TryBuildDirectSurfaceGap(stop1, stop2);

                    if (candidate != null)
                    {
                        switch (JudgeSection(candidate))
                        {
                            case -1: continue;
                            case 1: sect = candidate; return true;
                            case 0: break;
                        }

                        double walkDist = SpatialMath.Distance(startLat, startLon, stop1.Latitude, stop1.Longitude)
                                        + SpatialMath.Distance(stop2.Latitude, stop2.Longitude, targetLat, targetLon);

                        if (BetterTiming(candidate, sect, walkDist, bestWalkDistance))
                        {
                            bestWalkDistance = walkDist;
                            sect = candidate;
                        }
                    }
                }
            }

            return sect != null;
        }

        /// <summary>
        /// Ищет маршрут с одной пересадкой внутри одного вида наземного транспорта
        /// или с пересадками внутри метро.
        /// </summary>
        private bool TryToFindIntersectionRoute(Pair<IStation[], MetroStation[]> st1, Pair<IStation[], MetroStation[]> st2, double startLat, double startLon, double targetLat, double targetLon, out Section sect)
        {
            sect = null!;
            double bestWalkDistance = double.MaxValue;

            foreach (IStation stop1 in st1.First)
            {
                foreach (IStation stop2 in st2.First)
                {
                    if (stop1 is Station s1 && stop2 is Station s2 && s1.Type != s2.Type)
                    {
                        continue;
                    }

                    if (!IsValidStopPair(stop1.Latitude, stop1.Longitude, stop2.Latitude, stop2.Longitude, targetLat, targetLon, startLat, startLon))
                    {
                        continue;
                    }

                    Section? candidate = TryBuildIntersectionSurfaceRoute(stop1, stop2);

                    if (candidate != null)
                    {
                        switch (JudgeSection(candidate))
                        {
                            case -1: continue;
                            case 1: sect = candidate; return true;
                            case 0: break;
                        }

                        double walkDist = SpatialMath.Distance(startLat, startLon, stop1.Latitude, stop1.Longitude)
                                        + SpatialMath.Distance(stop2.Latitude, stop2.Longitude, targetLat, targetLon);

                        if (BetterTiming(candidate, sect, walkDist, bestWalkDistance))
                        {
                            bestWalkDistance = walkDist;
                            sect = candidate;
                        }
                    }
                }
            }

            return sect != null;
        }

        /// <summary>
        /// Ищет маршрут с пересадкой между различными видами транспорта:
        /// наземный одного типа → наземный другого типа, наземный → метро, метро → наземный.
        /// Допускается не более одной пересадки на наземный транспорт.
        /// </summary>
        private bool TryToFindTransferRoute(Pair<IStation[], MetroStation[]> st1, Pair<IStation[], MetroStation[]> st2, double dist, TransportFilter filter, double startLat, double startLon, double targetLat, double targetLon, out Section sect)
        {
            sect = null!;
            double bestWalkDistance = double.MaxValue;

            if (CTF.HasMetroSystem)
            {
                MetroStation[] metroNearStartWide = CTF.GetClosestMetroStations(startLat, startLon, 5, 6000);
                MetroStation[] metroNearTargetWide = CTF.GetClosestMetroStations(targetLat, targetLon, 5, 6000);

                foreach (MetroStation metroEntry in metroNearStartWide)
                {
                    foreach (MetroStation metroExit in st2.Second)
                    {
                        Section? metroSection = TryBuildMetroSection(metroEntry, metroExit);

                        if (metroSection == null)
                        {
                            continue;
                        }

                        foreach (IStation surfaceStop in st1.First)
                        {
                            Gap<IStation>? surfaceGap = BuildSurfaceGapToMetro(surfaceStop, metroEntry);

                            if (surfaceGap == null)
                            {
                                continue;
                            }

                            TransportType surfaceType = GetStationType(surfaceStop);
                            int surfaceTime = (int)((surfaceGap.NodesVisited.Length + 1) * GetMinutesPerStop(surfaceType))
                                + GetTransferMinutes(surfaceType);
                            int totalTime = surfaceTime + MetroTransferMinutes + metroSection.EstimatedTimeInMinutes;
                            int totalTransfers = 1 + metroSection.NumberOfTransfers;

                            Section candidate = new Section([surfaceGap], metroSection.MetroGaps, totalTime, totalTransfers, false);

                            switch (JudgeSection(candidate))
                            {
                                case -1: continue;
                                case 1: sect = candidate; return true;
                                case 0: break;
                            }

                            double walkDist = SpatialMath.Distance(startLat, startLon, surfaceStop.Latitude, surfaceStop.Longitude)
                                            + SpatialMath.Distance(metroExit.Latitude, metroExit.Longitude, targetLat, targetLon);

                            if (BetterTiming(candidate, sect, walkDist, bestWalkDistance))
                            {
                                bestWalkDistance = walkDist;
                                sect = candidate;
                            }
                        }
                    }
                }

                foreach (MetroStation metroEntry in st1.Second)
                {
                    foreach (MetroStation metroExit in metroNearTargetWide)
                    {
                        Section? metroSection = TryBuildMetroSection(metroEntry, metroExit);

                        if (metroSection == null)
                        {
                            continue;
                        }

                        foreach (IStation surfaceStop in st2.First)
                        {
                            Gap<IStation>? surfaceGap = BuildSurfaceGapFromMetro(metroExit, surfaceStop);

                            if (surfaceGap == null)
                            {
                                continue;
                            }

                            TransportType surfaceType = GetStationType(surfaceStop);
                            int surfaceTime = (int)((surfaceGap.NodesVisited.Length + 1) * GetMinutesPerStop(surfaceType))
                                + GetTransferMinutes(surfaceType);
                            int totalTime = metroSection.EstimatedTimeInMinutes + GetTransferMinutes(surfaceType) + surfaceTime;
                            int totalTransfers = metroSection.NumberOfTransfers + 1;

                            Section candidate = new Section([surfaceGap], metroSection.MetroGaps, totalTime, totalTransfers, true);

                            switch (JudgeSection(candidate))
                            {
                                case -1: continue;
                                case 1: sect = candidate; return true;
                                case 0: break;
                            }

                            double walkDist = SpatialMath.Distance(startLat, startLon, metroEntry.Latitude, metroEntry.Longitude)
                                            + SpatialMath.Distance(surfaceStop.Latitude, surfaceStop.Longitude, targetLat, targetLon);

                            if (BetterTiming(candidate, sect, walkDist, bestWalkDistance))
                            {
                                bestWalkDistance = walkDist;
                                sect = candidate;
                            }
                        }
                    }
                }
            }

            foreach (IStation stop1 in st1.First)
            {
                foreach (IStation stop2 in st2.First)
                {
                    if (stop1 is Station s1 && stop2 is Station s2 && s1.Type == s2.Type)
                    {
                        continue;
                    }

                    if (!IsValidStopPair(stop1.Latitude, stop1.Longitude, stop2.Latitude, stop2.Longitude, targetLat, targetLon, startLat, startLon))
                    {
                        continue;
                    }

                    Section? candidate = TryBuildCrossSurfaceRoute(stop1, stop2);

                    if (candidate != null)
                    {
                        switch (JudgeSection(candidate))
                        {
                            case -1: continue;
                            case 1: sect = candidate; return true;
                            case 0: break;
                        }

                        double walkDist = SpatialMath.Distance(startLat, startLon, stop1.Latitude, stop1.Longitude)
                                        + SpatialMath.Distance(stop2.Latitude, stop2.Longitude, targetLat, targetLon);

                        if (BetterTiming(candidate, sect, walkDist, bestWalkDistance))
                        {
                            bestWalkDistance = walkDist;
                            sect = candidate;
                        }
                    }
                }
            }

            return sect != null;
        }

        /// <summary>
        /// Пытается построить прямой Gap для наземного транспорта между двумя остановками.
        /// </summary>
        private Section? TryBuildDirectSurfaceGap(IStation stop1, IStation stop2)
        {
            TransportType type = GetStationType(stop1);

            IRoute? directRoute = FindDirectSurfaceRoute(stop1, stop2, type);

            if (directRoute == null)
            {
                return null;
            }

            RouteInfo? ri1 = stop1.Routes.Find(r => r.RouteID == directRoute.ID);
            RouteInfo? ri2 = stop2.Routes.Find(r => r.RouteID == directRoute.ID);

            if (ri1 == null || ri2 == null || ri1.Order >= ri2.Order)
            {
                return null;
            }

            IStation[] visited = ExtractVisitedStops(directRoute, ri1.Order, ri2.Order);

            string transport = GetTransportName(type);
            Gap<IStation> gap = new Gap<IStation>(0, stop1, stop2, visited, transport, directRoute.RouteNumber ?? "");

            int timeMinutes = (int)((visited.Length + 1) * GetMinutesPerStop(type)) + GetTransferMinutes(type);

            return new Section([gap], [], timeMinutes, 0, false);
        }

        /// <summary>
        /// Пытается построить маршрут с одной пересадкой внутри одного вида наземного транспорта.
        /// </summary>
        private Section? TryBuildIntersectionSurfaceRoute(IStation stop1, IStation stop2)
        {
            TransportType type = GetStationType(stop1);

            Section? bestSection = null;
            int bestTime = int.MaxValue;

            foreach (RouteInfo ri1 in stop1.Routes)
            {
                foreach (RouteInfo ri2 in stop2.Routes)
                {
                    if (ri1.RouteID == ri2.RouteID)
                    {
                        continue;
                    }

                    IStation? intersection = FindIntersectionStop(ri1.RouteID, ri2.RouteID, type);

                    if (intersection == null)
                    {
                        continue;
                    }

                    RouteInfo? riTransfer1 = intersection.Routes.Find(r => r.RouteID == ri1.RouteID);
                    RouteInfo? riTransfer2 = intersection.Routes.Find(r => r.RouteID == ri2.RouteID);

                    if (riTransfer1 == null || riTransfer2 == null)
                    {
                        continue;
                    }

                    if (ri1.Order >= riTransfer1.Order || riTransfer2.Order >= ri2.Order)
                    {
                        continue;
                    }

                    IRoute? route1 = GetSurfaceRoute(ri1.RouteID, type);
                    IRoute? route2 = GetSurfaceRoute(ri2.RouteID, type);

                    if (route1 == null || route2 == null)
                    {
                        continue;
                    }

                    IStation[] visited1 = ExtractVisitedStops(route1, ri1.Order, riTransfer1.Order);
                    IStation[] visited2 = ExtractVisitedStops(route2, riTransfer2.Order, ri2.Order);

                    string transport = GetTransportName(type);
                    Gap<IStation> gap1 = new Gap<IStation>(0, stop1, intersection, visited1, transport, route1.RouteNumber ?? "");
                    Gap<IStation> gap2 = new Gap<IStation>(1, intersection, stop2, visited2, transport, route2.RouteNumber ?? "");

                    int totalTime = (int)((visited1.Length + 1) * GetMinutesPerStop(type))
                        + GetTransferMinutes(type) * 2
                        + (int)((visited2.Length + 1) * GetMinutesPerStop(type));

                    if (totalTime < bestTime)
                    {
                        bestTime = totalTime;
                        bestSection = new Section([gap1, gap2], [], totalTime, 1, false);
                    }
                }
            }

            return bestSection;
        }

        /// <summary>
        /// Пытается построить маршрут с пересадкой между разными видами наземного транспорта.
        /// Ищет остановки другого типа рядом с остановками маршрутов stop1,
        /// затем проверяет прямой маршрут от найденной пересадочной остановки до stop2.
        /// </summary>
        private Section? TryBuildCrossSurfaceRoute(IStation stop1, IStation stop2)
        {
            TransportType type1 = GetStationType(stop1);
            TransportType type2 = GetStationType(stop2);

            if (type1 == type2)
            {
                return null;
            }

            Section? bestSection = null;
            int bestTime = int.MaxValue;

            foreach (RouteInfo ri1 in stop1.Routes)
            {
                IRoute? route1 = GetSurfaceRoute(ri1.RouteID, type1);

                if (route1 == null)
                {
                    continue;
                }

                foreach (IStation midStop in route1.Stops)
                {
                    RouteInfo? riMid = midStop.Routes.Find(r => r.RouteID == ri1.RouteID);

                    if (riMid == null || riMid.Order <= ri1.Order)
                    {
                        continue;
                    }

                    IStation[] nearbyStops = GetClosestSurfaceStops(midStop.Latitude, midStop.Longitude, type2, 3, 300);

                    foreach (IStation transferStop in nearbyStops)
                    {
                        IRoute? route2 = FindDirectSurfaceRoute(transferStop, stop2, type2);

                        if (route2 == null)
                        {
                            continue;
                        }

                        RouteInfo? riTransfer = transferStop.Routes.Find(r => r.RouteID == route2.ID);
                        RouteInfo? riEnd = stop2.Routes.Find(r => r.RouteID == route2.ID);

                        if (riTransfer == null || riEnd == null || riTransfer.Order >= riEnd.Order)
                        {
                            continue;
                        }

                        IStation[] visited1 = ExtractVisitedStops(route1, ri1.Order, riMid.Order);
                        IStation[] visited2 = ExtractVisitedStops(route2, riTransfer.Order, riEnd.Order);

                        string transport1 = GetTransportName(type1);
                        string transport2 = GetTransportName(type2);

                        Gap<IStation> gap1 = new Gap<IStation>(0, stop1, midStop, visited1, transport1, route1.RouteNumber ?? "");
                        Gap<IStation> gap2 = new Gap<IStation>(1, transferStop, stop2, visited2, transport2, route2.RouteNumber ?? "");

                        int transferTime = GetTransferMinutes(type2);
                        int totalTime = (int)((visited1.Length + 1) * GetMinutesPerStop(type1))
                            + GetTransferMinutes(type1)
                            + (int)((visited2.Length + 1) * GetMinutesPerStop(type2))
                            + GetTransferMinutes(type2);

                        if (totalTime < bestTime)
                        {
                            bestTime = totalTime;
                            bestSection = new Section([gap1, gap2], [], totalTime, 1, false);
                        }
                    }
                }
            }

            return bestSection;
        }

        /// <summary>
        /// Строит оптимальный маршрут метро между двумя станциями, используя алгоритм Дейкстры
        /// из MetroManager. Поддерживает произвольное количество пересадок и кольцевые линии.
        /// </summary>
        private Section? TryBuildMetroSection(MetroStation ms1, MetroStation ms2)
        {
            if (!CTF.HasMetroSystem)
            {
                return null;
            }

            MetroPathResult? pathResult = CTF.MetroManager!.FindShortestPath(ms1, ms2);

            if (pathResult == null || pathResult.Segments.Count == 0)
            {
                return null;
            }

            MetroGap[] gaps = new MetroGap[pathResult.Segments.Count];

            int totalTime = 0;

            for (int i = 0; i < pathResult.Segments.Count; i++)
            {
                MetroPathSegment seg = pathResult.Segments[i];

                gaps[i] = new MetroGap(
                    i,
                    seg.From,
                    seg.To,
                    seg.Intermediate,
                    "metro",
                    seg.Route.RouteNumber ?? ""
                );

                totalTime += (int)(seg.StopCount * MetroMinutesPerStop) + MetroTransferMinutes;
            }

            totalTime += pathResult.TransferCount * MetroTransferMinutes;

            return new Section([], gaps, totalTime, pathResult.TransferCount, true);
        }

        /// <summary>
        /// Ищет наземный Gap от остановки до ближайшей остановки рядом со станцией метро.
        /// </summary>
        private Gap<IStation>? BuildSurfaceGapToMetro(IStation surfaceStop, MetroStation metroStation)
        {
            TransportType type = GetStationType(surfaceStop);
            IStation[] stopsNearMetro = GetClosestSurfaceStops(metroStation.Latitude, metroStation.Longitude, type, 5, 500);

            foreach (IStation nearMetro in stopsNearMetro)
            {
                IRoute? route = FindDirectSurfaceRoute(surfaceStop, nearMetro, type);

                if (route == null)
                {
                    continue;
                }

                RouteInfo? ri1 = surfaceStop.Routes.Find(r => r.RouteID == route.ID);
                RouteInfo? ri2 = nearMetro.Routes.Find(r => r.RouteID == route.ID);

                if (ri1 == null || ri2 == null || ri1.Order >= ri2.Order)
                {
                    continue;
                }

                IStation[] visited = ExtractVisitedStops(route, ri1.Order, ri2.Order);
                string transport = GetTransportName(type);

                return new Gap<IStation>(0, surfaceStop, nearMetro, visited, transport, route.RouteNumber ?? "");
            }

            return null;
        }

        /// <summary>
        /// Ищет наземный Gap от ближайшей остановки рядом со станцией метро до целевой остановки.
        /// </summary>
        private Gap<IStation>? BuildSurfaceGapFromMetro(MetroStation metroStation, IStation surfaceStop)
        {
            TransportType type = GetStationType(surfaceStop);
            IStation[] stopsNearMetro = GetClosestSurfaceStops(metroStation.Latitude, metroStation.Longitude, type, 5, 500);

            foreach (IStation nearMetro in stopsNearMetro)
            {
                IRoute? route = FindDirectSurfaceRoute(nearMetro, surfaceStop, type);

                if (route == null)
                {
                    continue;
                }

                RouteInfo? ri1 = nearMetro.Routes.Find(r => r.RouteID == route.ID);
                RouteInfo? ri2 = surfaceStop.Routes.Find(r => r.RouteID == route.ID);

                if (ri1 == null || ri2 == null || ri1.Order >= ri2.Order)
                {
                    continue;
                }

                IStation[] visited = ExtractVisitedStops(route, ri1.Order, ri2.Order);
                string transport = GetTransportName(type);

                return new Gap<IStation>(1, nearMetro, surfaceStop, visited, transport, route.RouteNumber ?? "");
            }

            return null;
        }

        private int JudgeSection(Section section)
        {
            double lat1, lon1;
            double lat2, lon2;

            if (section.MetroGaps.Length == 0)
            {
                if (section.Gaps.Length == 0)
                {
                    return 0;
                }

                IStation start = section.Gaps[0].StartNode;
                IStation end = section.Gaps[^1].EndNode;

                lat1 = start.Latitude;
                lon1 = start.Longitude;
                lat2 = end.Latitude;
                lon2 = end.Longitude;
            }
            else if (section.Gaps.Length == 0)
            {
                MetroStation start = section.MetroGaps[0].StartNode;
                MetroStation end = section.MetroGaps[^1].EndNode;

                lat1 = start.Latitude;
                lon1 = start.Longitude;
                lat2 = end.Latitude;
                lon2 = end.Longitude;
            }
            else
            {
                if (section.MetrosFirst)
                {
                    MetroStation start = section.MetroGaps[0].StartNode;
                    IStation end = section.Gaps[^1].EndNode;

                    lat1 = start.Latitude;
                    lon1 = start.Longitude;
                    lat2 = end.Latitude;
                    lon2 = end.Longitude;
                }
                else
                {
                    IStation start = section.Gaps[0].StartNode;
                    MetroStation end = section.MetroGaps[^1].EndNode;

                    lat1 = start.Latitude;
                    lon1 = start.Longitude;
                    lat2 = end.Latitude;
                    lon2 = end.Longitude;
                }
            }

            double dist = SpatialMath.Distance(lat1, lon1, lat2, lon2);
            double averageSpeed = dist / section.EstimatedTimeInMinutes;

            if (averageSpeed < 145)
            {
                return -1;
            }
            if (averageSpeed >= 230)
            {
                return 1;
            }

            return 0;
        }

        private double GetDistanceMultilpier(double dist)
        {
            if (dist < 5000)
            {
                return 1.0;
            }
            if (dist < 15000)
            {
                return 1.2;
            }

            return 1.5;
        }
        /// <summary>
        /// Ищет прямой маршрут наземного транспорта между двумя остановками одного типа.
        /// </summary>
        private IRoute? FindDirectSurfaceRoute(IStation stop1, IStation stop2, TransportType type)
        {
            if (type == TransportType.Bus && CTF.HasBusSystem)
            {
                return CTF.BusManager!.DirectRouteBetween((BusStop)stop1, (BusStop)stop2);
            }
            if (type == TransportType.Tram && CTF.HasTramSystem)
            {
                return CTF.TramManager!.DirectRouteBetween((TramStop)stop1, (TramStop)stop2);
            }
            if (type == TransportType.Trolleybus && CTF.HasTrolleybusSystem)
            {
                return CTF.TrolleybusManager!.DirectRouteBetween((TrolleybusStop)stop1, (TrolleybusStop)stop2);
            }

            return null;
        }

        private bool BetterTiming(Section candidate, Section? sect, double walkDist = 0, double bestWalkDistance = 0)
        {
            if (sect == null)
            {
                return true;
            }

            int timeForSect = (int)(bestWalkDistance / 66) + sect.EstimatedTimeInMinutes;
            int timeForCandidate = (int)(walkDist / 66) + candidate.EstimatedTimeInMinutes;

            return timeForCandidate < timeForSect;
        }

        /// <summary>
        /// Ищет общую остановку двух маршрутов одного вида наземного транспорта.
        /// </summary>
        private IStation? FindIntersectionStop(ulong routeId1, ulong routeId2, TransportType type)
        {
            if (type == TransportType.Bus && CTF.HasBusSystem)
            {
                return CTF.BusManager!.GetRoutesIntersection(routeId1, routeId2);
            }
            if (type == TransportType.Tram && CTF.HasTramSystem)
            {
                return CTF.TramManager!.GetRoutesIntersection(routeId1, routeId2);
            }
            if (type == TransportType.Trolleybus && CTF.HasTrolleybusSystem)
            {
                return CTF.TrolleybusManager!.GetRoutesIntersection(routeId1, routeId2);
            }

            return null;
        }

        /// <summary>
        /// Возвращает объект маршрута наземного транспорта по ID.
        /// </summary>
        private IRoute? GetSurfaceRoute(ulong routeId, TransportType type)
        {
            if (type == TransportType.Bus && CTF.HasBusSystem)
            {
                return CTF.BusManager!.GetRouteById(routeId);
            }
            if (type == TransportType.Tram && CTF.HasTramSystem)
            {
                return CTF.TramManager!.GetRouteById(routeId);
            }
            if (type == TransportType.Trolleybus && CTF.HasTrolleybusSystem)
            {
                return CTF.TrolleybusManager!.GetRouteById(routeId);
            }

            return null;
        }

        /// <summary>
        /// Возвращает ближайшие наземные остановки заданного типа к точке.
        /// </summary>
        private IStation[] GetClosestSurfaceStops(double lat, double lon, TransportType type, int amount = 5, int searchRad = 500)
        {
            if (type == TransportType.Bus)
            {
                return CTF.GetClosestBusStops(lat, lon, amount, searchRad);
            }
            if (type == TransportType.Tram)
            {
                return CTF.GetClosestTramStops(lat, lon, amount, searchRad);
            }
            if (type == TransportType.Trolleybus)
            {
                return CTF.GetClosestTrolleybusStops(lat, lon, amount, searchRad);
            }

            return [];
        }

        /// <summary>
        /// Извлекает промежуточные остановки маршрута между двумя позициями Order (не включая start и end).
        /// </summary>
        private static IStation[] ExtractVisitedStops(IRoute route, int startOrder, int endOrder)
        {
            List<IStation> visited = new List<IStation>();

            for (int i = startOrder; i < endOrder - 1; i++)
            {
                visited.Add(route.Stops[i]);
            }

            return [.. visited];
        }

        private static TransportType GetStationType(IStation stop)
        {
            if (stop is BusStop)
            {
                return TransportType.Bus;
            }
            if (stop is TramStop)
            {
                return TransportType.Tram;
            }
            if (stop is TrolleybusStop)
            {
                return TransportType.Trolleybus;
            }

            return TransportType.Bus;
        }

        private static string GetTransportName(TransportType type)
        {
            if (type == TransportType.Bus)
            {
                return "bus";
            }
            if (type == TransportType.Tram)
            {
                return "tram";
            }
            if (type == TransportType.Trolleybus)
            {
                return "trolleybus";
            }

            return "bus";
        }

        private static double GetMinutesPerStop(TransportType type)
        {
            if (type == TransportType.Bus)
            {
                return BusMinutesPerStop;
            }
            if (type == TransportType.Tram)
            {
                return TramMinutesPerStop;
            }
            if (type == TransportType.Trolleybus)
            {
                return TrolleybusMinutesPerStop;
            }

            return BusMinutesPerStop;
        }

        private static int GetTransferMinutes(TransportType type)
        {
            if (type == TransportType.Bus)
            {
                return BusTransferMinutes;
            }
            if (type == TransportType.Tram)
            {
                return TramTransferMinutes;
            }
            if (type == TransportType.Trolleybus)
            {
                return TrolleybusTransferMinutes;
            }

            return BusTransferMinutes;
        }

        private IAttraction GetMainAttraction(Cluster cluster)
        {
            int ans = 0;
            int interestRate = 0;

            if (cluster.Attractions[0] is Attraction at)
            {
                interestRate = at.EstimatedVisitMinutes * at.Tags.Count;
            }

            for (int i = 1; i < cluster.Attractions.Length; i++)
            {
                IAttraction curr = cluster.Attractions[i];
                if (curr is Attraction atr)
                {
                    int irCurr = atr.Tags.Count * atr.EstimatedVisitMinutes;
                    if (irCurr > interestRate)
                    {
                        ans = i;
                        interestRate = irCurr;
                    }
                }
                else
                {
                    continue;
                }
            }

            return cluster.Attractions[ans];
        }

    }
}