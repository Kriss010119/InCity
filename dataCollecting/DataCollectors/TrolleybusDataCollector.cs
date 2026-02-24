using EModelsLib.Interfaces;
using EModelsLib.Primitives;
using EModelsLib.Routes;
using EModelsLib.Stops;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace DataCollectors
{
    public class TrolleybusDataCollector : BaseDataCollector, IDataCollector
    {
        public TrolleybusDataCollector(string cityName) : base(cityName) { }

        public async Task CollectDataForCityAsync()
        {
            Console.WriteLine($"Начинаем сбор данных о троллейбусах для города: {_cityName}\n");
            var cityNameEn = ConvertToEnglishTranslit(_cityName);
            Console.WriteLine($"Английское название файлов: {cityNameEn}\n");
            CreateDataDirectoryStructure(cityNameEn);

            Console.WriteLine("ШАГ 1: Получаем все троллейбусные маршруты...");
            var routes = await GetAllTrolleybusRoutesAsync(_cityName);

            if (routes.Count == 0)
            {
                Console.WriteLine($"В городе {_cityName} не найдено троллейбусных маршрутов. Завершаем работу.");
                return;
            }
            Console.WriteLine("ШАГ 2: Получаем все троллейбусные остановки...");
            var stops = await GetAllTrolleybusStopsAsync(_cityName);

            if (stops.Count == 0)
            {
                Console.WriteLine("Не удалось получить остановки. Завершаем работу.");
                return;
            }
            var stopDictionary = stops.ToDictionary(s => s.Id, s => s);
            Console.WriteLine($"Получено {stops.Count} уникальных остановок\n");

            Console.WriteLine("ШАГ 3: Обработка полученной информации...");
            EnrichRoutesWithStopNames(ref routes, stopDictionary);
            CleanRoutesFromInvalidStops(ref routes, stopDictionary.Keys.ToHashSet());
            EnrichStopsWithRouteInfo(ref stops, routes);
            RemoveStopsWithoutRoutes(ref stops);

            if (stops.Count > 0 && routes.Count > 0)
            {
                var stopsFilename = Path.Combine(_cityFolderPath, $"trolleybus_stops_{cityNameEn}.json");
                await _fileManager.SaveToJsonFile(stops, stopsFilename);
                Console.WriteLine($"Остановки сохранены в {stopsFilename} ({stops.Count} остановок)\n");

                var finalRoutesFilename = Path.Combine(_cityFolderPath, $"trolleybus_routes_final_{cityNameEn}.json");
                await _fileManager.SaveToJsonFile(routes, finalRoutesFilename);
                Console.WriteLine($"Маршруты сохранены в {finalRoutesFilename} ({routes.Count} маршрутов)\n");

                RenameAndCleanupFiles(cityNameEn, finalRoutesFilename);
            }
        }

        private async Task<List<TrolleybusRoute>> GetAllTrolleybusRoutesAsync(string cityName)
        {
            var routeIds = await GetTrolleybusRouteIdsAsync(cityName);

            if (routeIds.Count == 0)
            {
                Console.WriteLine("Не найдено ID маршрутов. Пробуем прямой запрос...");
                return await GetRoutesDirectAsync(cityName);
            }

            Console.WriteLine($"Найдено {routeIds.Count} ID маршрутов. Загружаем детали...");

            var allRoutes = new List<TrolleybusRoute>();
            var batchSize = 10;
            var totalBatches = (int)Math.Ceiling(routeIds.Count / (double)batchSize);

            for (int i = 0; i < routeIds.Count; i += batchSize)
            {
                var batchNumber = i / batchSize + 1;
                var batchIds = routeIds.Skip(i).Take(batchSize).ToList();

                Console.Write($"\rЗагрузка пачки {batchNumber}/{totalBatches} ({batchIds.Count} маршрутов)...");

                try
                {
                    var batchRoutes = await GetRoutesDetailsBatchAsync(batchIds);
                    allRoutes.AddRange(batchRoutes);

                    if (i + batchSize < routeIds.Count)
                    {
                        await Task.Delay(2000);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"\nОшибка в пачке {batchNumber}: {ex.Message}");
                }
            }

            Console.WriteLine($"\rЗагружено {allRoutes.Count} маршрутов".PadRight(80));
            return allRoutes;
        }

        private async Task<List<TrolleybusStop>> GetAllTrolleybusStopsAsync(string cityName)
        {
            string query = $@"
                [out:json][timeout:90];
                area[name=""{cityName}""]->.searchArea;
                (
                  node[""highway""=""bus_stop""][""trolleybus""=""yes""](area.searchArea);
                  node[""public_transport""=""platform""][""trolleybus""=""yes""](area.searchArea);
                  node[""trolleybus""=""yes""](area.searchArea);
                );
                out body;
                >;
                out skel qt;
            ";

            try
            {
                var json = await ExecuteOverpassQuery(query);
                return ParseTrolleybusStops(json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка при получении остановок: {ex.Message}");
                return new List<TrolleybusStop>();
            }
        }

        private async Task<List<long>> GetTrolleybusRouteIdsAsync(string cityName)
        {
            string query = $@"
                [out:json][timeout:90];
                area[name=""{cityName}""]->.searchArea;
                relation[type=""route""][route=""trolleybus""](area.searchArea);
                out ids;
            ";

            try
            {
                var json = await ExecuteOverpassQuery(query);
                return ParseRouteIds(json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка при получении ID маршрутов: {ex.Message}");
                return new List<long>();
            }
        }

        private async Task<List<TrolleybusRoute>> GetRoutesDirectAsync(string cityName)
        {
            string query = $@"
                [out:json][timeout:120];
                area[name=""{cityName}""]->.searchArea;
                (
                  relation[type=""route""][route=""trolleybus""](area.searchArea);
                  node(r);
                );
                out body;
                >;
                out skel qt;
                limit 500;
            ";

            try
            {
                var json = await ExecuteOverpassQuery(query);
                return ParseRoutesWithStops(json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Прямой запрос не удался: {ex.Message}");
                return new List<TrolleybusRoute>();
            }
        }

        private async Task<List<TrolleybusRoute>> GetRoutesDetailsBatchAsync(List<long> routeIds)
        {
            if (routeIds.Count == 0)
                return new List<TrolleybusRoute>();

            var idsString = string.Join(",", routeIds);
            string query = $@"
                [out:json][timeout:60];
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
                return ParseRoutesWithStops(json);
            }
            catch (Exception)
            {
                return new List<TrolleybusRoute>();
            }
        }

        private void EnrichRoutesWithStopNames(ref List<TrolleybusRoute> routes, Dictionary<long, TrolleybusStop> stopDictionary)
        {
            foreach (var route in routes)
            {
                foreach (var routeStop in route.Stops)
                {
                    if (stopDictionary.TryGetValue(routeStop.NodeId, out var stopInfo))
                    {
                        var stopName = !string.IsNullOrEmpty(stopInfo.LocalName)
                            ? stopInfo.LocalName
                            : !string.IsNullOrEmpty(stopInfo.Name)
                                ? stopInfo.Name
                                : $"Остановка {routeStop.NodeId}";

                        routeStop.Name = stopName;
                    }
                }

                route.Stops = route.Stops.OrderBy(s => s.Sequence).ToList();
            }
        }

        private void CleanRoutesFromInvalidStops(ref List<TrolleybusRoute> routes, HashSet<long> validStopIds)
        {
            foreach (var route in routes)
            {
                var validStops = new List<RouteStop>();
                foreach (var stop in route.Stops)
                {
                    if (validStopIds.Contains(stop.NodeId))
                    {
                        validStops.Add(stop);
                    }
                }

                route.Stops = validStops.OrderBy(s => s.Sequence).ToList();

                for (int i = 0; i < route.Stops.Count; i++)
                {
                    route.Stops[i].Sequence = i;
                }
            }

            routes = routes.Where(el => el.Stops.Count > 0).ToList();
        }

        private void EnrichStopsWithRouteInfo(ref List<TrolleybusStop> stops, List<TrolleybusRoute> routes)
        {
            var stopRoutesDict = new Dictionary<long, List<RouteInfo>>();
            foreach (var stop in stops)
            {
                stopRoutesDict[stop.Id] = new List<RouteInfo>();
            }
            int processedRoutes = 0;
            int totalRouteStopLinks = 0;

            foreach (var route in routes.Where(r => r.Stops.Count > 0))
            {
                foreach (var routeStop in route.Stops)
                {
                    if (stopRoutesDict.TryGetValue(routeStop.NodeId, out var routeInfos))
                    {
                        routeInfos.Add(new RouteInfo(route.RouteNumber, routeStop.Sequence + 1));
                        totalRouteStopLinks++;
                    }
                }

                processedRoutes++;
                if (processedRoutes % 50 == 0)
                {
                    Console.Write($"\rОбработано {processedRoutes}/{routes.Count} маршрутов...");
                }
            }

            Console.WriteLine($"\rОбработано {processedRoutes} маршрутов, связей остановок с маршрутами: {totalRouteStopLinks}".PadRight(80));

            foreach (var stop in stops)
            {
                if (stopRoutesDict.TryGetValue(stop.Id, out var routeInfos) && routeInfos.Count > 0)
                {
                    stop.Routes = routeInfos
                        .OrderBy(r => TryParseRouteNumber(r.RouteNumber))
                        .ThenBy(r => r.RouteNumber)
                        .ThenBy(r => r.Order)
                        .ToList();
                }
            }
        }

        private void RemoveStopsWithoutRoutes(ref List<TrolleybusStop> stops)
        {
            stops = stops.Where(s => s.Routes.Count > 0).ToList();
        }

        private void RenameAndCleanupFiles(string cityNameEn, string finalRoutesFilename)
        {
            try
            {
                var sourceFile = finalRoutesFilename;
                var targetFile = Path.Combine(_cityFolderPath, $"trolleybus_routes_{cityNameEn}.json");

                _fileManager.RenameFile(sourceFile, targetFile);

                var filesToDelete = new[]
                {
                    Path.Combine(_cityFolderPath, $"trolleybus_routes_final_{cityNameEn}.json"),
                    Path.Combine(_cityFolderPath, $"trolleybus_routes_cleaned_{cityNameEn}.json")
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

        private List<TrolleybusRoute> ParseRoutesWithStops(string json)
        {
            var routes = new List<TrolleybusRoute>();
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
                        nodes[node.Id] = node;
                    }
                }

                foreach (var element in elements.EnumerateArray())
                {
                    if (element.GetProperty("type").GetString() == "relation")
                    {
                        var route = ParseTrolleybusRoute(element, nodes);
                        if (route != null && !string.IsNullOrEmpty(route.RouteNumber))
                        {
                            routes.Add(route);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка парсинга маршрутов: {ex.Message}");
            }

            return routes;
        }

        private TrolleybusRoute? ParseTrolleybusRoute(JsonElement relation, Dictionary<long, OsmNode> nodes)
        {
            try
            {
                var tags = relation.GetProperty("tags");
                var routeNumber = GetTagValue(tags, "ref");

                if (string.IsNullOrEmpty(routeNumber))
                    return null;

                var route = new TrolleybusRoute(
                    relation.GetProperty("id").GetInt64(),
                    routeNumber,
                    GetTagValue(tags, "name"),
                    new List<RouteStop>(),
                    GetTagValue(tags, "from"),
                    GetTagValue(tags, "to"),
                    GetTagValue(tags, "operator"),
                    GetTagValue(tags, "network"));

                if (relation.TryGetProperty("members", out var members))
                {
                    foreach (var member in members.EnumerateArray())
                    {
                        var role = member.GetProperty("role").GetString() ?? "";
                        var type = member.GetProperty("type").GetString();
                        var refId = member.GetProperty("ref").GetInt64();

                        if (type == "node" && (role.Contains("stop") || role == "platform"))
                        {
                            if (nodes.TryGetValue(refId, out var node))
                            {
                                route.Stops.Add(new RouteStop(
                                    refId,
                                    node.Name,
                                    node.Latitude,
                                    node.Longitude,
                                    role,
                                    route.Stops.Count));
                            }
                        }
                    }
                }

                return route;
            }
            catch (Exception)
            {
                return null;
            }
        }

        private List<TrolleybusStop> ParseTrolleybusStops(string json)
        {
            var stops = new List<TrolleybusStop>();

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
                                var stop = new TrolleybusStop(
                                    element.GetProperty("id").GetInt64(),
                                    GetTagValue(tags, "name"),
                                    element.GetProperty("lat").GetDouble(),
                                    element.GetProperty("lon").GetDouble(),
                                    GetTagValue(tags, "name:ru") ?? GetTagValue(tags, "name"),
                                    new List<RouteInfo>());

                                stops.Add(stop);
                            }
                        }
                    }
                    catch (Exception)
                    {
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка парсинга остановок: {ex.Message}");
            }

            return stops;
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
            catch (Exception)
            {
            }

            return ids;
        }

        private int TryParseRouteNumber(string routeNumber)
        {
            if (string.IsNullOrEmpty(routeNumber))
                return int.MaxValue;

            var numericPart = new string(routeNumber.TakeWhile(char.IsDigit).ToArray());
            if (int.TryParse(numericPart, out int result))
                return result;

            return int.MaxValue;
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
    }
}