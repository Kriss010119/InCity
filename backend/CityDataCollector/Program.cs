using System;
using System.Text;
using System.Threading.Tasks;
using CityDataCollector.Infrastructure;
using CityDataCollector.Collectors;

namespace CityDataCollector
{
    public class Program
    {
        /// <summary>
        /// Топ-30 по населению + топ-30 туристических городов России.
        /// </summary>
        private static readonly string[] Cities =
        {
            // Топ 30 по населению
            "Москва"
            // ,"Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
            //"Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону",
            //"Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград",
            //"Краснодар", "Саратов", "Тюмень", "Тольятти", "Ижевск",
            //"Барнаул", "Ульяновск", "Иркутск", "Хабаровск", "Ярославль",
            //"Владивосток", "Махачкала", "Томск", "Оренбург", "Кемерово",
            ////Туристические города
            //"Калининград", "Сочи", "Великий Новгород", "Суздаль", "Владимир",
            //"Псков", "Кострома", "Мурманск", "Петрозаводск", "Смоленск",
            //"Тула", "Рязань", "Тверь", "Вологда", "Архангельск",
            //"Выборг", "Сергиев Посад", "Переславль-Залесский", "Плёс", "Йошкар-Ола"
        };

        public static async Task Main()
        {
            Console.OutputEncoding = Encoding.UTF8;

            FileLogger.Initialize();
            FileLogger.Instance.Log("Начало работы сборщика данных");
            FileLogger.Instance.Log($"Городов в списке: {Cities.Length}");

            using var client = new OverpassClient();

            int completed = 0;
            int failed = 0;

            foreach (string city in Cities)
            {
                try
                {
                    await CollectCityDataAsync(client, city);
                    completed++;
                }
                catch (Exception ex)
                {
                    FileLogger.Instance.LogError($"Критическая ошибка при обработке {city}", ex);
                    failed++;
                }
            }

            FileLogger.Instance.Log($"=== Работа завершена. Обработано: {completed}, ошибок: {failed} ===");
        }

        private static async Task CollectCityDataAsync(OverpassClient client, string cityName)
        {
            FileLogger.Instance.Log($"=== Начало сбора данных для {cityName} ===");

            string cityNameEn = Transliterator.ToLatin(cityName);
            string cityFolder = Path.Combine("data", cityNameEn);
            Directory.CreateDirectory(cityFolder);

            // 1. Автобусы
            try
            {
                var busCollector = new SurfaceTransportCollector(client, SurfaceTransportType.Bus);
                var busResult = await busCollector.CollectAsync(cityName);

                if (busResult.Routes.Count > 0)
                {
                    await JsonStorage.SaveAsync(busResult.Routes, Path.Combine(cityFolder, $"bus_routes_{cityNameEn}.json"));
                    await JsonStorage.SaveAsync(busResult.Stops, Path.Combine(cityFolder, $"bus_stops_{cityNameEn}.json"));
                }
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError($"Ошибка сбора автобусов для {cityName}", ex);
            }

            // 2. Трамваи
            try
            {
                var tramCollector = new SurfaceTransportCollector(client, SurfaceTransportType.Tram);
                var tramResult = await tramCollector.CollectAsync(cityName);

                if (tramResult.Routes.Count > 0)
                {
                    await JsonStorage.SaveAsync(tramResult.Routes, Path.Combine(cityFolder, $"tram_routes_{cityNameEn}.json"));
                    await JsonStorage.SaveAsync(tramResult.Stops, Path.Combine(cityFolder, $"tram_stops_{cityNameEn}.json"));
                }
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError($"Ошибка сбора трамваев для {cityName}", ex);
            }

            // 3. Троллейбусы
            try
            {
                var trolleybusCollector = new SurfaceTransportCollector(client, SurfaceTransportType.Trolleybus);
                var trolleybusResult = await trolleybusCollector.CollectAsync(cityName);

                if (trolleybusResult.Routes.Count > 0)
                {
                    await JsonStorage.SaveAsync(trolleybusResult.Routes, Path.Combine(cityFolder, $"trolleybus_routes_{cityNameEn}.json"));
                    await JsonStorage.SaveAsync(trolleybusResult.Stops, Path.Combine(cityFolder, $"trolleybus_stops_{cityNameEn}.json"));
                }
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError($"Ошибка сбора троллейбусов для {cityName}", ex);
            }

            // 4. Метро
            try
            {
                var metroCollector = new MetroCollector(client);
                var metroResult = await metroCollector.CollectAsync(cityName);

                if (metroResult.Routes.Count > 0)
                {
                    await JsonStorage.SaveAsync(metroResult.Routes, Path.Combine(cityFolder, $"metro_routes_{cityNameEn}.json"));
                    await JsonStorage.SaveAsync(metroResult.Stations, Path.Combine(cityFolder, $"metro_stations_{cityNameEn}.json"));
                }
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError($"Ошибка сбора метро для {cityName}", ex);
            }

            // 5. Достопримечательности
            try
            {
                var attractionsCollector = new AttractionsCollector(client);
                var attractionsResult = await attractionsCollector.CollectAsync(cityName, cityNameEn);

                foreach (var (fileName, attractions) in attractionsResult)
                {
                    await JsonStorage.SaveAsync(attractions, Path.Combine(cityFolder, fileName));
                }
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError($"Ошибка сбора достопримечательностей для {cityName}", ex);
            }

            FileLogger.Instance.Log($"=== Сбор данных для {cityName} завершён ===");
        }
    }
}