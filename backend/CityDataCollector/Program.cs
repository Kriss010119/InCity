using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using CityDataCollector.Infrastructure;
using CityDataCollector.Collectors;
using CityDataCollector.Database;

namespace CityDataCollector
{
    public class Program
    {
        private static readonly string[] Cities =
        {
            "Москва",
            "Санкт-Петербург",
            "Новосибирск", "Екатеринбург", "Казань",
            "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону",
            "Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград",
            "Краснодар", "Саратов", "Тюмень", "Тольятти", "Ижевск",
            "Барнаул", "Ульяновск", "Иркутск", "Хабаровск", "Ярославль",
            "Владивосток", "Махачкала", "Томск", "Оренбург", "Кемерово",
            "Калининград", "Сочи", "Великий Новгород", "Суздаль", "Владимир",
            "Псков", "Кострома", "Мурманск", "Петрозаводск", "Смоленск",
            "Тула", 
            //"Рязань", 
            "Тверь", "Вологда", "Архангельск",
            "Выборг", "Сергиев Посад", "Переславль-Залесский", "Плёс", "Йошкар-Ола"
        };

        private const string DefaultConnectionString = "Host=127.0.0.1;Port=5433;Database=route_planner;Username=postgres;Password=postgres";
        private const string DefaultOutputDir = "data";

        public static async Task Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            FileLogger.Initialize();

            // Определяем режим работы
            string mode = GetArgValue(args, "--mode") ?? "db";
            string? singleCity = GetArgValue(args, "--city");

            string[] citiesToProcess = singleCity != null
                ? new[] { singleCity }
                : Cities;

            FileLogger.Instance.Log("=== Начало работы сборщика данных ===");
            FileLogger.Instance.Log($"Режим: {mode}");
            FileLogger.Instance.Log($"Городов: {citiesToProcess.Length}");

            using var osmClient = new OverpassClient();
            int completed = 0;
            int failed = 0;

            if (mode == "json")
            {
                string outputDir = GetArgValue(args, "--output") ?? DefaultOutputDir;
                FileLogger.Instance.Log($"Папка вывода: {Path.GetFullPath(outputDir)}");

                foreach (string city in citiesToProcess)
                {
                    try
                    {
                        await CollectCityToJsonAsync(osmClient, city, outputDir);
                        completed++;
                    }
                    catch (Exception ex)
                    {
                        FileLogger.Instance.LogError($"Критическая ошибка при обработке {city}", ex);
                        failed++;
                    }
                }
            }
            else if (mode == "db")
            {
                string connectionString = GetConnectionString(args);
                FileLogger.Instance.Log($"БД: {connectionString.Split(';')[0]}");

                string backupDir = GetArgValue(args, "--backup-dir") ?? "backups";
                var dbWriter = new DatabaseWriter(connectionString);
                dbWriter.SetBackupDirectory(backupDir);

                foreach (string city in citiesToProcess)
                {
                    try
                    {
                        await CollectCityToDbAsync(osmClient, dbWriter, city);
                        completed++;
                    }
                    catch (Exception ex)
                    {
                        FileLogger.Instance.LogError($"Критическая ошибка при обработке {city}", ex);
                        failed++;
                    }
                }
            }
            else
            {
                Console.WriteLine("Неизвестный режим. Используйте --mode db или --mode json");
                Console.WriteLine();
                PrintHelp();
                return;
            }

            FileLogger.Instance.Log($"=== Завершено. Успешно: {completed}, ошибок: {failed} ===");
        }

        // ==================== РЕЖИМ JSON ====================

