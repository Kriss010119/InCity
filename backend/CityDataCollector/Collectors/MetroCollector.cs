using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using CityDataCollector.Infrastructure;

namespace CityDataCollector.Collectors
{
    public class MetroRouteData
    {
        public long Id { get; set; }
        public string RouteNumber { get; set; } = "";
        public string Name { get; set; } = "";
        public string Color { get; set; } = "";
        public string Line { get; set; } = "";
        public string Operator { get; set; } = "";
        public List<RouteStopData> Stops { get; set; } = new();
    }

    public class MetroStationData
    {
        public long Id { get; set; }
        public string Name { get; set; } = "";
        public string LocalName { get; set; } = "";
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsTransfer { get; set; }
        public List<string> Lines { get; set; } = new();
        public List<MetroRouteRef> Routes { get; set; } = new();
        public List<MetroTransferRef> Transfers { get; set; } = new();
    }

    public class MetroRouteRef
    {
        public string Color { get; set; } = "";
        public string RouteNumber { get; set; } = "";
        public int Order { get; set; }
    }

    public class MetroTransferRef
    {
        public string Key { get; set; } = "";
        public List<MetroRouteRef> Value { get; set; } = new();
    }

    public class MetroResult
    {
        public List<MetroRouteData> Routes { get; set; } = new();
        public List<MetroStationData> Stations { get; set; } = new();
    }

    /// <summary>
    /// Сборщик данных метро.
    /// Логика и OSM-запросы взяты из старого MetroDataCollector,
    /// адаптированы к новым моделям и инфраструктуре (OverpassClient с retry).
    /// </summary>
    public class MetroCollector
    {
        private readonly OverpassClient _client;
        private Dictionary<long, MetroStationData> _stationDictionary = new();

        public MetroCollector(OverpassClient client)
        {
            _client = client;
        }

        public async Task<MetroResult> CollectAsync(string cityName)
        {
            FileLogger.Instance.Log($"  Начало сбора метро для {cityName}");

            var result = new MetroResult();

            // ШАГ 1: Получаем все маршруты метро
            FileLogger.Instance.Log($"  Метро ШАГ 1: Получаем маршруты...");
            var routes = await GetAllMetroRoutesAsync(cityName);

            if (routes.Count == 0)
            {
                FileLogger.Instance.Log($"  Метро: линии не найдены в {cityName}");
                return result;
            }

            FileLogger.Instance.Log($"  Метро: получено {routes.Count} направлений");
            routes = EnsureBothDirections(routes, cityName);
            FileLogger.Instance.Log($"  Метро: после EnsureBothDirections — {routes.Count} направлений");

            // ШАГ 2: Получаем все станции метро
            FileLogger.Instance.Log($"  Метро ШАГ 2: Получаем станции...");
            var stations = await GetAllMetroStationsAsync(cityName);

            if (stations.Count == 0)
            {
                FileLogger.Instance.LogError($"  Метро: не удалось получить станции для {cityName}");
                return result;
            }

            FileLogger.Instance.Log($"  Метро: получено {stations.Count} станций");
            BuildStationDictionary(stations);

            // ШАГ 3: Обработка
            FileLogger.Instance.Log($"  Метро ШАГ 3: Обработка...");
            EnrichRoutesWithStationNames(routes);
            EnrichStationsWithRouteInfo(stations, routes);
            ProcessTransfers(stations);
            stations = stations.Where(s => s.Routes.Count > 0).ToList();

            result.Routes = routes;
            result.Stations = stations;

            FileLogger.Instance.Log($"  Метро: итого {routes.Count} маршрутов, {stations.Count} станций");
            return result;
        }

        private async Task<List<MetroRouteData>> GetAllMetroRoutesAsync(string cityName)
        {
            // Сначала получаем ID маршрутов (легкий запрос)
            string idsQuery = $@"
                [out:json][timeout:120];
                area[name=""{cityName}""]->.searchArea;
                relation[type=""route""][route=""subway""](area.searchArea);
                out ids;";

            var idsJson = await _client.ExecuteQueryAsync(idsQuery);
            if (idsJson == null) return new List<MetroRouteData>();

            var routeIds = ParseRouteIds(idsJson);

            if (routeIds.Count == 0)
            {
                FileLogger.Instance.Log($"  Метро: ID маршрутов не найдены, пробуем расширенный поиск...");
                return await GetRoutesDirectAsync(cityName);
            }

            FileLogger.Instance.Log($"  Метро: найдено {routeIds.Count} ID маршрутов, загружаем пачками...");
            return await GetRoutesDetailsBatchAsync(routeIds);
        }

