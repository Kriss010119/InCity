using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using CityDataCollector.Infrastructure;

namespace CityDataCollector.Collectors
{
    // ===== Выходные модели для JSON =====

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
    /// Сборщик данных метро. Использует один запрос для получения
    /// всех линий и станций, что решает проблему неполных данных.
    /// </summary>
    public class MetroCollector
    {
        private readonly OverpassClient _client;

        public MetroCollector(OverpassClient client)
        {
            _client = client;
        }

        public async Task<MetroResult> CollectAsync(string cityName)
        {
            FileLogger.Instance.Log($"  Начало сбора метро для {cityName}");

            var result = new MetroResult();

            // Единый запрос — получаем все линии с геометрией и все станции
            string query = $@"
                [out:json][timeout:180];
                area[name=""{cityName}""]->.ar;
                nwr[""route""=""subway""](area.ar)->.lines;
                .lines out body;
                nwr(r.lines)->.allnodes;
                .allnodes out body;";

            var json = await _client.ExecuteQueryAsync(query);
            if (json == null)
            {
                FileLogger.Instance.Log($"  Метро: не удалось получить данные для {cityName}");
                return result;
            }

            // Парсим ноды и маршруты
            var nodes = new Dictionary<long, (string name, string localName, double lat, double lon)>();
            var rawRoutes = new List<MetroRouteData>();

            using var doc = JsonDocument.Parse(json);
            var elements = doc.RootElement.GetProperty("elements");

            foreach (var el in elements.EnumerateArray())
            {
                string type = el.GetProperty("type").GetString() ?? "";

                if (type == "node")
                {
                    long id = el.GetProperty("id").GetInt64();
                    string name = "";
                    string localName = "";
                    if (el.TryGetProperty("tags", out var tags))
                    {
                        name = OsmParser.GetTag(tags, "name");
                        localName = OsmParser.GetTag(tags, "name:ru");
                    }
                    nodes[id] = (name, localName, el.GetProperty("lat").GetDouble(), el.GetProperty("lon").GetDouble());
                }
                else if (type == "relation")
                {
                    var route = ParseMetroRoute(el, nodes);
                    if (route != null && route.Stops.Count > 0)
                    {
                        rawRoutes.Add(route);
                    }
                }
            }

            FileLogger.Instance.Log($"  Метро: получено {rawRoutes.Count} направлений из OSM");

            if (rawRoutes.Count == 0)
            {
                FileLogger.Instance.Log($"  Метро: линии не найдены в {cityName}");
                return result;
            }

            // Обеспечиваем оба направления
            var routes = EnsureBothDirections(rawRoutes, cityName);

            // Получаем станции отдельным запросом (с тегами railway=station)
            var stations = await GetStationsAsync(cityName);
            FileLogger.Instance.Log($"  Метро: получено {stations.Count} станций");

            // Обогащаем станции информацией о маршрутах
            EnrichStationsWithRouteInfo(stations, routes);

            // Определяем пересадки
            ProcessTransfers(stations);

            // Фильтруем станции без маршрутов
            stations = stations.Where(s => s.Routes.Count > 0).ToList();

            result.Routes = routes;
            result.Stations = stations;

            FileLogger.Instance.Log($"  Метро: итого {routes.Count} маршрутов, {stations.Count} станций");
            return result;
        }

        private MetroRouteData? ParseMetroRoute(JsonElement relation, Dictionary<long, (string name, string localName, double lat, double lon)> nodes)
        {
            try
            {
                if (!relation.TryGetProperty("tags", out var tags)) return null;

                string routeNumber = OsmParser.GetTag(tags, "ref");
                if (string.IsNullOrEmpty(routeNumber))
                    routeNumber = OsmParser.GetTag(tags, "name");
                if (string.IsNullOrEmpty(routeNumber)) return null;

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

                if (relation.TryGetProperty("members", out var members))
                {
                    foreach (var member in members.EnumerateArray())
                    {
                        string role = member.GetProperty("role").GetString() ?? "";
                        string type = member.GetProperty("type").GetString() ?? "";
                        long refId = member.GetProperty("ref").GetInt64();

                        if (type == "node" && (role.Contains("stop") || role == "platform" || role == ""))
                        {
                            if (nodes.TryGetValue(refId, out var node) && !string.IsNullOrEmpty(node.name))
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
            catch
            {
                return null;
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
                    result.Add(CreateReverseRoute(lineRoutes[0], cityName));
                }
                else if (lineRoutes.Count == 2)
                {
                    result.AddRange(lineRoutes);
                }
                else
                {
                    // Убираем дубликаты направлений
                    var unique = new Dictionary<string, MetroRouteData>();
                    foreach (var r in lineRoutes)
                    {
                        if (r.Stops.Count == 0) continue;
                        string key = $"{r.Stops.First().NodeId}_{r.Stops.Last().NodeId}";
                        unique.TryAdd(key, r);
                    }
                    result.AddRange(unique.Values);
                }
            }

            return result;
        }

        private MetroRouteData CreateReverseRoute(MetroRouteData original, string cityName)
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

            string reverseName = original.Name;
            try
            {
                // Кольцевые линии Москвы
                bool isRing = (cityName.ToLower() == "москва") &&
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
                    string prefix = original.Name[..(original.Name.IndexOf(":") + 2)];
                    string direction = original.Name[(original.Name.IndexOf(":") + 2)..];
                    string separator = " → ";
                    if (direction.Contains(separator))
                    {
                        var parts = direction.Split(separator);
                        if (parts.Length == 2)
                            reverseName = prefix + parts[1] + separator + parts[0];
                    }
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

        private async Task<List<MetroStationData>> GetStationsAsync(string cityName)
        {
            string query = $@"
                [out:json][timeout:120];
                area[name=""{cityName}""]->.searchArea;
                (
                  nwr[""railway""=""station""][""station""=""subway""](area.searchArea);
                  nwr[""public_transport""=""station""][""subway""=""yes""](area.searchArea);
                );
                out body;";

            var json = await _client.ExecuteQueryAsync(query);
            if (json == null) return new List<MetroStationData>();

            var stations = new List<MetroStationData>();

            try
            {
                using var doc = JsonDocument.Parse(json);
                foreach (var el in doc.RootElement.GetProperty("elements").EnumerateArray())
                {
                    if (el.GetProperty("type").GetString() != "node") continue;
                    if (!el.TryGetProperty("tags", out var tags)) continue;

                    string name = OsmParser.GetTag(tags, "name");
                    if (string.IsNullOrEmpty(name)) continue;

                    stations.Add(new MetroStationData
                    {
                        Id = el.GetProperty("id").GetInt64(),
                        Name = name,
                        LocalName = OsmParser.GetTag(tags, "name:ru"),
                        Latitude = el.GetProperty("lat").GetDouble(),
                        Longitude = el.GetProperty("lon").GetDouble()
                    });
                }
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError("  Ошибка парсинга станций метро", ex);
            }

            return stations;
        }

        private void EnrichStationsWithRouteInfo(List<MetroStationData> stations, List<MetroRouteData> routes)
        {
            // Маппинг по имени станции (станция может быть в нескольких маршрутах)
            var stationByName = new Dictionary<string, List<MetroStationData>>();
            foreach (var s in stations)
            {
                if (!stationByName.ContainsKey(s.Name))
                    stationByName[s.Name] = new();
                stationByName[s.Name].Add(s);
            }

            foreach (var route in routes.Where(r => r.Stops.Count > 0))
            {
                foreach (var routeStop in route.Stops)
                {
                    if (stationByName.TryGetValue(routeStop.Name, out var matchedStations))
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
    }
}