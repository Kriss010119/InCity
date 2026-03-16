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
    internal class TrolleybusRepository : ITrolleybusRepository
    {
        private readonly string _connectionString;

        public TrolleybusRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        public async Task<IEnumerable<TrolleybusStop>> GetStopsAsync(double latitude, double longitude, int radiusMeters)
        {
            var box = DbHelper.GetBoundingBox(latitude, longitude, radiusMeters);

            string sql = $@"
                SELECT id, name, local_name, latitude, longitude,
                       ARRAY(SELECT row_to_json(ri)::text FROM unnest(route_info) ri) AS route_info_json
                FROM trolleybus_stops
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

            List<TrolleybusStop> result = new List<TrolleybusStop>();

            foreach (var row in rows)
            {
                List<RouteInfo> routes = SurfaceParseHelper.ParseRouteInfoArray(row.route_info_json);
                result.Add(new TrolleybusStop(
                    (ulong)(long)row.id, (double)(decimal)row.latitude, (double)(decimal)row.longitude,
                    (string?)row.name, routes, (string?)row.local_name));
            }

            return result;
        }

        public async Task<IEnumerable<TrolleybusRoute>> GetRoutesForStopsAsync(IEnumerable<ulong> stopIds)
        {
            long[] ids = stopIds.Select(id => (long)id).ToArray();
            if (ids.Length == 0) return [];

            string sql = @"
                SELECT DISTINCT r.id, r.route_number, r.name, r.from_name, r.to_name, r.operator, r.network, r.stop_ids
                FROM trolleybus_routes r WHERE r.stop_ids && @stopIds";

            using var connection = new NpgsqlConnection(_connectionString);
            var rows = await connection.QueryAsync(sql, new { stopIds = ids });
            var rowList = rows.ToList();

            HashSet<long> allStopIds = new HashSet<long>();
            foreach (var row in rowList)
            {
                if (row.stop_ids is long[] sids) foreach (long sid in sids) allStopIds.Add(sid);
            }

            Dictionary<long, TrolleybusStop> stopsById = await LoadStopsByIds(connection, allStopIds);

            List<TrolleybusRoute> result = new List<TrolleybusRoute>();
            foreach (var row in rowList)
            {
                List<IStation> stops = new List<IStation>();
                if (row.stop_ids is long[] routeStopIds)
                    foreach (long sid in routeStopIds)
                        if (stopsById.TryGetValue(sid, out TrolleybusStop? stop)) stops.Add(stop);

                result.Add(new TrolleybusRoute((ulong)(int)row.id, (string)row.route_number, (string?)row.name ?? "",
                    stops, (string?)row.from_name ?? "", (string?)row.to_name ?? "",
                    (string?)row.@operator ?? "", (string?)row.network ?? ""));
            }

            return result;
        }

        private async Task<Dictionary<long, TrolleybusStop>> LoadStopsByIds(NpgsqlConnection connection, HashSet<long> stopIds)
        {
            if (stopIds.Count == 0) return new Dictionary<long, TrolleybusStop>();

            var rows = await connection.QueryAsync(
                @"SELECT id, name, local_name, latitude, longitude,
                         ARRAY(SELECT row_to_json(ri)::text FROM unnest(route_info) ri) AS route_info_json
                  FROM trolleybus_stops WHERE id = ANY(@ids)",
                new { ids = stopIds.ToArray() });

            Dictionary<long, TrolleybusStop> dict = new Dictionary<long, TrolleybusStop>();
            foreach (var row in rows)
            {
                long id = (long)row.id;
                List<RouteInfo> routes = SurfaceParseHelper.ParseRouteInfoArray(row.route_info_json);
                dict[id] = new TrolleybusStop((ulong)id, (double)(decimal)row.latitude, (double)(decimal)row.longitude,
                    (string?)row.name, routes, (string?)row.local_name);
            }
            return dict;
        }
    }
}
