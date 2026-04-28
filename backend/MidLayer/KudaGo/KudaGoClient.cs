using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using DomainLib.Attractions;

namespace MidLayer.KudaGo
{
    /// <summary>
    /// HTTP-клиент для KudaGo Public API.
    /// Запрашивает актуальные события по городу и категориям,
    /// парсит ответ и возвращает список Event (IAttraction).
    /// 
    /// API: https://kudago.com/public-api/v1.4/events/
    /// Параметры: location (slug города), actual_since (unix timestamp),
    /// categories (через запятую), fields, expand=place (раскрывает координаты), page_size.
    /// </summary>
    public class KudaGoClient : IDisposable
    {
        private readonly HttpClient _http;
        private const string BaseUrl = "https://kudago.com/public-api/v1.4";
        private const int PageSize = 50;

        /// <summary>
        /// Маппинг названий городов (как в нашей БД) в slug-и KudaGo.
        /// Источник: https://kudago.com/public-api/v1.4/locations/
        /// </summary>
        private static readonly Dictionary<string, string> CityToSlug = new(StringComparer.OrdinalIgnoreCase)
        {
            { "Москва", "msk" },
            { "Санкт-Петербург", "spb" },
            { "Новосибирск", "nsk" },
            { "Екатеринбург", "ekb" },
            { "Нижний Новгород", "nnv" },
            { "Казань", "kzn" },
            { "Самара", "smr" },
            { "Краснодар", "krd" },
            { "Сочи", "sochi" },
            { "Уфа", "ufa" },
            { "Красноярск", "krasnoyarsk" },
            { "Выборг", "vbg" }
        };

        /// <summary>
        /// Маппинг наших доменных категорий событий (EventCategory) в категории KudaGo API.
        /// </summary>
        private static readonly Dictionary<string, string> CategoryToKudaGo = new()
        {
            { EventCategory.Film, "cinema" },
            { EventCategory.Exhibition, "exhibition" },
            { EventCategory.Concert, "concert" },
            { EventCategory.Festival, "festival" },
            { EventCategory.Fair, "yarmarki-razvlecheniya-yarmarki" },
            { EventCategory.BusinessEvent, "business-events" },
            { EventCategory.ChildrenEvent, "kids" },
            { EventCategory.CharityEvent, "social-activity" },
        };

        /// <summary>
        /// Базовое время посещения по категории события (минуты).
        /// </summary>
        private static readonly Dictionary<string, int> EventVisitTimes = new()
        {
            { EventCategory.Film, 120 },
            { EventCategory.Exhibition, 80 },
            { EventCategory.Concert, 120 },
            { EventCategory.Festival, 120 },
            { EventCategory.Fair, 90 },
            { EventCategory.BusinessEvent, 100 },
            { EventCategory.ChildrenEvent, 80 },
            { EventCategory.CharityEvent, 60 },
        };

        public KudaGoClient()
        {
            _http = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(15),
                DefaultRequestHeaders = { { "User-Agent", "InCity/1.0" } }
            };
        }

        /// <summary>
        /// Проверяет, поддерживается ли город в KudaGo.
        /// </summary>
        public static bool IsCitySupported(string cityName)
        {
            return CityToSlug.ContainsKey(cityName);
        }

        /// <summary>
        /// Получает актуальные события для города по указанным категориям.
        /// Возвращает пустой список если город не поддерживается, категории пусты,
        /// или KudaGo API недоступен.
        /// </summary>
        public async Task<List<Event>> FetchEventsAsync(string cityName, string[] eventCategories)
        {
            if (eventCategories.Length == 0)
            {
                return new List<Event>();
            }

            if (!CityToSlug.TryGetValue(cityName, out string? slug))
            {
                return new List<Event>();
            }

            List<string> kudaGoCategories = new();
            foreach (string cat in eventCategories)
            {
                if (CategoryToKudaGo.TryGetValue(cat, out string? kgCat))
                {
                    kudaGoCategories.Add(kgCat);
                }
            }

            if (kudaGoCategories.Count == 0)
            {
                return new List<Event>();
            }

            long actualSince = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            string categoriesParam = string.Join(",", kudaGoCategories);

            string url = $"{BaseUrl}/events/?location={slug}" +
                         $"&actual_since={actualSince}" +
                         $"&categories={categoriesParam}" +
                         $"&fields=id,title,place,categories" +
                         $"&expand=place" +
                         $"&page_size={PageSize}" +
                         $"&order_by=-publication_date";

            try
            {
                string json = await _http.GetStringAsync(url);
                return ParseEvents(json, eventCategories);
            }
            catch (Exception)
            {
                return new List<Event>();
            }
        }

