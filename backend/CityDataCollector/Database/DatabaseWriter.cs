using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Npgsql;
using CityDataCollector.Infrastructure;

namespace CityDataCollector.Database
{
    /// <summary>
    /// Записывает собранные данные напрямую в PostgreSQL.
    /// Каждый вид данных (автобусы, трамваи, троллейбусы, метро, достопримечательности)
    /// записывается в отдельной транзакции. Если результат пуст — старые данные не затрагиваются.
    /// </summary>
    public class DatabaseWriter
    {
        private readonly string _connectionString;
        private readonly Dictionary<int, string> _cityNames = new();

        public DatabaseWriter(string connectionString)
        {
            _connectionString = connectionString;
        }

        /// <summary>
        /// Получает city_id по имени города. Если города нет — создаёт.
        /// </summary>
        public async Task<int> EnsureCityAsync(string cityName)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            using var selectCmd = new NpgsqlCommand("SELECT id FROM cities WHERE name = @name", conn);
            selectCmd.Parameters.AddWithValue("name", cityName);
            var result = await selectCmd.ExecuteScalarAsync();

            if (result != null)
            {
                int id = Convert.ToInt32(result);
                _cityNames[id] = cityName;
                return id;
            }

            using var insertCmd = new NpgsqlCommand("INSERT INTO cities (name) VALUES (@name) RETURNING id", conn);
            insertCmd.Parameters.AddWithValue("name", cityName);
            int newId = Convert.ToInt32(await insertCmd.ExecuteScalarAsync());
            _cityNames[newId] = cityName;
            return newId;
        }


        private string _backupDir = "backups";

        /// <summary>
        /// Устанавливает директорию для бэкапов. По умолчанию - "backups" рядом с exe.
        /// </summary>
        public void SetBackupDirectory(string dir)
        {
            _backupDir = dir;
        }