        /// <summary>
        /// Расширенный поиск — включает subway, metro, light_rail, monorail.
        /// Используется как fallback если основной запрос ничего не нашёл.
        /// </summary>
        private async Task<List<MetroRouteData>> GetRoutesDirectAsync(string cityName)
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
                out skel qt;";

            var json = await _client.ExecuteQueryAsync(query);
            if (json == null) return new List<MetroRouteData>();

            return ParseRoutesWithNodes(json);
        }

        /// <summary>
        /// Загрузка маршрутов пачками по 5 (как в старом коде).
        /// Маленькие пачки надежнее для метро — маршруты тяжёлые.
        /// </summary>
        private async Task<List<MetroRouteData>> GetRoutesDetailsBatchAsync(List<long> routeIds)
        {
            var allRoutes = new List<MetroRouteData>();
            int batchSize = 5;
            int totalBatches = (int)Math.Ceiling(routeIds.Count / (double)batchSize);

            for (int i = 0; i < routeIds.Count; i += batchSize)
            {
                int batchNum = i / batchSize + 1;
                var batchIds = routeIds.Skip(i).Take(batchSize).ToList();

                FileLogger.Instance.Log($"    Пачка {batchNum}/{totalBatches} ({batchIds.Count} маршрутов)...");

                var idsString = string.Join(",", batchIds);
                string query = $@"
                    [out:json][timeout:90];
                    (
                      relation(id:{idsString});
                      node(r);
                    );
                    out body;
                    >;
                    out skel qt;";

                var json = await _client.ExecuteQueryAsync(query);
                if (json != null)
                {
                    var batchRoutes = ParseRoutesWithNodes(json);
                    allRoutes.AddRange(batchRoutes);
                }

                if (i + batchSize < routeIds.Count)
                {
                    await Task.Delay(1000);
                }
            }

            return allRoutes;
        }

        private async Task<List<MetroStationData>> GetAllMetroStationsAsync(string cityName)
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
                out skel qt;";

            var json = await _client.ExecuteQueryAsync(query);
            if (json == null) return new List<MetroStationData>();

