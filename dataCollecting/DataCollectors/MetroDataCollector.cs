using EModelsLib.Interfaces;
using EModelsLib.Primitives;
using EModelsLib.Routes;
using EModelsLib.Stops;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using static System.Collections.Specialized.BitVector32;

namespace DataCollectors
{
    public class MetroDataCollector : BaseDataCollector, IDataCollector
    {
        private Dictionary<long, MetroStation> _stationDictionary;
        private List<MetroRoute> _allRoutes;

        public MetroDataCollector(string cityName) : base(cityName)
        {
            _stationDictionary = new Dictionary<long, MetroStation>();
            _allRoutes = new List<MetroRoute>();
        }

        public async Task CollectDataForCityAsync()
        {
            Console.WriteLine($"Начинаем сбор данных о метро для города: {_cityName}\n");
            var cityNameEn = ConvertToEnglishTranslit(_cityName);
            Console.WriteLine($"Английское название файлов: {cityNameEn}\n");
            CreateDataDirectoryStructure(cityNameEn);

            Console.WriteLine("ШАГ 1: Получаем все маршруты метро...");
            var routes = await GetAllMetroRoutesAsync(_cityName);

            if (routes.Count == 0)
            {
                Console.WriteLine($"В городе {_cityName} не найдено метро. Завершаем работу.");
                return;
            }

            _allRoutes = routes;
            Console.WriteLine($"Получено {routes.Count} маршрутов метро\n");
            routes = EnsureBothDirections(routes);
            _allRoutes = routes;

            Console.WriteLine("ШАГ 2: Получаем все станции метро...");
            var stations = await GetAllMetroStationsAsync(_cityName);

            if (stations.Count == 0)
            {
                Console.WriteLine($"Не удалось получить станции.");
                throw new Exception();
            }
            CreateExtendedStationDictionary(stations);

            Console.WriteLine("ШАГ 3: Обработка полученной информации...");

            var enrichedRoutes = EnrichRoutesWithStationNames(routes);
            var routesWithStations = EnrichRoutesWithStationData(enrichedRoutes);
            EnrichStationsWithRouteInfo(ref stations, routesWithStations);
            ProcessTransfers(ref stations);
            var filteredStations = FilterStations(stations);

            if (filteredStations.Count > 0 && routesWithStations.Count > 0)
            {
                var stopsFilename = Path.Combine(_cityFolderPath, $"metro_stations_{cityNameEn}.json");
                await _fileManager.SaveToJsonFile(filteredStations, stopsFilename);
                Console.WriteLine($"Станции сохранены в {stopsFilename} ({filteredStations.Count} станций)\n");

                var finalRoutes = routesWithStations.Where(r => r.Stops.Count > 0).ToList();
                var finalRoutesFilename = Path.Combine(_cityFolderPath, $"metro_routes_final_{cityNameEn}.json");
                await _fileManager.SaveToJsonFile(finalRoutes, finalRoutesFilename);
                Console.WriteLine($"Маршруты сохранены в {finalRoutesFilename} ({finalRoutes.Count} маршрутов)\n");
                RenameAndCleanupFiles(cityNameEn, finalRoutesFilename);
            }
        }

        private async Task<List<MetroRoute>> GetAllMetroRoutesAsync(string cityName)
        {
            string query = $@"
                [out:json][timeout:120];
                area[name=""{cityName}""]->.searchArea;
                relation[type=""route""][route=""subway""](area.searchArea);
                out ids;
            ";

            try
            {
                var json = await ExecuteOverpassQuery(query);
                var routeIds = ParseRouteIds(json);

                if (routeIds.Count == 0)
                {
                    Console.WriteLine("Не найдено ID маршрутов. Пробуем расширенный поиск...");
                    return await GetRoutesDirectAsync(cityName);
                }

                Console.WriteLine($"Найдено {routeIds.Count} ID маршрутов. Загружаем детали...");
                return await GetRoutesDetailsBatchAsync(routeIds);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка при получении маршрутов метро: {ex.Message}");
                return new List<MetroRoute>();
            }
        }

