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
    public class RoutePlanner
    {
        private CityTransportFacade CTF;
        private AttractionCollector AT;

        private const double BusMinutesPerStop = 1.5;
        private const double TrolleybusMinutesPerStop = 1.5;
        private const double TramMinutesPerStop = 3.0;
        private const double MetroMinutesPerStop = 2.0;

        private const int BusTransferMinutes = 15;
        private const int TramTransferMinutes = 15;
        private const int TrolleybusTransferMinutes = 15;
        private const int MetroTransferMinutes = 10;

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

        public Pair<Cluster[], Section[]> Execute(double rootLat, double rootLon, TransportFilter filter, int time)
        {
            Cluster[] visitPoints = AT.SelectClusters(rootLat, rootLon, time);
            Section[] sections = BuildRoute(rootLat, rootLon, rootLat, rootLon, filter, visitPoints, time);
            return new Pair<Cluster[], Section[]>(visitPoints, sections);
        }

        private Section[] BuildRoute(double rootLat, double rootLon, double endLat, double endLon, TransportFilter filter, Cluster[] visitPoints, int time)
        {
            if (visitPoints.Length == 0)
            {
                return [];
            }

            Section[] ans = new Section[visitPoints.Length + 1];

            for (int i = 0; i < visitPoints.Length + 1; i++)
            {
                double lat1, lon1;
                double lat2, lon2;

                if (i == 0)
                {
                    lat1 = rootLat;
                    lon1 = rootLon;
                    IAttraction target = GetMainAttraction(visitPoints[i]);
                    lat2 = target.Latitude;
                    lon2 = target.Longitude;
                }
                else if (i == visitPoints.Length)
                {
                    IAttraction start = GetMainAttraction(visitPoints[i - 1]);
                    lat1 = start.Latitude;
                    lon1 = start.Longitude;

                    lat2 = endLat;
                    lon2 = endLon;
                }
                else
                {
                    IAttraction start = GetMainAttraction(visitPoints[i - 1]);
                    IAttraction target = GetMainAttraction(visitPoints[i]);

                    lat1 = start.Latitude;
                    lon1 = start.Longitude;
                    lat2 = target.Latitude;
                    lon2 = target.Longitude;
                }

                double dist = SpatialMath.Distance(lat1, lon1, lat2, lon2);

                if (dist <= 500)
                {
                    ans[i] = new Section([], [], (int)(dist / 66), 0);
                    continue;
                }

                if (TryToFindRouteBetweenPoints(lat1, lon1, lat2, lon2, dist, filter, out Section sec))
                {
                    ans[i] = sec;
                    continue;
                }

                if (i == visitPoints.Length)
                {
                    Cluster[] replacements = AT.GetReplacements(visitPoints, i - 1, rootLat, rootLon, time);
                    bool found = false;

                    foreach (Cluster replacement in replacements)
                    {
                        IAttraction repMain = GetMainAttraction(replacement);

                        if (TryToFindRouteBetweenPoints(repMain.Latitude, repMain.Longitude, endLat, endLon, dist, filter, out Section secToEnd))
                        {
                            if (i - 1 == 0)
                            {
                                lat1 = rootLat;
                                lon1 = rootLon;
                            }
                            else
                            {
                                IAttraction prev = GetMainAttraction(visitPoints[i - 2]);
                                lat1 = prev.Latitude;
                                lon1 = prev.Longitude;
                            }

                            if (TryToFindRouteBetweenPoints(lat1, lon1, repMain.Latitude, repMain.Longitude, dist, filter, out Section secToRep))
                            {
                                ans[i - 1] = secToRep;
                                ans[i] = secToEnd;
                                visitPoints[i - 1] = replacement;
                                found = true;
                                break;
                            }
                        }
                    }

                    if (found)
                    {
                        continue;
                    }

                    List<Cluster> newVisitPoints = new List<Cluster>();
                    for (int j = 0; j < visitPoints.Length - 1; j++)
                    {
                        newVisitPoints.Add(visitPoints[j]);
                    }

                    if (newVisitPoints.Count == 0)
                    {
                        return [];
                    }

                    return BuildRoute(rootLat, rootLon, endLat, endLon, filter, [.. newVisitPoints], time);
                }
                else
                {
                    Cluster[] replacements = AT.GetReplacements(visitPoints, i, rootLat, rootLon, time);
                    bool found = false;
                    foreach (Cluster replacement in replacements)
                    {
                        IAttraction target = GetMainAttraction(replacement);
                        lat2 = target.Latitude;
                        lon2 = target.Longitude;
                        if (TryToFindRouteBetweenPoints(lat1, lon1, lat2, lon2, dist, filter, out Section sect))
                        {
                            ans[i] = sect;
                            visitPoints[i] = replacement;
                            found = true;
                            break;
                        }
                    }

                    if (found)
                    {
                        continue;
                    }

                    List<Cluster> newVisitPoints = [];
                    for (int j = i + 1; j < visitPoints.Length; j++)
                    {
                        newVisitPoints.Add(visitPoints[j]);
                    }

                    if (i == 0)
                    {
                        return BuildRoute(rootLat, rootLon, endLat, endLon, filter, [.. newVisitPoints], time);
                    }
                    else
                    {
                        IAttraction atr = GetMainAttraction(visitPoints[i - 1]);
                        return Merge(ans[0..i], BuildRoute(atr.Latitude, atr.Longitude, endLat, endLon, filter, [.. newVisitPoints], time));
                    }
                }
            }

            return ans;
        }

        /// <summary>
        /// Пытается найти маршрут между двумя точками, пробуя методы в порядке приоритета:
        /// прямой маршрут → маршрут с пересадкой внутри одного вида → маршрут с пересадкой между видами транспорта.
        /// Дополнительная фильтрация пар остановок (попарная):
        /// Для каждой пары (stopA из множества у старта, stopB из множества у цели):
        /// 1. stopB должна быть ближе к цели (lat2,lon2) чем stopA.
        /// Проверка выполняется внутри TryToFindDirectRoute/IntersectionRoute/TransferRoute.
        /// </summary>
        private bool TryToFindRouteBetweenPoints(double lat1, double lon1, double lat2, double lon2, double dist, TransportFilter filter, out Section sect)
        {
            Pair<IStation[], MetroStation[]> stationsForPoint1 = CTF.GetClosestStations(lat1, lon1, filter, searchRad: 350);
            Pair<IStation[], MetroStation[]> stationsForPoint2 = CTF.GetClosestStations(lat2, lon2, filter, searchRad: 350);

            if (TryToFindDirectRoute(stationsForPoint1, stationsForPoint2, lat1, lon1, lat2, lon2, out sect))
            {
                return true;
            }

            if (TryToFindIntersectionRoute(stationsForPoint1, stationsForPoint2, lat1, lon1, lat2, lon2, out sect))
            {
                return true;
            }

            if (TryToFindTransferRoute(stationsForPoint1, stationsForPoint2, dist, filter, lat1, lon1, lat2, lon2, out sect))
            {
                return true;
            }

            sect = null!;
            return false;
        }

        // ==================== ПРЯМОЙ МАРШРУТ (БЕЗ ПЕРЕСАДОК) ====================

        /// <summary>
        /// Проверяет два условия:
        /// 1. stopB (у цели) ближе к цели чем текущее местоположение (startLat, startLon).
        /// 2. stopB ближе к цели чем stopA (у старта).
        /// </summary>
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
        /// Пара (stopA, stopB) рассматривается только если stopB ближе к цели чем stopA.
        /// </summary>
        private bool TryToFindDirectRoute(Pair<IStation[], MetroStation[]> st1, Pair<IStation[], MetroStation[]> st2, double startLat, double startLon, double targetLat, double targetLon, out Section sect)
        {
            sect = null!;
            int bestTime = int.MaxValue;

            // Наземный транспорт: прямой маршрут
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

                    if (candidate != null && candidate.EstimatedTimeInMinutes < bestTime)
                    {
                        bestTime = candidate.EstimatedTimeInMinutes;
                        sect = candidate;
                    }
                }
            }

            // Метро: прямой маршрут (обе станции на одной линии)
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

                        Section? candidate = TryBuildDirectMetroGap(ms1, ms2);

                        if (candidate != null && candidate.EstimatedTimeInMinutes < bestTime)
                        {
                            bestTime = candidate.EstimatedTimeInMinutes;
                            sect = candidate;
                        }
                    }
                }
            }

            return sect != null;
        }

        // ==================== МАРШРУТ С ПЕРЕСАДКОЙ ВНУТРИ ОДНОГО ВИДА ====================

        /// <summary>
        /// Ищет маршрут с одной пересадкой внутри одного вида наземного транспорта
        /// или с пересадками внутри метро (через MetroManager.GetRoutesIntersection).
        /// Пара (stopA, stopB) рассматривается только если stopB ближе к цели чем stopA.
        /// </summary>
        private bool TryToFindIntersectionRoute(Pair<IStation[], MetroStation[]> st1, Pair<IStation[], MetroStation[]> st2, double startLat, double startLon, double targetLat, double targetLon, out Section sect)
        {
            sect = null!;
            int bestTime = int.MaxValue;

            // Наземный транспорт: пересадка через общую остановку двух маршрутов одного типа
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

                    if (candidate != null && candidate.EstimatedTimeInMinutes < bestTime)
                    {
                        bestTime = candidate.EstimatedTimeInMinutes;
                        sect = candidate;
                    }
                }
            }

            // Метро: пересадка между линиями
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

                        Section? candidate = TryBuildMetroWithTransfers(ms1, ms2);

                        if (candidate != null && candidate.EstimatedTimeInMinutes < bestTime)
                        {
                            bestTime = candidate.EstimatedTimeInMinutes;
                            sect = candidate;
                        }
                    }
                }
            }

            return sect != null;
        }

        // ==================== МАРШРУТ С ПЕРЕСАДКОЙ МЕЖДУ ВИДАМИ ТРАНСПОРТА ====================

        /// <summary>
        /// Ищет маршрут с пересадкой между различными видами транспорта:
        /// наземный одного типа → наземный другого типа, наземный → метро, метро → наземный.
        /// Допускается не более одной пересадки на наземный транспорт.
        /// Пара (stopA, stopB) рассматривается только если stopB ближе к цели чем stopA.
        /// </summary>
        private bool TryToFindTransferRoute(Pair<IStation[], MetroStation[]> st1, Pair<IStation[], MetroStation[]> st2, double dist, TransportFilter filter, double startLat, double startLon, double targetLat, double targetLon, out Section sect)
        {
            sect = null!;
            int bestTime = int.MaxValue;

            // Стратегия 1: наземный тип A → наземный тип B (пересадка между разными видами наземного транспорта)
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

                    if (candidate != null && candidate.EstimatedTimeInMinutes < bestTime)
                    {
                        bestTime = candidate.EstimatedTimeInMinutes;
                        sect = candidate;
                    }
                }
            }

            if (!CTF.HasMetroSystem)
            {
                return sect != null;
            }

            // Стратегия 2: наземный → метро → пешком до точки 2
            foreach (IStation surfaceStop1 in st1.First)
            {
                MetroStation[] metroNearStop1 = CTF.GetClosestMetroStations(surfaceStop1.Latitude, surfaceStop1.Longitude, 3, 700);

                foreach (MetroStation metroEntry in metroNearStop1)
                {
                    foreach (MetroStation metroExit in st2.Second)
                    {
                        Section? candidate = TryBuildSurfaceThenMetro(surfaceStop1, metroEntry, metroExit);

                        if (candidate != null && candidate.EstimatedTimeInMinutes < bestTime)
                        {
                            bestTime = candidate.EstimatedTimeInMinutes;
                            sect = candidate;
                        }
                    }
                }
            }

            // Стратегия 3: пешком до метро → метро → наземный от метро до точки 2
            foreach (MetroStation metroEntry in st1.Second)
            {
                foreach (IStation surfaceStop2 in st2.First)
                {
                    MetroStation[] metroNearStop2 = CTF.GetClosestMetroStations(surfaceStop2.Latitude, surfaceStop2.Longitude, 3, 700);

                    foreach (MetroStation metroExit in metroNearStop2)
                    {
                        Section? candidate = TryBuildMetroThenSurface(metroEntry, metroExit, surfaceStop2);

                        if (candidate != null && candidate.EstimatedTimeInMinutes < bestTime)
                        {
                            bestTime = candidate.EstimatedTimeInMinutes;
                            sect = candidate;
                        }
                    }
                }
            }

            return sect != null;
        }

        // ==================== ПОСТРОЕНИЕ GAP-ОВ ДЛЯ НАЗЕМНОГО ТРАНСПОРТА ====================

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

            int timeMinutes = (int)(visited.Length * GetMinutesPerStop(type));

            return new Section([gap], [], timeMinutes, 0);
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

                    int transferTime = GetTransferMinutes(type);
                    int totalTime = (int)(visited1.Length * GetMinutesPerStop(type))
                                  + transferTime
                                  + (int)(visited2.Length * GetMinutesPerStop(type));

                    if (totalTime < bestTime)
                    {
                        bestTime = totalTime;
                        bestSection = new Section([gap1, gap2], [], totalTime, 1);
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

            // Для каждого маршрута stop1 находим его остановки и ищем рядом остановки типа type2
            foreach (RouteInfo ri1 in stop1.Routes)
            {
                IRoute? route1 = GetSurfaceRoute(ri1.RouteID, type1);

                if (route1 == null)
                {
                    continue;
                }

                // Перебираем остановки route1, которые идут после stop1
                foreach (IStation midStop in route1.Stops)
                {
                    RouteInfo? riMid = midStop.Routes.Find(r => r.RouteID == ri1.RouteID);

                    if (riMid == null || riMid.Order <= ri1.Order)
                    {
                        continue;
                    }

                    // Ищем остановки type2 рядом с этой промежуточной остановкой
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
                        int totalTime = (int)(visited1.Length * GetMinutesPerStop(type1))
                                      + transferTime
                                      + (int)(visited2.Length * GetMinutesPerStop(type2));

                        if (totalTime < bestTime)
                        {
                            bestTime = totalTime;
                            bestSection = new Section([gap1, gap2], [], totalTime, 1);
                        }
                    }
                }
            }

            return bestSection;
        }

        // ==================== ПОСТРОЕНИЕ GAP-ОВ ДЛЯ МЕТРО ====================

        /// <summary>
        /// Пытается построить прямой MetroGap (обе станции на одной линии, без пересадок).
        /// </summary>
        private Section? TryBuildDirectMetroGap(MetroStation ms1, MetroStation ms2)
        {
            if (!CTF.HasMetroSystem)
            {
                return null;
            }

            MetroRoute? directRoute = CTF.MetroManager!.GetDirectRouteBetween(ms1, ms2);

            if (directRoute == null)
            {
                return null;
            }

            int idx1 = directRoute.Stations.FindIndex(s => s.ID == ms1.ID);
            int idx2 = directRoute.Stations.FindIndex(s => s.ID == ms2.ID);

            if (idx1 < 0 || idx2 < 0 || idx1 >= idx2)
            {
                return null;
            }

            MetroStation[] visited = ExtractVisitedMetroStations(directRoute, idx1, idx2);

            MetroGap gap = new MetroGap(0, ms1, ms2, visited, "metro", directRoute.RouteNumber ?? "");

            int timeMinutes = (int)(visited.Length * MetroMinutesPerStop);

            return new Section([], [gap], timeMinutes, 0);
        }

        /// <summary>
        /// Пытается построить маршрут метро с пересадками между линиями.
        /// Использует MetroManager.GetRoutesIntersection для поиска пересадочных станций.
        /// </summary>
        private Section? TryBuildMetroWithTransfers(MetroStation ms1, MetroStation ms2)
        {
            if (!CTF.HasMetroSystem)
            {
                return null;
            }

            // Находим линии для каждой станции
            List<MetroRoute> routes1 = GetMetroRoutesForStation(ms1);
            List<MetroRoute> routes2 = GetMetroRoutesForStation(ms2);

            Section? bestSection = null;
            int bestTime = int.MaxValue;

            foreach (MetroRoute mr1 in routes1)
            {
                foreach (MetroRoute mr2 in routes2)
                {
                    if (mr1.ID == mr2.ID)
                    {
                        continue;
                    }

                    Pair<MetroStation, MetroStation>? intersection = CTF.MetroManager!.GetRoutesIntersection(mr1, mr2);

                    if (intersection == null)
                    {
                        continue;
                    }

                    MetroStation transferOut = intersection.First;  // станция на mr1
                    MetroStation transferIn = intersection.Second;  // станция на mr2

                    int idx1Start = mr1.Stations.FindIndex(s => s.ID == ms1.ID);
                    int idx1End = mr1.Stations.FindIndex(s => s.ID == transferOut.ID);

                    int idx2Start = mr2.Stations.FindIndex(s => s.ID == transferIn.ID);
                    int idx2End = mr2.Stations.FindIndex(s => s.ID == ms2.ID);

                    if (idx1Start < 0 || idx1End < 0 || idx2Start < 0 || idx2End < 0)
                    {
                        continue;
                    }

                    if (idx1Start >= idx1End || idx2Start >= idx2End)
                    {
                        continue;
                    }

                    MetroStation[] visited1 = ExtractVisitedMetroStations(mr1, idx1Start, idx1End);
                    MetroStation[] visited2 = ExtractVisitedMetroStations(mr2, idx2Start, idx2End);

                    MetroGap gap1 = new MetroGap(0, ms1, transferOut, visited1, "metro", mr1.RouteNumber ?? "");
                    MetroGap gap2 = new MetroGap(1, transferIn, ms2, visited2, "metro", mr2.RouteNumber ?? "");

                    int totalTime = (int)(visited1.Length * MetroMinutesPerStop)
                                  + MetroTransferMinutes
                                  + (int)(visited2.Length * MetroMinutesPerStop);

                    if (totalTime < bestTime)
                    {
                        bestTime = totalTime;
                        bestSection = new Section([], [gap1, gap2], totalTime, 1);
                    }
                }
            }

            return bestSection;
        }

        // ==================== КОМБИНИРОВАННЫЕ МАРШРУТЫ (НАЗЕМНЫЙ + МЕТРО) ====================

        /// <summary>
        /// Строит маршрут: наземный транспорт до станции метро, затем метро до точки назначения.
        /// </summary>
        private Section? TryBuildSurfaceThenMetro(IStation surfaceStop, MetroStation metroEntry, MetroStation metroExit)
        {
            // Ищем наземный Gap от surfaceStop до остановки рядом с metroEntry
            Gap<IStation>? surfaceGap = BuildSurfaceGapToMetro(surfaceStop, metroEntry);

            // Ищем метро-маршрут от metroEntry до metroExit (прямой или с пересадками внутри метро)
            Section? metroSection = TryBuildDirectMetroGap(metroEntry, metroExit);
            if (metroSection == null)
            {
                metroSection = TryBuildMetroWithTransfers(metroEntry, metroExit);
            }

            if (metroSection == null)
            {
                return null;
            }

            if (surfaceGap != null)
            {
                TransportType surfaceType = GetStationType(surfaceStop);
                int surfaceTime = (int)(surfaceGap.NodesVisited.Length * GetMinutesPerStop(surfaceType));
                int transferTime = MetroTransferMinutes;
                int totalTime = surfaceTime + transferTime + metroSection.EstimatedTimeInMinutes;
                int totalTransfers = 1 + metroSection.NumberOfTransfers;

                return new Section([surfaceGap], metroSection.MetroGaps, totalTime, totalTransfers);
            }
            else
            {
                // Нет наземного Gap-а — пешком до метро
                return metroSection;
            }
        }

        /// <summary>
        /// Строит маршрут: метро, затем наземный транспорт от станции метро до точки назначения.
        /// </summary>
        private Section? TryBuildMetroThenSurface(MetroStation metroEntry, MetroStation metroExit, IStation surfaceStop)
        {
            Section? metroSection = TryBuildDirectMetroGap(metroEntry, metroExit);
            if (metroSection == null)
            {
                metroSection = TryBuildMetroWithTransfers(metroEntry, metroExit);
            }

            if (metroSection == null)
            {
                return null;
            }

            Gap<IStation>? surfaceGap = BuildSurfaceGapFromMetro(metroExit, surfaceStop);

            if (surfaceGap != null)
            {
                TransportType surfaceType = GetStationType(surfaceStop);
                int surfaceTime = (int)(surfaceGap.NodesVisited.Length * GetMinutesPerStop(surfaceType));
                int transferTime = GetTransferMinutes(surfaceType);
                int totalTime = metroSection.EstimatedTimeInMinutes + transferTime + surfaceTime;
                int totalTransfers = metroSection.NumberOfTransfers + 1;

                return new Section([surfaceGap], metroSection.MetroGaps, totalTime, totalTransfers);
            }
            else
            {
                return metroSection;
            }
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

        // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

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

            foreach (IStation stop in route.Stops)
            {
                RouteInfo? ri = stop.Routes.Find(r => r.RouteID == route.ID);

                if (ri != null && ri.Order > startOrder && ri.Order < endOrder)
                {
                    visited.Add(stop);
                }
            }

            visited.Sort((a, b) =>
            {
                RouteInfo? ra = a.Routes.Find(r => r.RouteID == route.ID);
                RouteInfo? rb = b.Routes.Find(r => r.RouteID == route.ID);
                return (ra?.Order ?? 0).CompareTo(rb?.Order ?? 0);
            });

            return [.. visited];
        }

        /// <summary>
        /// Извлекает промежуточные станции метро между двумя индексами в списке станций маршрута.
        /// </summary>
        private static MetroStation[] ExtractVisitedMetroStations(MetroRoute route, int startIdx, int endIdx)
        {
            List<MetroStation> visited = new List<MetroStation>();

            for (int i = startIdx + 1; i < endIdx; i++)
            {
                visited.Add(route.Stations[i]);
            }

            return [.. visited];
        }

        /// <summary>
        /// Возвращает все метро-маршруты, проходящие через станцию (включая пересадочные линии).
        /// </summary>
        private List<MetroRoute> GetMetroRoutesForStation(MetroStation station)
        {
            List<MetroRoute> result = new List<MetroRoute>();
            HashSet<ulong> addedRouteIds = new HashSet<ulong>();

            // Маршруты, проходящие непосредственно через станцию
            if (station.Routes != null)
            {
                foreach (MetroRouteInfo mri in station.Routes)
                {
                    if (addedRouteIds.Add(mri.RouteID))
                    {
                        MetroRoute? route = FindMetroRouteById(mri.RouteID);
                        if (route != null)
                        {
                            result.Add(route);
                        }
                    }
                }
            }

            return result;
        }

        /// <summary>
        /// Ищет метро-маршрут по ID.
        /// </summary>
        private MetroRoute? FindMetroRouteById(ulong routeId)
        {
            if (!CTF.HasMetroSystem)
            {
                return null;
            }

            return CTF.MetroManager!.GetRouteById(routeId);
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

        private Section[] Merge(Section[] sections1, Section[] sections2)
        {
            Section[] ans = new Section[sections1.Length + sections2.Length];
            int i = 0;
            while (i < sections1.Length)
            {
                ans[i] = sections1[i];
                i++;
            }

            while (i < ans.Length)
            {
                ans[i] = sections2[i - sections1.Length];
                i++;
            }

            return ans;
        }

    }
}