        /// <summary>
        /// Парсит JSON-ответ KudaGo API и возвращает список Event.
        /// 
        /// Структура ответа:
        /// {
        ///   "count": 123,
        ///   "next": "...",
        ///   "results": [
        ///     {
        ///       "id": 12345,
        ///       "title": "Название события",
        ///       "place": {
        ///         "id": 678,
        ///         "title": "Название места",
        ///         "coords": { "lat": 55.751244, "lon": 37.618423 }
        ///       },
        ///       "categories": ["concert", "festival"]
        ///     }
        ///   ]
        /// }
        /// </summary>
        private List<Event> ParseEvents(string json, string[] requestedCategories)
        {
            var events = new List<Event>();

            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (!root.TryGetProperty("results", out var results))
                {
                    return events;
                }

                foreach (var item in results.EnumerateArray())
                {
                    try
                    {
                        long id = item.GetProperty("id").GetInt64();
                        string title = item.GetProperty("title").GetString() ?? "";

                        if (string.IsNullOrWhiteSpace(title))
                        {
                            continue;
                        }

                        // place может быть null если событие онлайн или место не указано
                        if (!item.TryGetProperty("place", out var place) || place.ValueKind == JsonValueKind.Null)
                        {
                            continue;
                        }

                        if (!place.TryGetProperty("coords", out var coords) || coords.ValueKind == JsonValueKind.Null)
                        {
                            continue;
                        }

                        if (!coords.TryGetProperty("lat", out var latEl) || !coords.TryGetProperty("lon", out var lonEl))
                        {
                            continue;
                        }

                        if (latEl.ValueKind == JsonValueKind.Null || lonEl.ValueKind == JsonValueKind.Null)
                        {
                            continue;
                        }

                        double lat = latEl.GetDouble();
                        double lon = lonEl.GetDouble();

                        if (lat == 0 && lon == 0)
                        {
                            continue;
                        }

                        string category = DetermineCategory(item, requestedCategories);
                        int visitMinutes = EventVisitTimes.TryGetValue(category, out int vt) ? vt : 90;

                        events.Add(new Event((ulong)id, title, lat, lon, category, visitMinutes));
                    }
                    catch
                    {
                        continue;
                    }
                }
            }
            catch
            {
                // Ошибка парсинга - возвращаем что удалось
            }

            return events;
        }

        /// <summary>
        /// Определяет доменную категорию на основе массива categories из KudaGo
        /// через обратный маппинг.
        /// </summary>
        private string DetermineCategory(JsonElement item, string[] requestedCategories)
        {
            if (!item.TryGetProperty("categories", out var cats) || cats.ValueKind != JsonValueKind.Array)
            {
                return requestedCategories.Length > 0 ? requestedCategories[0] : EventCategory.Exhibition;
            }

            foreach (var catEl in cats.EnumerateArray())
            {
                string? kgCat = catEl.GetString();
                if (kgCat == null) continue;

                foreach (var kvp in CategoryToKudaGo)
                {
                    if (kvp.Value == kgCat && requestedCategories.Contains(kvp.Key))
                    {
                        return kvp.Key;
                    }
                }
            }

            return requestedCategories.Length > 0 ? requestedCategories[0] : EventCategory.Exhibition;
        }

        public void Dispose()
        {
            _http.Dispose();
        }
    }
}