            return ParseStations(json);
        }

        private void BuildStationDictionary(List<MetroStationData> stations)
        {
            _stationDictionary.Clear();
            foreach (var s in stations)
            {
                _stationDictionary[s.Id] = s;
            }
        }

        private void EnrichRoutesWithStationNames(List<MetroRouteData> routes)
        {
            foreach (var route in routes)
            {
                foreach (var stop in route.Stops)
                {
                    if (_stationDictionary.TryGetValue(stop.NodeId, out var station))
                    {
                        stop.Name = !string.IsNullOrEmpty(station.LocalName)
                            ? station.LocalName
                            : !string.IsNullOrEmpty(station.Name)
                                ? station.Name
                                : $"Станция {stop.NodeId}";
                    }
                }

                route.Stops = route.Stops.OrderBy(s => s.Sequence).ToList();
            }
        }

        private void EnrichStationsWithRouteInfo(List<MetroStationData> stations, List<MetroRouteData> routes)
        {
            // Маппинг по имени (как в старом коде — станция может дублироваться по ID, но имена совпадают)
            var stationsByName = new Dictionary<string, List<MetroStationData>>();
            foreach (var s in stations)
            {
                if (!stationsByName.ContainsKey(s.Name))
                    stationsByName[s.Name] = new();
                stationsByName[s.Name].Add(s);
            }

            foreach (var route in routes.Where(r => r.Stops.Count > 0))
            {
                foreach (var routeStop in route.Stops)
                {
                    if (stationsByName.TryGetValue(routeStop.Name, out var matchedStations))
                    {
                        foreach (var station in matchedStations)
                        {
                            station.Routes.Add(new MetroRouteRef
                            {
                                Color = route.Color,
                                RouteNumber = route.RouteNumber,
                                Order = routeStop.Sequence + 1
                            });

                            if (!station.Lines.Contains(route.Name))
                                station.Lines.Add(route.Name);
                        }
                    }
                }
            }
        }

        private void ProcessTransfers(List<MetroStationData> stations)
        {
            for (int i = 0; i < stations.Count; i++)
            {
                for (int j = i + 1; j < stations.Count; j++)
                {
                    if (stations[i].Name == stations[j].Name) continue;

                    double dist = OsmParser.DistanceMeters(
                        stations[i].Latitude, stations[i].Longitude,
                        stations[j].Latitude, stations[j].Longitude);

                    if (dist <= 400)
                    {
                        AddTransfer(stations[i], stations[j]);
                        AddTransfer(stations[j], stations[i]);
                    }
                }
            }
        }

        private void AddTransfer(MetroStationData from, MetroStationData to)
        {
            from.IsTransfer = true;

            var existing = from.Transfers.FirstOrDefault(t => t.Key == to.Name);
            if (existing == null)
            {
                existing = new MetroTransferRef { Key = to.Name };
                from.Transfers.Add(existing);
            }

            foreach (var routeRef in to.Routes)
            {
                existing.Value.Add(new MetroRouteRef
                {
                    Color = routeRef.Color,
                    RouteNumber = routeRef.RouteNumber,
                    Order = routeRef.Order
                });
            }
        }

        private List<MetroRouteData> EnsureBothDirections(List<MetroRouteData> routes, string cityName)
        {
            var result = new List<MetroRouteData>();
            var byRouteNumber = routes.GroupBy(r => r.RouteNumber);

            foreach (var group in byRouteNumber)
            {
                var lineRoutes = group.ToList();

                if (lineRoutes.Count == 0) continue;

                if (lineRoutes.Count == 1)
                {
                    result.Add(lineRoutes[0]);
                    result.Add(CreateReverseDirection(lineRoutes[0], cityName));
                }
                else if (lineRoutes.Count == 2)
                {
                    result.AddRange(lineRoutes);
                }
                else
                {
                    var unique = RemoveDuplicateDirections(lineRoutes);
                    result.AddRange(unique);
                }
            }

            return result;
        }

        private MetroRouteData CreateReverseDirection(MetroRouteData original, string cityName)
        {
            var reversedStops = original.Stops
                .OrderByDescending(s => s.Sequence)
                .Select((s, i) => new RouteStopData
                {
                    NodeId = s.NodeId,
                    Name = s.Name,
                    Latitude = s.Latitude,
                    Longitude = s.Longitude,
                    Role = s.Role,
                    Sequence = i
                })
                .ToList();

            string reverseName;
            try
            {
                // Кольцевые линии Москвы
                bool isMoscow = cityName.ToLower() == "москва";
                bool isRing = isMoscow &&
                    (original.RouteNumber == "5" || original.RouteNumber == "11" || original.RouteNumber == "14");

                if (isRing && original.Name.Contains("("))
                {
                    string prefix = original.Name[..original.Name.IndexOf("(")];
                    reverseName = original.Name.Contains("(внутрен")
                        ? prefix + "(внешнее кольцо)"
                        : prefix + "(внутреннее кольцо)";
                }
                else if (original.Name.Contains(":"))
                {
                    string prefix = original.Name[..(original.Name.IndexOf(":") + 1)];
                    string originalDirection = original.Name[(original.Name.IndexOf(":") + 2)..];

                    // Ищем разделитель между конечными станциями (→, -, –, —)
                    string separator = " → ";
                    if (!originalDirection.Contains(separator))
                    {
                        separator = " - ";
                        if (!originalDirection.Contains(separator))
                        {
                            separator = " – ";
                            if (!originalDirection.Contains(separator))
                            {
                                separator = " — ";
                            }
                        }
                    }

                    if (originalDirection.Contains(separator))
                    {
                        var parts = originalDirection.Split(separator, 2);
                        reverseName = prefix + " " + parts[1] + separator + parts[0];
                    }
                    else
                    {
                        reverseName = original.Name + " (обратное)";
                    }
                }
                else
                {
                    reverseName = original.Name + " (обратное)";
                }
            }
            catch
            {
                reverseName = original.Name + " (обратное)";
            }

            return new MetroRouteData
            {
                Id = original.Id * -1,
                RouteNumber = original.RouteNumber,
                Name = reverseName,
                Color = original.Color,
                Line = original.Line,
                Operator = original.Operator,
                Stops = reversedStops
            };
        }

        private List<MetroRouteData> RemoveDuplicateDirections(List<MetroRouteData> routes)
        {
            var unique = new Dictionary<string, MetroRouteData>();

            foreach (var r in routes)
            {
                if (r.Stops.Count == 0) continue;
                string key = $"{r.Stops.First().NodeId}_{r.Stops.Last().NodeId}";
                unique.TryAdd(key, r);
            }

            return unique.Values.ToList();
        }

        private List<long> ParseRouteIds(string json)
        {
            var ids = new List<long>();
            try
            {
                using var doc = JsonDocument.Parse(json);
                foreach (var el in doc.RootElement.GetProperty("elements").EnumerateArray())
                {
                    if (el.GetProperty("type").GetString() == "relation")
                        ids.Add(el.GetProperty("id").GetInt64());
                }
            }
            catch { }
            return ids;
        }

        /// <summary>
        /// Парсит ответ Overpass содержащий ноды и relation-ы.
        /// Точная копия логики из старого MetroDataCollector.ParseRoutesWithStations.
        /// </summary>
        private List<MetroRouteData> ParseRoutesWithNodes(string json)
        {
            var routes = new List<MetroRouteData>();
            var nodes = new Dictionary<long, (string name, double lat, double lon)>();

            try
            {
                using var doc = JsonDocument.Parse(json);
                var elements = doc.RootElement.GetProperty("elements");

                // Первый проход: собираем ноды с именами
                foreach (var el in elements.EnumerateArray())
                {
                    if (el.GetProperty("type").GetString() == "node")
                    {
                        long id = el.GetProperty("id").GetInt64();
                        string name = "";
                        if (el.TryGetProperty("tags", out var tags))
                            name = OsmParser.GetTag(tags, "name");

                        if (!string.IsNullOrEmpty(name))
                        {
                            nodes[id] = (name, el.GetProperty("lat").GetDouble(), el.GetProperty("lon").GetDouble());
                        }
                    }
                }

                // Второй проход: собираем маршруты
                foreach (var el in elements.EnumerateArray())
                {
                    if (el.GetProperty("type").GetString() != "relation") continue;

                    try
                    {
                        var route = ParseSingleRoute(el, nodes);
                        if (route != null && route.Stops.Count > 0)
                        {
                            routes.Add(route);
                        }
                    }
                    catch
                    {
                        continue;
                    }
                }
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError("  Ошибка парсинга маршрутов метро", ex);
            }

            return routes;
        }

        /// <summary>
        /// Парсит один relation маршрута метро. Логика из старого ParseMetroRoute.
        /// </summary>
        private MetroRouteData? ParseSingleRoute(JsonElement relation, Dictionary<long, (string name, double lat, double lon)> nodes)
        {
            if (!relation.TryGetProperty("tags", out var tags)) return null;

            string routeNumber = OsmParser.GetTag(tags, "ref");
            if (string.IsNullOrEmpty(routeNumber))
                routeNumber = OsmParser.GetTag(tags, "name");
            if (string.IsNullOrEmpty(routeNumber))
                routeNumber = $"Линия {relation.GetProperty("id").GetInt64()}";

            var route = new MetroRouteData
            {
                Id = relation.GetProperty("id").GetInt64(),
                RouteNumber = routeNumber,
                Name = OsmParser.GetTag(tags, "name"),
                Color = OsmParser.GetTag(tags, "colour"),
                Line = OsmParser.GetTag(tags, "network"),
                Operator = OsmParser.GetTag(tags, "operator")
            };

            if (string.IsNullOrEmpty(route.Color))
                route.Color = OsmParser.GetTag(tags, "color");
            if (string.IsNullOrEmpty(route.Name))
                route.Name = routeNumber;

            // Парсим members — ищем ноды с ролью stop/platform/пустая
            if (relation.TryGetProperty("members", out var members))
            {
                foreach (var member in members.EnumerateArray())
                {
                    string role = member.GetProperty("role").GetString() ?? "";
                    string type = member.GetProperty("type").GetString() ?? "";
                    long refId = member.GetProperty("ref").GetInt64();

                    if (type == "node" && (role.Contains("stop") || role == "platform" || role == ""))
                    {
                        if (nodes.TryGetValue(refId, out var node))
                        {
                            route.Stops.Add(new RouteStopData
                            {
                                NodeId = refId,
                                Name = node.name,
                                Latitude = node.lat,
                                Longitude = node.lon,
                                Role = role,
                                Sequence = route.Stops.Count
                            });
                        }
                    }
                }
            }

            return route;
        }

        private List<MetroStationData> ParseStations(string json)
        {
            var stations = new List<MetroStationData>();

            try
            {
                using var doc = JsonDocument.Parse(json);
                foreach (var el in doc.RootElement.GetProperty("elements").EnumerateArray())
                {
                    try
                    {
                        if (el.GetProperty("type").GetString() != "node") continue;
                        if (!el.TryGetProperty("tags", out var tags)) continue;

                        string name = OsmParser.GetTag(tags, "name");
                        if (string.IsNullOrEmpty(name))
                            name = $"Станция {el.GetProperty("id").GetInt64()}";

                        string localName = OsmParser.GetTag(tags, "name:ru");
                        if (string.IsNullOrEmpty(localName))
                            localName = name;

                        stations.Add(new MetroStationData
                        {
                            Id = el.GetProperty("id").GetInt64(),
                            Name = name,
                            LocalName = localName,
                            Latitude = el.GetProperty("lat").GetDouble(),
                            Longitude = el.GetProperty("lon").GetDouble()
                        });
                    }
                    catch
                    {
                        continue;
                    }
                }
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError("  Ошибка парсинга станций метро", ex);
            }

            return stations;
        }
    }
}