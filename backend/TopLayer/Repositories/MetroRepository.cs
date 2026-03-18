using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using DomainLib.Stations;
using DomainLib.Routes;
using MidLayer.DataAccess;

namespace TopLayer.Repositories
{
    internal class MetroRepository : IMetroRepository
    {
        private readonly string _connectionString;

        public MetroRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        public async Task<IEnumerable<MetroStation>> GetStationsAsync(double latitude, double longitude, int radiusMeters)
        {
            var box = DbHelper.GetBoundingBox(latitude, longitude, radiusMeters);

            string sql = $@"
                SELECT id, name, local_name, latitude, longitude, is_transfer,
                       line_info::text as line_info_text, 
                       transfers::text as transfers_text
                FROM metro_stations
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

            List<MetroStation> result = new List<MetroStation>();
            foreach (var row in rows)
            {
                result.Add(ParseMetroStation(row));
            }
            return result;
        }

        public async Task<IEnumerable<MetroRoute>> GetRoutesAsync()
        {
            using var connection = new NpgsqlConnection(_connectionString);

            var lines = await connection.QueryAsync(
                "SELECT id, name, route_number, operator, color_code, station_ids_forward, station_ids_backward FROM metro_lines");

            var allStations = await connection.QueryAsync(
                @"SELECT id, name, local_name, latitude, longitude, is_transfer,
                         line_info::text as line_info_text, 
                         transfers::text as transfers_text
                  FROM metro_stations");

            Dictionary<long, MetroStation> stationsDict = new Dictionary<long, MetroStation>();
            foreach (var row in allStations)
            {
                long id = (long)row.id;
                stationsDict[id] = ParseMetroStation(row);
            }

            List<MetroRoute> result = new List<MetroRoute>();

            foreach (var line in lines)
            {
                int lineId = (int)line.id;
                string routeNumber = (string)line.route_number;
                string lineName = (string)line.name;
                string color = (string?)line.color_code ?? "";
                string op = (string?)line.@operator ?? "";

                long[]? forwardIds = line.station_ids_forward as long[];
                long[]? backwardIds = line.station_ids_backward as long[];

                if (forwardIds != null && forwardIds.Length > 0)
                {
                    List<MetroStation> stations = new List<MetroStation>();
                    foreach (long sid in forwardIds)
                        if (stationsDict.TryGetValue(sid, out MetroStation? st)) stations.Add(st);

                    ulong forwardRouteId = (ulong)(lineId * 10 + 1);
                    result.Add(new MetroRoute(forwardRouteId, routeNumber, lineName + " (прямое)", stations, color, lineName, op));
                }

                if (backwardIds != null && backwardIds.Length > 0)
                {
                    List<MetroStation> stations = new List<MetroStation>();
                    foreach (long sid in backwardIds)
                        if (stationsDict.TryGetValue(sid, out MetroStation? st)) stations.Add(st);

                    ulong backwardRouteId = (ulong)(lineId * 10 + 2);
                    result.Add(new MetroRoute(backwardRouteId, routeNumber, lineName + " (обратное)", stations, color, lineName, op));
                }
            }

            return result;
        }

        private static MetroStation ParseMetroStation(dynamic row)
        {
            long id = (long)row.id;
            bool isTransfer = (bool)row.is_transfer;

            List<MetroRouteInfo> routes = SurfaceParseHelper.ParseMetroLineInfoText((string?)row.line_info_text);

            List<KeyValuePair<string, List<MetroRouteInfo>>>? transfers = null;
            if (isTransfer)
            {
                var parsed = SurfaceParseHelper.ParseMetroTransfersText((string?)row.transfers_text);
                if (parsed.Count > 0) transfers = parsed;
            }

            return new MetroStation(
                (ulong)id,
                (double)(decimal)row.latitude,
                (double)(decimal)row.longitude,
                (string?)row.name,
                null,
                routes.Count > 0 ? routes : null,
                isTransfer,
                transfers,
                (string?)row.local_name
            );
        }
    }
}