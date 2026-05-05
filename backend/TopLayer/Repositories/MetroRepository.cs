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

        /// <summary>
        /// Загружает линии метро, содержащие указанные станции.
        /// Аналогично GetRoutesForStopsAsync в наземном транспорте:
        /// ищем линии где station_ids_forward или station_ids_backward пересекаются с переданными ID,
        /// затем загружаем все станции этих линий и строим MetroRoute.
        /// </summary>
        public async Task<IEnumerable<MetroRoute>> GetRoutesForStationsAsync(IEnumerable<ulong> stationIds)
        {
            long[] ids = stationIds.Select(id => (long)id).ToArray();
            if (ids.Length == 0) return [];

            //string sql = @"
            //    SELECT id, name, route_number, operator, color_code, 
            //           station_ids_forward, station_ids_backward
            //    FROM metro_lines
            //    WHERE station_ids_forward && @stationIds
            //       OR station_ids_backward && @stationIds";

            string sql = @"
                SELECT id, name, route_number, operator, color_code, 
                       station_ids_forward, station_ids_backward
                FROM metro_lines";

            using var connection = new NpgsqlConnection(_connectionString);
            var lines = await connection.QueryAsync(sql, new { stationIds = ids });
            var lineList = lines.ToList();

            if (lineList.Count == 0) return [];

            HashSet<long> allStationIds = new HashSet<long>();
            foreach (var line in lineList)
            {
                long[]? forwardIds = line.station_ids_forward as long[];
                long[]? backwardIds = line.station_ids_backward as long[];

                if (forwardIds != null)
                    foreach (long sid in forwardIds) allStationIds.Add(sid);
                if (backwardIds != null)
                    foreach (long sid in backwardIds) allStationIds.Add(sid);
            }

            // Загружаем все станции этих линий
            Dictionary<long, MetroStation> stationsDict = await LoadStationsByIds(connection, allStationIds);

            // Строим MetroRoute для каждого направления
            List<MetroRoute> result = new List<MetroRoute>();

            foreach (var line in lineList)
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

                    if (stations.Count > 0)
                    {
                        ulong forwardRouteId = (ulong)(lineId * 10 + 1);
                        result.Add(new MetroRoute(forwardRouteId, routeNumber, lineName + " (прямое)", stations, color, lineName, op));
                    }
                }

                if (backwardIds != null && backwardIds.Length > 0)
                {
                    List<MetroStation> stations = new List<MetroStation>();
                    foreach (long sid in backwardIds)
                        if (stationsDict.TryGetValue(sid, out MetroStation? st)) stations.Add(st);

                    if (stations.Count > 0)
                    {
                        ulong backwardRouteId = (ulong)(lineId * 10 + 2);
                        result.Add(new MetroRoute(backwardRouteId, routeNumber, lineName + " (обратное)", stations, color, lineName, op));
                    }
                }
            }

            return result;
        }

        /// <summary>
        /// Загружает станции метро по набору ID.
        /// </summary>
        private async Task<Dictionary<long, MetroStation>> LoadStationsByIds(NpgsqlConnection connection, HashSet<long> stationIds)
        {
            if (stationIds.Count == 0) return new Dictionary<long, MetroStation>();

            var rows = await connection.QueryAsync(
                @"SELECT id, name, local_name, latitude, longitude, is_transfer,
                         line_info::text as line_info_text, 
                         transfers::text as transfers_text
                  FROM metro_stations WHERE id = ANY(@ids)",
                new { ids = stationIds.ToArray() });

            Dictionary<long, MetroStation> dict = new Dictionary<long, MetroStation>();

            foreach (var row in rows)
            {
                long id = (long)row.id;
                dict[id] = ParseMetroStation(row);
            }

            return dict;
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
                routes,
                transfers,
                (string?)row.local_name
            );
        }
    }
}