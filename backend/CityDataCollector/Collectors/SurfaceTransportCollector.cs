using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using DomainLib.Stations;
using DomainLib.Routes;
using DomainLib.Interfaces;
using CityDataCollector.Infrastructure;

namespace CityDataCollector.Collectors
{
    /// <summary>
    /// Виды наземного транспорта для сбора данных.
    /// </summary>
    public enum SurfaceTransportType
    {
        Bus,
        Tram,
        Trolleybus
    }

    /// <summary>
    /// Результат сбора данных наземного транспорта.
    /// </summary>
    public class SurfaceTransportResult
    {
        public List<SurfaceRouteData> Routes { get; set; } = new();
        public List<SurfaceStopData> Stops { get; set; } = new();
    }

    /// <summary>
    /// Данные маршрута для сериализации в JSON.
    /// Совместимы с форматом generate_seed.py.
    /// </summary>
    public class SurfaceRouteData
    {
        public long Id { get; set; }
        public string RouteNumber { get; set; } = "";
        public string Name { get; set; } = "";
        public string From { get; set; } = "";
        public string To { get; set; } = "";
        public string Operator { get; set; } = "";
        public string Network { get; set; } = "";
        public List<RouteStopData> Stops { get; set; } = new();
    }

    public class RouteStopData
    {
        public long NodeId { get; set; }
        public string Name { get; set; } = "";
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Role { get; set; } = "";
        public int Sequence { get; set; }
    }

    /// <summary>
    /// Данные остановки для сериализации в JSON.
    /// </summary>
    public class SurfaceStopData
    {
        public long Id { get; set; }
        public string Name { get; set; } = "";
        public string LocalName { get; set; } = "";
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public List<StopRouteRef> Routes { get; set; } = new();
    }

    public class StopRouteRef
    {
        public string RouteNumber { get; set; } = "";
        public int Order { get; set; }
    }

    /// <summary>
    /// Сборщик данных наземного транспорта (автобусы, трамваи, троллейбусы).
    /// Единый класс для всех трёх видов — отличаются только OSM-теги.
    /// </summary>
    public class SurfaceTransportCollector
    {
        private readonly OverpassClient _client;
        private readonly SurfaceTransportType _type;
        private readonly string _osmRouteTag;
        private readonly string _osmStopTags;
        private readonly string _typeName;
        private readonly int _batchSize = 40;

        public SurfaceTransportCollector(OverpassClient client, SurfaceTransportType type)
        {
            _client = client;
            _type = type;

            (_osmRouteTag, _osmStopTags, _typeName) = type switch
            {
                SurfaceTransportType.Bus => (
                    "bus", 
                    @"node[""highway""=""bus_stop""](area.searchArea); node[""public_transport""=""platform""][""bus""=""yes""](area.searchArea);", 
                    "автобусов"),
                
                SurfaceTransportType.Tram => (
                    "tram", 
                    @"node[""railway""=""tram_stop""](area.searchArea); node[""public_transport""=""platform""][""tram""=""yes""](area.searchArea); node[""tram""=""yes""](area.searchArea);", 
                    "трамваев"),
                
                SurfaceTransportType.Trolleybus => (
                    "trolleybus", 
                    @"node[""highway""=""bus_stop""][""trolleybus""=""yes""](area.searchArea); node[""public_transport""=""platform""][""trolleybus""=""yes""](area.searchArea); node[""trolleybus""=""yes""](area.searchArea);", 
                    "троллейбусов"),
                
                _ => throw new ArgumentException($"Unknown type: {type}")
            };
        }

        public async Task<SurfaceTransportResult> CollectAsync(string cityName)
        {
            FileLogger.Instance.Log($"  Начало сбора {_typeName} для {cityName}");

            var result = new SurfaceTransportResult();

            // ШАГ 1: Получаем ID маршрутов
            var routeIds = await GetRouteIdsAsync(cityName);

            if (routeIds.Count == 0)
            {
                FileLogger.Instance.Log($"  {_typeName}: маршруты не найдены в {cityName}");
                return result;
            }

            FileLogger.Instance.Log($"  {_typeName}: найдено {routeIds.Count} ID маршрутов");

            // ШАГ 2: Загружаем маршруты пачками по 20
            var routes = await LoadRoutesBatchAsync(routeIds, batchSize: _batchSize);
            FileLogger.Instance.Log($"  {_typeName}: загружено {routes.Count} маршрутов с остановками");

            // ШАГ 3: Получаем все остановки
            var stops = await GetAllStopsAsync(cityName);
            FileLogger.Instance.Log($"  {_typeName}: получено {stops.Count} остановок");

            // ШАГ 4: Обогащаем остановки информацией о маршрутах
            EnrichStopsWithRouteInfo(stops, routes);

            // ШАГ 5: Удаляем остановки без маршрутов
            stops = stops.Where(s => s.Routes.Count > 0).ToList();

            result.Routes = routes;
            result.Stops = stops;

            FileLogger.Instance.Log($"  {_typeName}: итого {routes.Count} маршрутов, {stops.Count} остановок");
            return result;
        }