        private static async Task CollectCityToJsonAsync(OverpassClient client, string cityName, string outputDir)
        {
            FileLogger.Instance.Log($"=== {cityName}: сбор данных (JSON) ===");

            string cityNameEn = Transliterator.ToLatin(cityName);
            string cityDir = Path.Combine(outputDir, cityNameEn);
            Directory.CreateDirectory(cityDir);

            // Автобусы
            try
            {
                var collector = new SurfaceTransportCollector(client, SurfaceTransportType.Bus);
                var result = await collector.CollectAsync(cityName);
                if (result.Routes.Count > 0)
                {
                    await JsonStorage.SaveAsync(result.Routes, Path.Combine(cityDir, $"bus_routes_{cityNameEn}.json"));
                    await JsonStorage.SaveAsync(result.Stops, Path.Combine(cityDir, $"bus_stops_{cityNameEn}.json"));
                }
            }
            catch (Exception ex) { FileLogger.Instance.LogError($"  Ошибка сбора автобусов", ex); }

            // Трамваи
            try
            {
                var collector = new SurfaceTransportCollector(client, SurfaceTransportType.Tram);
                var result = await collector.CollectAsync(cityName);
                if (result.Routes.Count > 0)
                {
                    await JsonStorage.SaveAsync(result.Routes, Path.Combine(cityDir, $"tram_routes_{cityNameEn}.json"));
                    await JsonStorage.SaveAsync(result.Stops, Path.Combine(cityDir, $"tram_stops_{cityNameEn}.json"));
                }
            }
            catch (Exception ex) { FileLogger.Instance.LogError($"  Ошибка сбора трамваев", ex); }

            // Троллейбусы
            try
            {
                var collector = new SurfaceTransportCollector(client, SurfaceTransportType.Trolleybus);
                var result = await collector.CollectAsync(cityName);
                if (result.Routes.Count > 0)
                {
                    await JsonStorage.SaveAsync(result.Routes, Path.Combine(cityDir, $"trolleybus_routes_{cityNameEn}.json"));
                    await JsonStorage.SaveAsync(result.Stops, Path.Combine(cityDir, $"trolleybus_stops_{cityNameEn}.json"));
                }
            }
            catch (Exception ex) { FileLogger.Instance.LogError($"  Ошибка сбора троллейбусов", ex); }

            // Метро
            try
            {
                var collector = new MetroCollector(client);
                var result = await collector.CollectAsync(cityName);
                if (result.Routes.Count > 0)
                {
                    await JsonStorage.SaveAsync(result.Routes, Path.Combine(cityDir, $"metro_routes_{cityNameEn}.json"));
                    await JsonStorage.SaveAsync(result.Stations, Path.Combine(cityDir, $"metro_stations_{cityNameEn}.json"));
                }
            }
            catch (Exception ex) { FileLogger.Instance.LogError($"  Ошибка сбора метро", ex); }

            // Достопримечательности
            try
            {
                var collector = new AttractionsCollector(client);
                var results = await collector.CollectAsync(cityName, cityNameEn);
                foreach (var (fileName, attractions) in results)
                {
                    if (attractions.Count > 0)
                    {
                        await JsonStorage.SaveAsync(attractions, Path.Combine(cityDir, fileName));
                    }
                }
            }
            catch (Exception ex) { FileLogger.Instance.LogError($"  Ошибка сбора достопримечательностей", ex); }

            FileLogger.Instance.Log($"=== {cityName}: сбор завершён ===");
        }

        // ==================== РЕЖИМ БД ====================

