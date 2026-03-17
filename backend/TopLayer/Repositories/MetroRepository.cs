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
                SELECT id, name, local_name, latitude, longitude, is_transfer, line_info, transfers
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

            // Загружаем все линии метро
            var lines = await connection.QueryAsync(
                "SELECT id, name, route_number, operator, color_code, station_ids_forward, station_ids_backward FROM metro_lines");

            // Загружаем все станции метро для сборки маршрутов
            var allStations = await connection.QueryAsync(
                "SELECT id, name, local_name, latitude, longitude, is_transfer, line_info, transfers FROM metro_stations");

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

                // Прямое направление
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

                    // ID маршрута: lineId * 10 + 1 для прямого направления
                    ulong forwardRouteId = (ulong)(lineId * 10 + 1);
                    result.Add(new MetroRoute(forwardRouteId, routeNumber, lineName + " (прямое)", forwardStations, color, lineName, op));
                }

                // Обратное направление
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

                    // ID маршрута: lineId * 10 + 2 для обратного направления
                    ulong backwardRouteId = (ulong)(lineId * 10 + 2);
                    result.Add(new MetroRoute(backwardRouteId, routeNumber, lineName + " (обратное)", backwardStations, color, lineName, op));
                }
            }

            return result;
        }

        private static MetroStation ParseMetroStation(dynamic row)
        {
            long id = (long)row.id;
            bool isTransfer = (bool)row.is_transfer;

            // Парсинг line_info -> Lines + Routes
            List<string> lines = new List<string>();
            List<MetroRouteInfo> routes = new List<MetroRouteInfo>();

            if (row.line_info is object[] lineInfoArr)
            {
                foreach (var item in lineInfoArr)
                {
                    if (item is ValueTuple<int, string?, string?, int> tuple)
                    {
                        int lineId = tuple.Item1;
                        string? routeNumber = tuple.Item2;
                        string? color = tuple.Item3;
                        int seqNum = tuple.Item4;

                        // Генерируем route ID аналогично GetRoutesAsync
                        // Здесь мы не знаем направление, поэтому используем lineId * 10 + 1 как базовый
                        ulong routeId = (ulong)(lineId * 10 + 1);
                        routes.Add(new MetroRouteInfo(routeId, routeNumber, seqNum, color));
                    }
                }
            }

            // Парсинг transfers -> List<KeyValuePair<string, List<MetroRouteInfo>>>
            List<KeyValuePair<string, List<MetroRouteInfo>>>? transfers = null;

            if (isTransfer && row.transfers is object[] transferArr && transferArr.Length > 0)
            {
                Dictionary<string, List<MetroRouteInfo>> transferDict = new Dictionary<string, List<MetroRouteInfo>>();

                foreach (var item in transferArr)
                {
                    if (item is ValueTuple<string?, int, string?, string?, int> tt)
                    {
                        string stationName = tt.Item1 ?? "";
                        int lineId = tt.Item2;
                        string? routeNumber = tt.Item3;
                        string? color = tt.Item4;
                        int seqNum = tt.Item5;

                        ulong routeId = (ulong)(lineId * 10 + 1);
                        MetroRouteInfo mri = new MetroRouteInfo(routeId, routeNumber, seqNum, color);

                        if (!transferDict.ContainsKey(stationName))
                        {
                            transferDict[stationName] = new List<MetroRouteInfo>();
                        }
                        transferDict[stationName].Add(mri);
                    }
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
    }
}