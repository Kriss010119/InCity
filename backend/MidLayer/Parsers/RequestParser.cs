using System;
using System.Collections.Generic;
using RoutePlanning.Service;
using MidLayer.Mapping;

namespace MidLayer.Parsers
{
    /// <summary>
    /// Парсер входящих запросов: преобразует параметры query string в доменные объекты.
    /// </summary>
    public static class RequestParser
    {
        public static int ParseDuration(string duration)
        {
            if (FrontendKeyMap.DurationMap.TryGetValue(duration, out int minutes))
            {
                return minutes;
            }

            return 300;
        }

        public static TransportFilter ParseTransportFilter(string transportCsv)
        {
            if (string.IsNullOrWhiteSpace(transportCsv))
            {
                return new TransportFilter(true, true, true, true);
            }

            string[] keys = transportCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            bool buses = false;
            bool trams = false;
            bool trolleybuses = false;
            bool metro = false;

            foreach (string key in keys)
            {
                switch (key)
                {
                    case "bus":
                        buses = true;
                        break;
                    case "tram":
                        trams = true;
                        break;
                    case "trolleybus":
                        trolleybuses = true;
                        break;
                    case "metro":
                        metro = true;
                        break;
                }
            }

            if (!buses && !trams && !trolleybuses && !metro)
            {
                return new TransportFilter(true, true, true, true);
            }

            return new TransportFilter(buses, trams, trolleybuses, metro);
        }

        public static AttractionFilter ParseAttractionFilter(string attractionsCsv, string subattractionsCsv)
        {
            List<string> categories = new List<string>();
            List<string> subcategories = new List<string>();

            if (!string.IsNullOrWhiteSpace(attractionsCsv))
            {
                string[] keys = attractionsCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                foreach (string key in keys)
                {
                    if (FrontendKeyMap.CategoryMap.TryGetValue(key, out string? category))
                    {
                        categories.Add(category);
                    }
                }
            }

            // Если фильтры не указаны — все категории включены
            if (categories.Count == 0)
            {
                categories.AddRange(FrontendKeyMap.CategoryMap.Values);
            }

            if (!string.IsNullOrWhiteSpace(subattractionsCsv))
            {
                string[] keys = subattractionsCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                foreach (string key in keys)
                {
                    if (FrontendKeyMap.SubcategoryMap.TryGetValue(key, out string? subcategory))
                    {
                        subcategories.Add(subcategory);
                    }
                }
            }

            if (subcategories.Count == 0)
            {
                subcategories.AddRange(FrontendKeyMap.SubcategoryMap.Values);
            }

            return new AttractionFilter([.. categories], [.. subcategories]);
        }

        public static string[] ParseEventCategories(string eventsCsv)
        {
            List<string> result = new List<string>();

            if (!string.IsNullOrWhiteSpace(eventsCsv))
            {
                string[] keys = eventsCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                foreach (string key in keys)
                {
                    if (FrontendKeyMap.EventCategoryMap.TryGetValue(key, out string? category))
                    {
                        result.Add(category);
                    }
                }
            }

            return [.. result];
        }
    }
}