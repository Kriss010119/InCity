using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using DomainLib.Stations;
using DomainLib.Routes;
using DomainLib.Interfaces;
using MidLayer.DataAccess;

namespace TopLayer.Repositories
{
    internal class BusRepository : IBusRepository
    {
        private readonly string _connectionString;

        public BusRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        public async Task<IEnumerable<BusStop>> GetStopsAsync(double latitude, double longitude, int radiusMeters)
        {
            var box = DbHelper.GetBoundingBox(latitude, longitude, radiusMeters);

            string sql = $@"
                SELECT id, name, local_name, latitude, longitude, route_info
                FROM bus_stops
                WHERE {DbHelper.BoundingBoxSql}
                AND {DbHelper.HaversineSql}";

            using var connection = new NpgsqlConnection(_connectionString);

            var rows = await connection.QueryAsync(sql, new
            {
                lat = latitude,
                lon = longitude,
                radius = radiusMeters,
                minLat = box.minLat,
                maxLat = box.maxLat,
                minLon = box.minLon,
                maxLon = box.maxLon
            });

            List<BusStop> result = new List<BusStop>();

            foreach (var row in rows)
            {
                List<RouteInfo> routes = ParseRouteInfoArray(row.route_info);

                result.Add(new BusStop(
                    (ulong)(long)row.id,
                    (double)(decimal)row.latitude,
                    (double)(decimal)row.longitude,
                    (string?)row.name,
                    routes,
                    (string?)row.local_name
                ));
            }

            return result;
        }

        public async Task<IEnumerable<BusRoute>> GetRoutesForStopsAsync(IEnumerable<ulong> stopIds)
        {
            long[] ids = stopIds.Select(id => (long)id).ToArray();

            if (ids.Length == 0)
            {
                return [];
            }

            string sql = @"
                SELECT DISTINCT r.id, r.route_number, r.name, r.from_name, r.to_name, 
                       r.operator, r.network, r.stop_ids
                FROM bus_routes r
                WHERE r.stop_ids && @stopIds";

            using var connection = new NpgsqlConnection(_connectionString);

            var rows = await connection.QueryAsync(sql, new { stopIds = ids });

            // Загружаем все остановки, на которые ссылаются маршруты
            HashSet<long> allStopIds = new HashSet<long>();
            var rowList = rows.ToList();

            foreach (var row in rowList)
            {
                long[]? routeStopIds = row.stop_ids as long[];
                if (routeStopIds != null)
                {
                    foreach (long sid in routeStopIds)
                    {
                        allStopIds.Add(sid);
                    }
                }
            }

            Dictionary<long, BusStop> stopsById = await LoadStopsByIds(connection, allStopIds);

            List<BusRoute> result = new List<BusRoute>();

            foreach (var row in rowList)
            {
                long[]? routeStopIds = row.stop_ids as long[];
                List<IStation> stops = new List<IStation>();

                if (routeStopIds != null)
                {
                    foreach (long sid in routeStopIds)
                    {
                        if (stopsById.TryGetValue(sid, out BusStop? stop))
                        {
                            stops.Add(stop);
                        }
                    }
                }

                result.Add(new BusRoute(
                    (ulong)(int)row.id,
                    (string)row.route_number,
                    (string?)row.name ?? "",
                    stops,
                    (string?)row.from_name ?? "",
                    (string?)row.to_name ?? "",
                    (string?)row.@operator ?? "",
                    (string?)row.network ?? ""
                ));
            }

            return result;
        }

        private async Task<Dictionary<long, BusStop>> LoadStopsByIds(NpgsqlConnection connection, HashSet<long> stopIds)
        {
            if (stopIds.Count == 0)
            {
                return new Dictionary<long, BusStop>();
            }

            string sql = @"
                SELECT id, name, local_name, latitude, longitude, route_info
                FROM bus_stops
                WHERE id = ANY(@ids)";

            var rows = await connection.QueryAsync(sql, new { ids = stopIds.ToArray() });

            Dictionary<long, BusStop> dict = new Dictionary<long, BusStop>();

            foreach (var row in rows)
            {
                long id = (long)row.id;
                List<RouteInfo> routes = ParseRouteInfoArray(row.route_info);

                dict[id] = new BusStop(
                    (ulong)id,
                    (double)(decimal)row.latitude,
                    (double)(decimal)row.longitude,
                    (string?)row.name,
                    routes,
                    (string?)row.local_name
                );
            }

            return dict;
        }

        private static List<RouteInfo> ParseRouteInfoArray(object? routeInfoRaw)
        {
            List<RouteInfo> routes = new List<RouteInfo>();

            if (routeInfoRaw is object[] arr)
            {
                foreach (var item in arr)
                {
                    if (item is (int routeId, string routeNumber, int seqNum))
                    {
                        routes.Add(new RouteInfo((ulong)routeId, routeNumber, seqNum));
                    }
                }
            }

            return routes;
        }
    }
}