        private async Task<List<long>> GetRouteIdsAsync(string cityName)
        {
            string query = $@"
                [out:json][timeout:90];
                area[name=""{cityName}""]->.searchArea;
                relation[type=""route""][route=""{_osmRouteTag}""](area.searchArea);
                out ids;";

            var json = await _client.ExecuteQueryAsync(query);
            if (json == null) return new List<long>();

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

        private async Task<List<SurfaceRouteData>> LoadRoutesBatchAsync(List<long> routeIds, int batchSize)
        {
            var allRoutes = new List<SurfaceRouteData>();
            int totalBatches = (int)Math.Ceiling(routeIds.Count / (double)batchSize);

            for (int i = 0; i < routeIds.Count; i += batchSize)
            {
                int batchNum = i / batchSize + 1;
                var batchIds = routeIds.Skip(i).Take(batchSize).ToList();

                FileLogger.Instance.Log($"    Пачка {batchNum}/{totalBatches} ({batchIds.Count} маршрутов)...");

                var idsString = string.Join(",", batchIds);
                string query = $@"
                    [out:json][timeout:120];
                    (relation(id:{idsString}); node(r););
                    out body; >; out skel qt;";

                var json = await _client.ExecuteQueryAsync(query);

                if (json != null)
                {
                    var parsed = ParseRoutesWithStops(json);
                    allRoutes.AddRange(parsed);
                }

                // Пауза между пачками
                if (i + batchSize < routeIds.Count)
                {
                    await Task.Delay(500);
                }
            }

            return allRoutes;
        }

        private async Task<List<SurfaceStopData>> GetAllStopsAsync(string cityName)
        {
            string query = $@"
                [out:json][timeout:90];
                area[name=""{cityName}""]->.searchArea;
                ({_osmStopTags});
                out body; >; out skel qt;";

            var json = await _client.ExecuteQueryAsync(query);
            if (json == null) return new List<SurfaceStopData>();

            return ParseStops(json);
        }

        private void EnrichStopsWithRouteInfo(List<SurfaceStopData> stops, List<SurfaceRouteData> routes)
        {
            var stopDict = stops.ToDictionary(s => s.Id, s => s);

            foreach (var route in routes)
            {
                foreach (var routeStop in route.Stops)
                {
                    if (stopDict.TryGetValue(routeStop.NodeId, out var stop))
                    {
                        stop.Routes.Add(new StopRouteRef
                        {
                            RouteNumber = route.RouteNumber,
                            Order = routeStop.Sequence
                        });

                        // Обогащаем имя остановки из маршрута если пусто
                        if (string.IsNullOrEmpty(stop.Name) && !string.IsNullOrEmpty(routeStop.Name))
                        {
                            stop.Name = routeStop.Name;
                        }
                    }
                }
            }
        }

        private List<SurfaceRouteData> ParseRoutesWithStops(string json)
        {
            var routes = new List<SurfaceRouteData>();
            var nodes = new Dictionary<long, (string name, double lat, double lon)>();

            try
            {
                using var doc = JsonDocument.Parse(json);
                var elements = doc.RootElement.GetProperty("elements");

                // Первый проход: собираем ноды
                foreach (var el in elements.EnumerateArray())
                {
                    if (el.GetProperty("type").GetString() == "node")
                    {
                        long id = el.GetProperty("id").GetInt64();
                        string name = "";
                        if (el.TryGetProperty("tags", out var tags))
                            name = OsmParser.GetTag(tags, "name");

                        nodes[id] = (name, el.GetProperty("lat").GetDouble(), el.GetProperty("lon").GetDouble());
                    }
                }

                // Второй проход: собираем маршруты
                foreach (var el in elements.EnumerateArray())
                {
                    if (el.GetProperty("type").GetString() != "relation") continue;
                    if (!el.TryGetProperty("tags", out var tags)) continue;

                    string routeNumber = OsmParser.GetTag(tags, "ref");
                    if (string.IsNullOrEmpty(routeNumber)) continue;

                    var route = new SurfaceRouteData
                    {
                        Id = el.GetProperty("id").GetInt64(),
                        RouteNumber = routeNumber,
                        Name = OsmParser.GetTag(tags, "name"),
                        From = OsmParser.GetTag(tags, "from"),
                        To = OsmParser.GetTag(tags, "to"),
                        Operator = OsmParser.GetTag(tags, "operator"),
                        Network = OsmParser.GetTag(tags, "network")
                    };

                    if (el.TryGetProperty("members", out var members))
                    {
                        foreach (var member in members.EnumerateArray())
                        {
                            string role = member.GetProperty("role").GetString() ?? "";
                            string type = member.GetProperty("type").GetString() ?? "";
                            long refId = member.GetProperty("ref").GetInt64();

                            if (type == "node" && (role.Contains("stop") || role == "platform"))
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

                    if (!string.IsNullOrEmpty(route.RouteNumber))
                    {
                        routes.Add(route);
                    }
                }
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError($"  Ошибка парсинга маршрутов", ex);
            }

            return routes;
        }

        private List<SurfaceStopData> ParseStops(string json)
        {
            var stops = new List<SurfaceStopData>();

            try
            {
                using var doc = JsonDocument.Parse(json);
                foreach (var el in doc.RootElement.GetProperty("elements").EnumerateArray())
                {
                    if (el.GetProperty("type").GetString() != "node") continue;
                    if (!el.TryGetProperty("tags", out var tags)) continue;

                    stops.Add(new SurfaceStopData
                    {
                        Id = el.GetProperty("id").GetInt64(),
                        Name = OsmParser.GetTag(tags, "name"),
                        LocalName = OsmParser.GetTag(tags, "name:ru"),
                        Latitude = el.GetProperty("lat").GetDouble(),
                        Longitude = el.GetProperty("lon").GetDouble()
                    });
                }
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError("  Ошибка парсинга остановок", ex);
            }

            return stops;
        }
    }
}