        private async Task<List<MetroRoute>> GetRoutesDirectAsync(string cityName)
        {
            string query = $@"
                [out:json][timeout:150];
                area[name=""{cityName}""]->.searchArea;
                (
                  relation[type=""route""][route~""subway|metro|light_rail|monorail""](area.searchArea);
                  node(r);
                );
                out body;
                >;
                out skel qt;
            ";

            try
            {
                var json = await ExecuteOverpassQuery(query);
                return ParseRoutesWithStations(json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Прямой запрос не удался: {ex.Message}");
                return new List<MetroRoute>();
            }
        }

        private async Task<List<MetroRoute>> GetRoutesDetailsBatchAsync(List<long> routeIds)
        {
            var allRoutes = new List<MetroRoute>();
            var batchSize = 5;
            var totalBatches = (int)Math.Ceiling(routeIds.Count / (double)batchSize);

            for (int i = 0; i < routeIds.Count; i += batchSize)
            {
                var batchNumber = i / batchSize + 1;
                var batchIds = routeIds.Skip(i).Take(batchSize).ToList();

                Console.Write($"\rЗагрузка пачки {batchNumber}/{totalBatches} ({batchIds.Count} маршрутов)...");

                try
                {
                    var batchRoutes = await GetRoutesBatchDetails(batchIds);
                    allRoutes.AddRange(batchRoutes);

                    if (i + batchSize < routeIds.Count)
                    {
                        await Task.Delay(1000);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"\nОшибка в пачке {batchNumber}: {ex.Message}");
                }
            }

            Console.WriteLine($"\rЗагружено {allRoutes.Count} маршрутов метро".PadRight(80));
            return allRoutes;
        }

        private async Task<List<MetroRoute>> GetRoutesBatchDetails(List<long> routeIds)
        {
            if (routeIds.Count == 0)
                return new List<MetroRoute>();

            var idsString = string.Join(",", routeIds);
            string query = $@"
                [out:json][timeout:90];
                (
                  relation(id:{idsString});
                  node(r);
                );
                out body;
                >;
                out skel qt;
            ";

            try
            {
                var json = await ExecuteOverpassQuery(query);
                return ParseRoutesWithStations(json);
            }
            catch (Exception)
            {
                return new List<MetroRoute>();
            }
        }

        private List<MetroRoute> EnsureBothDirections(List<MetroRoute> routes)
        {
            var resultRoutes = new List<MetroRoute>();
            var linesGrouped = routes.GroupBy(r => r.RouteNumber);

            foreach (var lineGroup in linesGrouped)
            {
                var lineRoutes = lineGroup.ToList();

                if (lineRoutes.Count == 0) continue;

                if (lineRoutes.Count == 1)
                {
                    var originalRoute = lineRoutes[0];
                    var reverseRoute = CreateReverseDirection(originalRoute);
                    resultRoutes.Add(originalRoute);
                    resultRoutes.Add(reverseRoute);
                }
                else if (lineRoutes.Count == 2)
                {
                    resultRoutes.AddRange(lineRoutes);
                }
                else
                {
                    var uniqueRoutes = RemoveDuplicateDirections(lineRoutes);
                    resultRoutes.AddRange(uniqueRoutes);
                }
            }

            return resultRoutes;
        }

        private MetroRoute CreateReverseDirection(MetroRoute originalRoute)
        {
            var reversedStops = originalRoute.Stops
                .OrderByDescending(s => s.Sequence)
                .Select((stop, index) => new RouteStop(
                    stop.NodeId,
                    stop.Name,
                    stop.Latitude,
                    stop.Longitude,
                    stop.Role,
                    index))
                .ToList();

            string reverseName;
            if ((_cityName.ToLower() == "moskva" || _cityName.ToLower() == "москва")
                && (originalRoute.RouteNumber == "5" || originalRoute.RouteNumber == "11" || originalRoute.RouteNumber == "14")) {
                reverseName = originalRoute.Name[.. originalRoute.Name.IndexOf("(")];

                if (originalRoute.Name.Contains("(внутрен"))
                {
                    reverseName += "(внешнее кольцо)";
                }
                else
                {
                    reverseName += "(внутреннее кольцо)";
                }

            }
            else
            {
                reverseName = originalRoute.Name[0 .. (originalRoute.Name.IndexOf(":") + 1)];
                string originalDirection = originalRoute.Name[(originalRoute.Name.IndexOf(":") + 2)..];
                int idxOfSeparator = originalRoute.Name.IndexOf(originalDirection.First(el => !char.IsLetterOrDigit(el)));

                string reverseDirection = (originalDirection[(idxOfSeparator + 2) .. ]) + (originalDirection[0 .. idxOfSeparator]);

                reverseName += reverseDirection;
            }

            var reverseRoute = new MetroRoute(
                originalRoute.Id * -1,
                originalRoute.RouteNumber,
                reverseName,
                reversedStops,
                originalRoute.Color,
                originalRoute.Line,
                originalRoute.Operator
            );

            return reverseRoute;
        }

        private List<MetroRoute> RemoveDuplicateDirections(List<MetroRoute> routes)
        {
            var uniqueDirections = new Dictionary<string, MetroRoute>();

            foreach (var route in routes)
            {
                if (route.Stops.Count == 0) continue;

                var firstStop = route.Stops.First().NodeId;
                var lastStop = route.Stops.Last().NodeId;
                var directionKey = $"{firstStop}_{lastStop}";

                if (!uniqueDirections.ContainsKey(directionKey))
                {
                    uniqueDirections[directionKey] = route;
                }
            }

            return uniqueDirections.Values.ToList();
        }

        /// <summary>
        /// Получаем все станции метро города
        /// </summary>
        private async Task<List<MetroStation>> GetAllMetroStationsAsync(string cityName)
        {
            string query = $@"
                [out:json][timeout:120];
                area[name=""{cityName}""]->.searchArea;
                (
                  node[""railway""=""station""][""station""=""subway""](area.searchArea);
                  node[""public_transport""=""station""][""subway""=""yes""](area.searchArea);
                );
                out body;
                >;
                out skel qt;
            ";

            try
            {
                var json = await ExecuteOverpassQuery(query);
                return ParseMetroStations(json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка при получении станций метро: {ex.Message}");
                return new List<MetroStation>();
            }
        }

        private void CreateExtendedStationDictionary(List<MetroStation> stations)
        {
            _stationDictionary.Clear();

            foreach (var station in stations)
            {
                _stationDictionary[station.Id] = station;
            }
        }

        private List<MetroRoute> EnrichRoutesWithStationNames(List<MetroRoute> routes)
        {
            var enrichedRoutes = new List<MetroRoute>();

            foreach (var route in routes)
            {
                var enrichedRoute = new MetroRoute(
                    route.Id,
                    route.RouteNumber,
                    route.Name,
                    new List<RouteStop>(),
                    route.Color,
                    route.Line,
                    route.Operator);

                foreach (var routeStop in route.Stops)
                {
                    if (_stationDictionary.TryGetValue(routeStop.NodeId, out var stationInfo))
                    {
                        var stopName = !string.IsNullOrEmpty(stationInfo.LocalName)
                            ? stationInfo.LocalName
                            : !string.IsNullOrEmpty(stationInfo.Name)
                                ? stationInfo.Name
                                : $"Станция {routeStop.NodeId}";

                        enrichedRoute.Stops.Add(new RouteStop(
                            routeStop.NodeId,
                            stopName,
                            routeStop.Latitude,
                            routeStop.Longitude,
                            routeStop.Role,
                            routeStop.Sequence));
                    }
                    else
                    {
                        enrichedRoute.Stops.Add(routeStop);
                    }
                }
                enrichedRoute.Stops = enrichedRoute.Stops.OrderBy(s => s.Sequence).ToList();
                enrichedRoutes.Add(enrichedRoute);
            }

            return enrichedRoutes;
        }

        private List<MetroRoute> EnrichRoutesWithStationData(List<MetroRoute> routes)
        {
            var enrichedRoutes = new List<MetroRoute>();

            foreach (var route in routes)
            {
                var enrichedRoute = new MetroRoute(
                    route.Id,
                    route.RouteNumber,
                    route.Name,
                    new List<RouteStop>(),
                    route.Color,
                    route.Line,
                    route.Operator);

                foreach (var routeStop in route.Stops)
                {
                    bool hasStation = _stationDictionary.ContainsKey(routeStop.NodeId);

                    if (hasStation)
                    {
                        enrichedRoute.Stops.Add(routeStop);
                    }
                    else
                    {
                        enrichedRoute.Stops.Add(routeStop);
                    }
                }

                enrichedRoute.Stops = enrichedRoute.Stops.OrderBy(s => s.Sequence).ToList();
                enrichedRoutes.Add(enrichedRoute);
            }
            return enrichedRoutes;
        }

        private void EnrichStationsWithRouteInfo(ref List<MetroStation> stations, List<MetroRoute> routes)
        {
            var stationRoutesDict = new Dictionary<string, (List<MetroRouteInfo>, List<string>)>();

            foreach (var station in stations)
            {
                stationRoutesDict[station.Name]
                    = (new List<MetroRouteInfo>(), new List<string>());
            }

            int processedRoutes = 0;
            int totalRouteStationLinks = 0;

            foreach (var route in routes.Where(r => r.Stops.Count > 0))
            {
                foreach (var routeStop in route.Stops)
                {
                    if (stationRoutesDict.TryGetValue(routeStop.Name, out var routeInfos))
                    {
                        routeInfos.Item1.Add(new MetroRouteInfo(route.Color, route.RouteNumber, routeStop.Sequence + 1));
                        routeInfos.Item2.Add(route.Name);
                        totalRouteStationLinks++;
                    }
                }

                processedRoutes++;
                if (processedRoutes % 10 == 0)
                {
                    Console.Write($"\rОбработано {processedRoutes}/{routes.Count} маршрутов...");
                }
            }

            Console.WriteLine($"\rОбработано {processedRoutes} маршрутов, связей станций с маршрутами: {totalRouteStationLinks}".PadRight(80));

            foreach (var station in stations)
            {
                station.Routes = stationRoutesDict[station.Name].Item1;
                station.Lines = stationRoutesDict[station.Name].Item2;
            }
        }

        private void ProcessTransfers(ref List<MetroStation> stations)
        {
            for (int i = 0; i < stations.Count; i++)
            {
                for (int j = i + 1; j < stations.Count; j++)
                {
                    if (stations[i].Name == stations[j].Name)
                    {
                        continue;
                    }

                    if (In400MetresRadius(stations[i], stations[j]))
                    {
                        stations[i].AddTransfer(stations[j]);
                        stations[j].AddTransfer(stations[i]);
                    }
                }
            }
        }

        private List<MetroStation> FilterStations(List<MetroStation> stations)
        {
            return stations.Where(s => s.Routes.Count > 0).ToList();
        }

        /// <summary>
        /// Переименовывает и удаляет временные файлы
        /// </summary>
        private void RenameAndCleanupFiles(string cityNameEn, string finalRoutesFilename)
        {
            try
            {
                var sourceFile = finalRoutesFilename;
                var targetFile = Path.Combine(_cityFolderPath, $"metro_routes_{cityNameEn}.json");

                _fileManager.RenameFile(sourceFile, targetFile);

                var filesToDelete = new[]
                {
                    Path.Combine(_cityFolderPath, $"metro_routes_final_{cityNameEn}.json")
                };

                foreach (var file in filesToDelete)
                {
                    if (File.Exists(file))
                    {
                        _fileManager.DeleteFile(file);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка при переименовании файлов: {ex.Message}");
            }
        }

        private List<long> ParseRouteIds(string json)
        {
            var ids = new List<long>();

            try
            {
                using JsonDocument doc = JsonDocument.Parse(json);
                var elements = doc.RootElement.GetProperty("elements");

                foreach (var element in elements.EnumerateArray())
                {
                    if (element.GetProperty("type").GetString() == "relation")
                    {
                        ids.Add(element.GetProperty("id").GetInt64());
                    }
                }
            }
            catch (Exception) { }

            return ids;
        }

        private List<MetroRoute> ParseRoutesWithStations(string json)
        {
            var routes = new List<MetroRoute>();
            var nodes = new Dictionary<long, OsmNode>();

            try
            {
                using JsonDocument doc = JsonDocument.Parse(json);
                var elements = doc.RootElement.GetProperty("elements");

                foreach (var element in elements.EnumerateArray())
                {
                    if (element.GetProperty("type").GetString() == "node")
                    {
                        var node = ParseNode(element);
                        if (!string.IsNullOrEmpty(node.Name))
                        {
                            nodes[node.Id] = node;
                        }
                    }
                }

                foreach (var element in elements.EnumerateArray())
                {
                    if (element.GetProperty("type").GetString() == "relation")
                    {
                        try
                        {
                            var route = ParseMetroRoute(element, nodes);
                            if (route != null && route.Stops.Count > 0)
                            {
                                routes.Add(route);
                            }
                        }
                        catch (Exception)
                        {
                            continue;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка парсинга маршрутов метро: {ex.Message}");
            }

            return routes;
        }

        private MetroRoute ParseMetroRoute(JsonElement relation, Dictionary<long, OsmNode> nodes)
        {
            try
            {
                var tags = relation.GetProperty("tags");
                var routeNumber = GetTagValue(tags, "ref");

                if (string.IsNullOrEmpty(routeNumber))
                    routeNumber = GetTagValue(tags, "name") ?? $"Линия {relation.GetProperty("id").GetInt64()}";

                var route = new MetroRoute(
                    relation.GetProperty("id").GetInt64(),
                    routeNumber,
                    GetTagValue(tags, "name") ?? routeNumber,
                    new List<RouteStop>(),
                    GetTagValue(tags, "colour") ?? GetTagValue(tags, "color") ?? "",
                    GetTagValue(tags, "network") ?? "",
                    GetTagValue(tags, "operator") ?? "");

                if (relation.TryGetProperty("members", out var members))
                {
                    var stopSequence = new List<RouteStop>();

                    foreach (var member in members.EnumerateArray())
                    {
                        var role = member.GetProperty("role").GetString() ?? "";
                        var type = member.GetProperty("type").GetString();
                        var refId = member.GetProperty("ref").GetInt64();

                        if (type == "node" && (role.Contains("stop") || role == "platform" || role == ""))
                        {
                            if (nodes.TryGetValue(refId, out var node))
                            {
                                stopSequence.Add(new RouteStop(
                                    refId,
                                    node.Name,
                                    node.Latitude,
                                    node.Longitude,
                                    role,
                                    stopSequence.Count));
                            }
                        }
                    }

                    route.Stops = stopSequence.OrderBy(s => s.Sequence).ToList();
                }

                return route;
            }
            catch (Exception)
            {
                return null;
            }
        }

        private List<MetroStation> ParseMetroStations(string json)
        {
            var stations = new List<MetroStation>();

            try
            {
                using JsonDocument doc = JsonDocument.Parse(json);
                var elements = doc.RootElement.GetProperty("elements");

                foreach (var element in elements.EnumerateArray())
                {
                    try
                    {
                        if (element.GetProperty("type").GetString() == "node")
                        {
                            if (element.TryGetProperty("tags", out var tags))
                            {
                                var station = new MetroStation(
                                    element.GetProperty("id").GetInt64(),
                                    GetTagValue(tags, "name") ?? $"Станция {element.GetProperty("id").GetInt64()}",
                                    element.GetProperty("lat").GetDouble(),
                                    element.GetProperty("lon").GetDouble(),
                                    [],
                                    GetTagValue(tags, "name:ru") ?? GetTagValue(tags, "name") ?? $"Станция {element.GetProperty("id").GetInt64()}",
                                    new List<MetroRouteInfo>());

                                stations.Add(station);
                            }
                        }
                    }
                    catch (Exception)
                    {
                        continue;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка парсинга станций метро: {ex.Message}");
            }

            return stations;
        }

        private static OsmNode ParseNode(JsonElement element)
        {
            return new OsmNode(
                element.GetProperty("id").GetInt64(),
                element.GetProperty("lat").GetDouble(),
                element.GetProperty("lon").GetDouble(),
                element.TryGetProperty("tags", out var tags) ? GetTagValue(tags, "name") : "");
        }

        private static string GetTagValue(JsonElement tags, string tagName)
        {
            try
            {
                if (tags.TryGetProperty(tagName, out var tag))
                    return tag.GetString() ?? "";
            }
            catch
            {
                return "";
            }
            return "";
        }

        private static bool In400MetresRadius(MetroStation curr, MetroStation targ)
        {
            double lat1Rad = DegreesToRadians(curr.Latitude);
            double lon1Rad = DegreesToRadians(curr.Longitude);
            double lat2Rad = DegreesToRadians(targ.Latitude);
            double lon2Rad = DegreesToRadians(targ.Longitude);

            double deltaLat = lat2Rad - lat1Rad;
            double deltaLon = lon2Rad - lon1Rad;

            double a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
                       Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                       Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);

            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            double distance = 6371000 * c;

            return distance <= 400;
        }

        private static double DegreesToRadians(double degrees)
        {
            return degrees * Math.PI / 180.0;
        }
    }
}