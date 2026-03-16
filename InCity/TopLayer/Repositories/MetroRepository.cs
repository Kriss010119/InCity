using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
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
                       ARRAY(SELECT row_to_json(li)::text FROM unnest(line_info) li) AS line_info_json,
                       ARRAY(SELECT row_to_json(tr)::text FROM unnest(transfers) tr) AS transfers_json
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
                         ARRAY(SELECT row_to_json(li)::text FROM unnest(line_info) li) AS line_info_json,
                         ARRAY(SELECT row_to_json(tr)::text FROM unnest(transfers) tr) AS transfers_json
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
                    List<MetroStation> forwardStations = new List<MetroStation>();
                    foreach (long sid in forwardIds)
                    {
                        if (stationsDict.TryGetValue(sid, out MetroStation? st))
                        {
                            forwardStations.Add(st);
                        }
                    }

                    ulong forwardRouteId = (ulong)(lineId * 10 + 1);
                    result.Add(new MetroRoute(forwardRouteId, routeNumber, lineName + " (forward)", forwardStations, color, lineName, op));
                }

                if (backwardIds != null && backwardIds.Length > 0)
                {
                    List<MetroStation> backwardStations = new List<MetroStation>();
                    foreach (long sid in backwardIds)
                    {
                        if (stationsDict.TryGetValue(sid, out MetroStation? st))
                        {
                            backwardStations.Add(st);
                        }
                    }

                    ulong backwardRouteId = (ulong)(lineId * 10 + 2);
                    result.Add(new MetroRoute(backwardRouteId, routeNumber, lineName + " (backward)", backwardStations, color, lineName, op));
                }
            }

            return result;
        }

        private static MetroStation ParseMetroStation(dynamic row)
        {
            long id = (long)row.id;
            bool isTransfer = (bool)row.is_transfer;

            List<string> lines = new List<string>();
            List<MetroRouteInfo> routes = new List<MetroRouteInfo>();

            if (row.line_info_json is string[] lineInfoArr)
            {
                foreach (string item in lineInfoArr)
                {
                    MetroLineInfoDto? dto = Deserialize<MetroLineInfoDto>(item);
                    if (dto == null)
                    {
                        continue;
                    }

                    ulong routeId = (ulong)(dto.line_id * 10 + 1);
                    if (!string.IsNullOrWhiteSpace(dto.route_number) && !lines.Contains(dto.route_number))
                    {
                        lines.Add(dto.route_number);
                    }

                    routes.Add(new MetroRouteInfo(routeId, dto.route_number, dto.sequence_num, dto.color));
                }
            }

            List<KeyValuePair<string, List<MetroRouteInfo>>>? transfers = null;

            if (isTransfer && row.transfers_json is string[] transferArr && transferArr.Length > 0)
            {
                Dictionary<string, List<MetroRouteInfo>> transferDict = new Dictionary<string, List<MetroRouteInfo>>();

                foreach (string item in transferArr)
                {
                    MetroTransferInfoDto? dto = Deserialize<MetroTransferInfoDto>(item);
                    if (dto == null)
                    {
                        continue;
                    }

                    string stationName = dto.station_name ?? "";
                    ulong routeId = (ulong)(dto.line_id * 10 + 1);
                    MetroRouteInfo mri = new MetroRouteInfo(routeId, dto.route_number, dto.sequence_num, dto.color);

                    if (!transferDict.ContainsKey(stationName))
                    {
                        transferDict[stationName] = new List<MetroRouteInfo>();
                    }
                    transferDict[stationName].Add(mri);
                }

                transfers = transferDict.Select(kvp => new KeyValuePair<string, List<MetroRouteInfo>>(kvp.Key, kvp.Value)).ToList();
            }

            return new MetroStation(
                (ulong)id,
                (double)(decimal)row.latitude,
                (double)(decimal)row.longitude,
                (string?)row.name,
                lines.Count > 0 ? lines : null,
                routes.Count > 0 ? routes : null,
                isTransfer,
                transfers,
                (string?)row.local_name
            );
        }

        private static T? Deserialize<T>(string json)
        {
            try
            {
                return JsonSerializer.Deserialize<T>(json);
            }
            catch
            {
                return default;
            }
        }

        private sealed class MetroLineInfoDto
        {
            public int line_id { get; set; }
            public string? route_number { get; set; }
            public string? color { get; set; }
            public int sequence_num { get; set; }
        }

        private sealed class MetroTransferInfoDto
        {
            public string? station_name { get; set; }
            public int line_id { get; set; }
            public string? route_number { get; set; }
            public string? color { get; set; }
            public int sequence_num { get; set; }
        }
    }
}