        private static async Task CollectCityToDbAsync(OverpassClient client, DatabaseWriter dbWriter, string cityName)
        {
            FileLogger.Instance.Log($"=== {cityName}: сбор данных (БД) ===");

            int cityId = await dbWriter.EnsureCityAsync(cityName);
            FileLogger.Instance.Log($"  city_id = {cityId}");

            // Автобусы
            try
            {
                var collector = new SurfaceTransportCollector(client, SurfaceTransportType.Bus);
                var result = await collector.CollectAsync(cityName);
                if (result.Routes.Count > 0)
                    await dbWriter.WriteSurfaceTransportAsync(cityId, "bus", result.Routes, result.Stops);
                else
                    FileLogger.Instance.Log($"  Автобусы: пусто, БД не обновляется");
            }
            catch (Exception ex) { FileLogger.Instance.LogError($"  Ошибка автобусов", ex); }

            // Трамваи
            try
            {
                var collector = new SurfaceTransportCollector(client, SurfaceTransportType.Tram);
                var result = await collector.CollectAsync(cityName);
                if (result.Routes.Count > 0)
                    await dbWriter.WriteSurfaceTransportAsync(cityId, "tram", result.Routes, result.Stops);
                else
                    FileLogger.Instance.Log($"  Трамваи: пусто, БД не обновляется");
            }
            catch (Exception ex) { FileLogger.Instance.LogError($"  Ошибка трамваев", ex); }

            // Троллейбусы
            try
            {
                var collector = new SurfaceTransportCollector(client, SurfaceTransportType.Trolleybus);
                var result = await collector.CollectAsync(cityName);
                if (result.Routes.Count > 0)
                    await dbWriter.WriteSurfaceTransportAsync(cityId, "trolleybus", result.Routes, result.Stops);
                else
                    FileLogger.Instance.Log($"  Троллейбусы: пусто, БД не обновляется");
            }
            catch (Exception ex) { FileLogger.Instance.LogError($"  Ошибка троллейбусов", ex); }

            // Метро
            try
            {
                var collector = new MetroCollector(client);
                var result = await collector.CollectAsync(cityName);
                if (result.Routes.Count > 0)
                    await dbWriter.WriteMetroAsync(cityId, result.Routes, result.Stations);
                else
                    FileLogger.Instance.Log($"  Метро: пусто, БД не обновляется");
            }
            catch (Exception ex) { FileLogger.Instance.LogError($"  Ошибка метро", ex); }

            // Достопримечательности
            try
            {
                var collector = new AttractionsCollector(client);
                string cityNameEn = Transliterator.ToLatin(cityName);
                var results = await collector.CollectAsync(cityName, cityNameEn);

                List<AttractionData> all = new();
                foreach (var (_, attractions) in results)
                    all.AddRange(attractions);

                if (all.Count > 0)
                    await dbWriter.WriteAttractionsAsync(cityId, all);
                else
                    FileLogger.Instance.Log($"  Достопримечательности: пусто, БД не обновляется");
            }
            catch (Exception ex) { FileLogger.Instance.LogError($"  Ошибка достопримечательностей", ex); }

            FileLogger.Instance.Log($"=== {cityName}: сбор завершён ===");
        }

        // ==================== УТИЛИТЫ ====================

        private static string GetConnectionString(string[] args)
        {
            string? fromArgs = GetArgValue(args, "--connection-string");
            if (!string.IsNullOrEmpty(fromArgs)) return fromArgs;

            string? fromEnv = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
            if (!string.IsNullOrEmpty(fromEnv)) return fromEnv;

            return DefaultConnectionString;
        }

        private static string? GetArgValue(string[] args, string key)
        {
            for (int i = 0; i < args.Length - 1; i++)
            {
                if (args[i] == key)
                    return args[i + 1];
            }
            return null;
        }

        private static void PrintHelp()
        {
            Console.WriteLine("Использование: dotnet run --project CityDataCollector -- [параметры]");
            Console.WriteLine();
            Console.WriteLine("Параметры:");
            Console.WriteLine("  --mode db|json              Режим работы (по умолчанию: db)");
            Console.WriteLine("  --city \"Название\"           Собрать данные только для одного города");
            Console.WriteLine();
            Console.WriteLine("Параметры режима db:");
            Console.WriteLine("  --connection-string \"...\"   Строка подключения к PostgreSQL");
            Console.WriteLine("  --backup-dir путь           Папка для бэкапов (по умолчанию: backups)");
            Console.WriteLine();
            Console.WriteLine("Параметры режима json:");
            Console.WriteLine("  --output путь               Папка для JSON-файлов (по умолчанию: data)");
            Console.WriteLine();
            Console.WriteLine("Примеры:");
            Console.WriteLine("  dotnet run -- --mode db --city \"Москва\"");
            Console.WriteLine("  dotnet run -- --mode json --city \"Рязань\" --output ./data");
            Console.WriteLine("  dotnet run -- --mode db --connection-string \"Host=localhost;Port=5432;Database=incity;Username=incity;Password=incity\"");
            Console.WriteLine("  dotnet run -- --mode json");
        }
    }
}