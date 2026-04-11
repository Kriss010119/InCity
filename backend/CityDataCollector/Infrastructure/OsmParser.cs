using System;
using System.Collections.Generic;
using System.Text.Json;

namespace CityDataCollector.Infrastructure
{
    /// <summary>
    /// Общие утилиты парсинга OSM JSON ответов.
    /// </summary>
    public static class OsmParser
    {
        public static string GetTag(JsonElement tags, string tagName)
        {
            try
            {
                if (tags.TryGetProperty(tagName, out var tag))
                    return tag.GetString() ?? "";
            }
            catch { }
            return "";
        }

        public static List<string> CollectAllTags(JsonElement tags)
        {
            var list = new List<string>();
            foreach (var prop in tags.EnumerateObject())
            {
                list.Add($"{prop.Name}={prop.Value.GetString()}");
            }
            return list;
        }

        /// <summary>
        /// Получает координаты центра для way/relation элемента.
        /// Приоритет: center > bounds > geometry > members.
        /// </summary>
        public static (double lat, double lon) GetCenterCoordinates(JsonElement element)
        {
            if (element.TryGetProperty("center", out var center))
            {
                return (center.GetProperty("lat").GetDouble(), center.GetProperty("lon").GetDouble());
            }

            if (element.TryGetProperty("bounds", out var bounds))
            {
                double minLat = bounds.GetProperty("minlat").GetDouble();
                double maxLat = bounds.GetProperty("maxlat").GetDouble();
                double minLon = bounds.GetProperty("minlon").GetDouble();
                double maxLon = bounds.GetProperty("maxlon").GetDouble();
                return ((minLat + maxLat) / 2, (minLon + maxLon) / 2);
            }

            if (element.TryGetProperty("geometry", out var geometry) && geometry.GetArrayLength() > 0)
            {
                var first = geometry[0];
                return (first.GetProperty("lat").GetDouble(), first.GetProperty("lon").GetDouble());
            }

            if (element.TryGetProperty("members", out var members))
            {
                foreach (var m in members.EnumerateArray())
                {
                    if (m.TryGetProperty("lat", out var lat) && m.TryGetProperty("lon", out var lon))
                    {
                        return (lat.GetDouble(), lon.GetDouble());
                    }
                }
            }

            return (0, 0);
        }

        /// <summary>
        /// Вычисляет площадь по bounds или geometry в квадратных метрах.
        /// </summary>
        public static double? CalculateArea(JsonElement element)
        {
            try
            {
                if (element.TryGetProperty("tags", out var tags))
                {
                    string areaStr = GetTag(tags, "area");
                    if (string.IsNullOrEmpty(areaStr)) areaStr = GetTag(tags, "building:area");
                    if (!string.IsNullOrEmpty(areaStr))
                    {
                        areaStr = areaStr.Replace(" ", "").Replace("m²", "").Replace("sqm", "").Trim();
                        if (double.TryParse(areaStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out double a))
                            return a;
                    }
                }

                if (element.TryGetProperty("bounds", out var bounds))
                {
                    return CalculateBoundsArea(bounds);
                }

                if (element.TryGetProperty("geometry", out var geometry) && geometry.GetArrayLength() > 2)
                {
                    return CalculatePolygonArea(geometry);
                }
            }
            catch { }

            return null;
        }

        private static double CalculateBoundsArea(JsonElement bounds)
        {
            double minLat = bounds.GetProperty("minlat").GetDouble();
            double maxLat = bounds.GetProperty("maxlat").GetDouble();
            double minLon = bounds.GetProperty("minlon").GetDouble();
            double maxLon = bounds.GetProperty("maxlon").GetDouble();

            double avgLat = (minLat + maxLat) / 2 * Math.PI / 180;
            double width = (maxLon - minLon) * 111320 * Math.Cos(avgLat);
            double height = (maxLat - minLat) * 111320;

            return Math.Abs(width * height);
        }

        private static double CalculatePolygonArea(JsonElement geometry)
        {
            var points = new List<(double lat, double lon)>();

            foreach (var point in geometry.EnumerateArray())
            {
                if (point.TryGetProperty("lat", out var lat) && point.TryGetProperty("lon", out var lon))
                    points.Add((lat.GetDouble(), lon.GetDouble()));
            }

            if (points.Count < 3) return 0;

            double area = 0;
            for (int i = 0; i < points.Count; i++)
            {
                var p1 = points[i];
                var p2 = points[(i + 1) % points.Count];
                area += (p2.lon - p1.lon) * (Math.PI / 180) *
                        (2 + Math.Sin(p1.lat * Math.PI / 180) + Math.Sin(p2.lat * Math.PI / 180));
            }

            return Math.Abs(area * 6371000 * 6371000 / 2);
        }

        /// <summary>
        /// Расстояние между двумя точками в метрах (формула гаверсинусов).
        /// </summary>
        public static double DistanceMeters(double lat1, double lon1, double lat2, double lon2)
        {
            double dLat = (lat2 - lat1) * Math.PI / 180;
            double dLon = (lon2 - lon1) * Math.PI / 180;
            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            return 6371000 * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        }
    }
}