        /// <summary>
        /// Сохраняет текущие данные нескольких таблиц для города в JSON-файлы перед обновлением.
        /// </summary>
        private async Task BackupTablesAsync(int cityId, string cityName, params string[] tableNames)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            foreach (string tableName in tableNames)
            {
                await BackupTableAsync(conn, tableName, cityId, cityName);
            }
        }

        /// <summary>
        /// Сохраняет текущие данные одной таблицы для города в JSON-файл.
        /// Формат: backups/{cityNameEn}/{tableName}_{timestamp}.json
        /// </summary>
        private async Task BackupTableAsync(NpgsqlConnection conn, string tableName, int cityId, string cityName)
        {
            try
            {
                string cityDir = Path.Combine(_backupDir, Transliterator.ToLatin(cityName));
                Directory.CreateDirectory(cityDir);

                string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                string filePath = Path.Combine(cityDir, $"{tableName}_{timestamp}.json");

                using var cmd = new NpgsqlCommand(
                    $"SELECT row_to_json(t) FROM {tableName} t WHERE city_id = @cityId", conn);
                cmd.Parameters.AddWithValue("cityId", cityId);

                var rows = new List<string>();
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    rows.Add(reader.GetString(0));
                }

                if (rows.Count > 0)
                {
                    string json = $"[\n  {string.Join(",\n  ", rows)}\n]";
                    await File.WriteAllTextAsync(filePath, json, System.Text.Encoding.UTF8);
                    FileLogger.Instance.Log($"    Бэкап: {tableName} → {filePath} ({rows.Count} записей)");
                }
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError($"    Ошибка бэкапа {tableName}", ex);
                // Бэкап не критичен — продолжаем обновление
            }
        }

        /// <summary>
        /// Записывает данные наземного транспорта (автобусы/трамваи/троллейбусы).
        /// Удаляет старые данные для города и вставляет новые в одной транзакции.
        /// </summary>
        public async Task WriteSurfaceTransportAsync(int cityId, string transportType,
            List<Collectors.SurfaceRouteData> routes, List<Collectors.SurfaceStopData> stops)
        {
            string routeTable, stopTable;

            switch (transportType)
            {
                case "bus":
                    routeTable = "bus_routes";
                    stopTable = "bus_stops";
                    break;
                case "tram":
                    routeTable = "tram_routes";
                    stopTable = "tram_stops";
                    break;
                case "trolleybus":
                    routeTable = "trolleybus_routes";
                    stopTable = "trolleybus_stops";
                    break;
                default:
                    throw new ArgumentException($"Unknown transport type: {transportType}");
            }

            string cityName = _cityNames.TryGetValue(cityId, out string? cn) ? cn : $"city_{cityId}";
            await BackupTablesAsync(cityId, cityName, stopTable, routeTable);

            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();
            using var tx = await conn.BeginTransactionAsync();

            try
            {
                using (var delStops = new NpgsqlCommand($"DELETE FROM {stopTable} WHERE city_id = @cityId", conn, tx))
                {
                    delStops.Parameters.AddWithValue("cityId", cityId);
                    await delStops.ExecuteNonQueryAsync();
                }
                using (var delRoutes = new NpgsqlCommand($"DELETE FROM {routeTable} WHERE city_id = @cityId", conn, tx))
                {
                    delRoutes.Parameters.AddWithValue("cityId", cityId);
                    await delRoutes.ExecuteNonQueryAsync();
                }

                var routeDbIds = new Dictionary<string, List<long>>();
                var routeIdByIndex = new Dictionary<int, long>();

                for (int ri = 0; ri < routes.Count; ri++)
                {
                    var route = routes[ri];
                    long[] stopIds = route.Stops.Select(s => s.NodeId).ToArray();

                    string sql = $@"INSERT INTO {routeTable} 
                        (city_id, from_name, to_name, operator, network, route_number, name, stop_ids) 
                        VALUES (@cityId, @from, @to, @op, @network, @routeNumber, @name, @stopIds)
                        RETURNING id";

                    using var cmd = new NpgsqlCommand(sql, conn, tx);
                    cmd.Parameters.AddWithValue("cityId", cityId);
                    cmd.Parameters.AddWithValue("from", route.From);
                    cmd.Parameters.AddWithValue("to", route.To);
                    cmd.Parameters.AddWithValue("op", route.Operator);
                    cmd.Parameters.AddWithValue("network", route.Network);
                    cmd.Parameters.AddWithValue("routeNumber", route.RouteNumber);
                    cmd.Parameters.AddWithValue("name", route.Name);
                    cmd.Parameters.AddWithValue("stopIds", stopIds);

                    long dbId = Convert.ToInt64(await cmd.ExecuteScalarAsync());
                    routeIdByIndex[ri] = dbId;

                    if (!routeDbIds.ContainsKey(route.RouteNumber))
                        routeDbIds[route.RouteNumber] = new List<long>();
                    routeDbIds[route.RouteNumber].Add(dbId);
                }

                foreach (var stop in stops)
                {
                    string routeInfoArray = BuildRouteInfoArray(stop.Routes, routes, routeIdByIndex);

                    string sql = $@"INSERT INTO {stopTable} 
                        (id, city_id, name, local_name, latitude, longitude, route_info) 
                        VALUES (@id, @cityId, @name, @localName, @lat, @lon, {routeInfoArray}::route_info[])
                        ON CONFLICT (id) DO UPDATE SET 
                            name = EXCLUDED.name, local_name = EXCLUDED.local_name,
                            latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
                            route_info = EXCLUDED.route_info";

                    using var cmd = new NpgsqlCommand(sql, conn, tx);
                    cmd.Parameters.AddWithValue("id", stop.Id);
                    cmd.Parameters.AddWithValue("cityId", cityId);
                    cmd.Parameters.AddWithValue("name", stop.Name);
                    cmd.Parameters.AddWithValue("localName", stop.LocalName ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("lat", stop.Latitude);
                    cmd.Parameters.AddWithValue("lon", stop.Longitude);
                    await cmd.ExecuteNonQueryAsync();
                }

                await tx.CommitAsync();
                FileLogger.Instance.Log($"    БД: записано {routes.Count} маршрутов, {stops.Count} остановок в {routeTable}/{stopTable}");
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                FileLogger.Instance.LogError($"    БД: ошибка записи {transportType}", ex);
                throw;
            }
        }

        /// <summary>
        /// Строит строковое представление route_info[] для SQL.
        /// </summary>
        private string BuildRouteInfoArray(List<Collectors.StopRouteRef> stopRoutes,
            List<Collectors.SurfaceRouteData> allRoutes, Dictionary<int, long> routeIdByIndex)
        {
            if (stopRoutes.Count == 0)
            {
                return "ARRAY[]";
            }

            var parts = new List<string>();
            foreach (var sr in stopRoutes)
            {
                int routeIndex = sr.RouteIndex;

                if (!routeIdByIndex.TryGetValue(routeIndex, out long dbRouteId)) continue;

                string escaped = sr.RouteNumber.Replace("'", "''");
                parts.Add($"ROW({dbRouteId}, '{escaped}', {sr.Order})::route_info");
            }

            if (parts.Count == 0)
            {
                return "ARRAY[]";
            }

            return $"ARRAY[{string.Join(", ", parts)}]";
        }

        public async Task WriteMetroAsync(int cityId,
            List<Collectors.MetroRouteData> routes, List<Collectors.MetroStationData> stations)
        {
            string cityName = _cityNames.TryGetValue(cityId, out string? cn) ? cn : $"city_{cityId}";
            await BackupTablesAsync(cityId, cityName, "metro_stations", "metro_lines");

            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();
            using var tx = await conn.BeginTransactionAsync();

            try
            {
                using (var cmd = new NpgsqlCommand("DELETE FROM metro_stations WHERE city_id = @cityId", conn, tx))
                {
                    cmd.Parameters.AddWithValue("cityId", cityId);
                    await cmd.ExecuteNonQueryAsync();
                }
                using (var cmd = new NpgsqlCommand("DELETE FROM metro_lines WHERE city_id = @cityId", conn, tx))
                {
                    cmd.Parameters.AddWithValue("cityId", cityId);
                    await cmd.ExecuteNonQueryAsync();
                }

                var lineGroups = routes.GroupBy(r => r.RouteNumber).ToList();
                var lineDbIds = new Dictionary<string, long>();

                foreach (var group in lineGroups)
                {
                    var lineRoutes = group.ToList();
                    var first = lineRoutes[0];

                    long[] forwardIds = first.Stops.Select(s => s.NodeId).ToArray();
                    long[] backwardIds = forwardIds.Reverse().ToArray();

                    string sql = @"INSERT INTO metro_lines 
                        (city_id, name, route_number, operator, color_code, station_ids_forward, station_ids_backward) 
                        VALUES (@cityId, @name, @routeNumber, @op, @color, @forward, @backward)
                        RETURNING id";

                    using var cmd = new NpgsqlCommand(sql, conn, tx);
                    cmd.Parameters.AddWithValue("cityId", cityId);
                    cmd.Parameters.AddWithValue("name", first.Name);
                    cmd.Parameters.AddWithValue("routeNumber", first.RouteNumber);
                    cmd.Parameters.AddWithValue("op", first.Operator);
                    cmd.Parameters.AddWithValue("color", first.Color);
                    cmd.Parameters.AddWithValue("forward", forwardIds);
                    cmd.Parameters.AddWithValue("backward", backwardIds);

                    long dbId = Convert.ToInt64(await cmd.ExecuteScalarAsync());
                    lineDbIds[first.RouteNumber] = dbId;
                }

                foreach (var station in stations)
                {
                    string lineInfoArray = BuildMetroLineInfoArray(station.Routes, lineDbIds);
                    string transfersArray = BuildMetroTransferArray(station.Transfers, lineDbIds);

                    string sql = $@"INSERT INTO metro_stations 
                        (id, city_id, name, local_name, latitude, longitude, is_transfer, line_info, transfers) 
                        VALUES (@id, @cityId, @name, @localName, @lat, @lon, @isTransfer, 
                                {lineInfoArray}::metro_line_info[], {transfersArray}::metro_transfer_info[])
                        ON CONFLICT (id) DO UPDATE SET 
                            name = EXCLUDED.name, local_name = EXCLUDED.local_name,
                            latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
                            is_transfer = EXCLUDED.is_transfer, line_info = EXCLUDED.line_info,
                            transfers = EXCLUDED.transfers";

                    using var cmd = new NpgsqlCommand(sql, conn, tx);
                    cmd.Parameters.AddWithValue("id", station.Id);
                    cmd.Parameters.AddWithValue("cityId", cityId);
                    cmd.Parameters.AddWithValue("name", station.Name);
                    cmd.Parameters.AddWithValue("localName", station.LocalName ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("lat", station.Latitude);
                    cmd.Parameters.AddWithValue("lon", station.Longitude);
                    cmd.Parameters.AddWithValue("isTransfer", station.IsTransfer);
                    await cmd.ExecuteNonQueryAsync();
                }

                await tx.CommitAsync();
                FileLogger.Instance.Log($"    БД: записано {lineGroups.Count} линий метро, {stations.Count} станций");
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                FileLogger.Instance.LogError($"    БД: ошибка записи метро", ex);
                throw;
            }
        }

        private string BuildMetroLineInfoArray(List<Collectors.MetroRouteRef> routes, Dictionary<string, long> lineDbIds)
        {
            if (routes == null || routes.Count == 0) return "ARRAY[]";

            var parts = new List<string>();
            foreach (var r in routes)
            {
                if (!lineDbIds.TryGetValue(r.RouteNumber, out long dbId))
                {
                    continue;
                }

                string rn = r.RouteNumber.Replace("'", "''");
                string color = r.Color.Replace("'", "''");
                parts.Add($"ROW({dbId}, '{rn}', '{color}', {r.Order})::metro_line_info");
            }

            if (parts.Count == 0) return "ARRAY[]";

            return $"ARRAY[{string.Join(", ", parts)}]";
        }

        private string BuildMetroTransferArray(List<Collectors.MetroTransferRef> transfers, Dictionary<string, long> lineDbIds)
        {
            if (transfers == null || transfers.Count == 0) return "ARRAY[]";

            var parts = new List<string>();
            foreach (var t in transfers)
            {
                ulong stationId = t.Key;
                foreach (var route in t.Value)
                {
                    if (!lineDbIds.TryGetValue(route.RouteNumber, out long dbId))
                    {
                        continue;
                    }

                    string rn = route.RouteNumber.Replace("'", "''");
                    string color = route.Color.Replace("'", "''");
                    parts.Add($"ROW({stationId}, {dbId}, '{rn}', '{color}', {route.Order})::metro_transfer_info");
                }
            }

            return parts.Count > 0
                ? $"ARRAY[{string.Join(", ", parts)}]"
                : "ARRAY[]";
        }

        public async Task WriteAttractionsAsync(int cityId, List<Collectors.AttractionData> attractions)
        {
            string cityName = _cityNames.TryGetValue(cityId, out string? cn) ? cn : $"city_{cityId}";
            await BackupTablesAsync(cityId, cityName, "attractions");

            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();
            using var tx = await conn.BeginTransactionAsync();

            try
            {
                using (var cmd = new NpgsqlCommand("DELETE FROM attractions WHERE city_id = @cityId", conn, tx))
                {
                    cmd.Parameters.AddWithValue("cityId", cityId);
                    await cmd.ExecuteNonQueryAsync();
                }

                foreach (var a in attractions)
                {
                    string sql = @"INSERT INTO attractions 
                        (id, city_id, name, latitude, longitude, category, subcategory, square, estimated_visit_minutes, tags)
                        VALUES (@id, @cityId, @name, @lat, @lon, @category, @subcategory, @square, @evm, @tags)
                        ON CONFLICT (id) DO UPDATE SET
                            name = EXCLUDED.name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
                            category = EXCLUDED.category, subcategory = EXCLUDED.subcategory,
                            square = EXCLUDED.square, estimated_visit_minutes = EXCLUDED.estimated_visit_minutes,
                            tags = EXCLUDED.tags";

                    using var cmd = new NpgsqlCommand(sql, conn, tx);
                    cmd.Parameters.AddWithValue("id", a.Id);
                    cmd.Parameters.AddWithValue("cityId", cityId);
                    cmd.Parameters.AddWithValue("name", a.Name);
                    cmd.Parameters.AddWithValue("lat", a.Latitude);
                    cmd.Parameters.AddWithValue("lon", a.Longitude);
                    cmd.Parameters.AddWithValue("category", a.Category);
                    cmd.Parameters.AddWithValue("subcategory", a.Subcategory ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("square", a.Square.HasValue ? (object)a.Square.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("evm", a.EstimatedVisitMinutes);
                    cmd.Parameters.AddWithValue("tags", a.Tags.ToArray());
                    await cmd.ExecuteNonQueryAsync();
                }

                await tx.CommitAsync();
                FileLogger.Instance.Log($"    БД: записано {attractions.Count} достопримечательностей");
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                FileLogger.Instance.LogError($"    БД: ошибка записи достопримечательностей", ex);
                throw;
            }
        }
    }
}