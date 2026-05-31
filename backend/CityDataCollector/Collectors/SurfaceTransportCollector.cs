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
    public enum SurfaceTransportType
    {
        Bus,
        Tram,
        Trolleybus
    }

    public class SurfaceTransportResult
    {
        public List<SurfaceRouteData> Routes { get; set; } = new();
        public List<SurfaceStopData> Stops { get; set; } = new();
    }

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
        public long StopId { get; set; }
        public string RouteNumber { get; set; } = "";
        public int Order { get; set; }
        public int RouteIndex { get; set; }
    }

    public class SurfaceTransportCollector
    {
        private readonly OverpassClient _client;
        private readonly SurfaceTransportType _type;
        private readonly string _osmRouteTag;
        private readonly string _osmStopTags;
        private readonly string _typeName;
        private readonly int _batchSize = 100;

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

            var routeIds = await GetRouteIdsAsync(cityName);

            if (routeIds.Count == 0)
            {
                FileLogger.Instance.Log($"  {_typeName}: маршруты не найдены в {cityName}");
                return result;
            }

            FileLogger.Instance.Log($"  {_typeName}: найдено {routeIds.Count} ID маршрутов");

            var routes = await LoadRoutesBatchAsync(routeIds, batchSize: _batchSize);
            FileLogger.Instance.Log($"  {_typeName}: загружено {routes.Count} маршрутов с остановками");

            var stopDict = new Dictionary<long, SurfaceStopData>();

            for (int routeIndex = 0; routeIndex < routes.Count; routeIndex++)
            {
                var route = routes[routeIndex];

                for (int i = 0; i < route.Stops.Count; i++)
                {
                    var routeStop = route.Stops[i];
                    int order = i + 1; // Order начинается с 1

                    if (!stopDict.TryGetValue(routeStop.NodeId, out var stopData))
                    {
                        stopData = new SurfaceStopData
                        {
                            Id = routeStop.NodeId,
                            Name = routeStop.Name,
                            Latitude = routeStop.Latitude,
                            Longitude = routeStop.Longitude
                        };
                        stopDict[routeStop.NodeId] = stopData;
                    }

                    stopData.Routes.Add(new StopRouteRef
                    {
                        StopId = routeStop.NodeId,
                        RouteNumber = route.RouteNumber,
                        Order = order,
                        RouteIndex = routeIndex
                    });
                }
            }

            await EnrichStopNamesAsync(stopDict, cityName);

            result.Routes = routes;
            result.Stops = stopDict.Values.ToList();

            FileLogger.Instance.Log($"  {_typeName}: итого {routes.Count} маршрутов, {result.Stops.Count} остановок");
            return result;
        }

        private async Task<List<long>> GetRouteIdsAsync(string cityName)
        {
            string query = $@"
                [out:json][timeout:90];
                area[name=""{cityName}""]->.searchArea;
                relation[type=""route""][route=""{_osmRouteTag}""](area.searchArea)(newer:""2023-01-01T00:00:00Z"");
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

                if (i + batchSize < routeIds.Count)
                {
                    await Task.Delay(500);
                }
            }

            return allRoutes;
        }

        /// <summary>
        /// Одним запросом получает все остановки данного вида транспорта в городе,
        /// затем обогащает словарь названиями.
        /// </summary>
        private async Task EnrichStopNamesAsync(Dictionary<long, SurfaceStopData> stopDict, string cityName)
        {
            if (stopDict.Count == 0) return;

            string query = $@"
                [out:json][timeout:90];
                area[name=""{cityName}""]->.searchArea;
                ({_osmStopTags});
                out body;";

            var json = await _client.ExecuteQueryAsync(query);
            if (json == null) return;

            try
            {
                using var doc = JsonDocument.Parse(json);
                foreach (var el in doc.RootElement.GetProperty("elements").EnumerateArray())
                {
                    if (el.GetProperty("type").GetString() != "node") continue;

                    long id = el.GetProperty("id").GetInt64();

                    if (!stopDict.TryGetValue(id, out var stop)) continue;

                    if (el.TryGetProperty("tags", out var tags))
                    {
                        string name = OsmParser.GetTag(tags, "name");
                        if (!string.IsNullOrEmpty(name))
                        {
                            stop.Name = name;
                        }

                        string localName = OsmParser.GetTag(tags, "name:ru");
                        if (!string.IsNullOrEmpty(localName))
                        {
                            stop.LocalName = localName;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError("  Ошибка обогащения названий остановок", ex);
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
                        int stopIndex = 0;

                        foreach (var member in members.EnumerateArray())
                        {
                            string role = member.GetProperty("role").GetString() ?? "";
                            string type = member.GetProperty("type").GetString() ?? "";
                            long refId = member.GetProperty("ref").GetInt64();

                            if (type == "node" && role.Contains("platform") && !role.Contains("stop"))
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
                                        Sequence = stopIndex + 1
                                    });
                                    stopIndex++;
                                }
                            }
                        }
                    }

                    if (!string.IsNullOrEmpty(route.RouteNumber) && route.Stops.Count > 0)
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
    }
}