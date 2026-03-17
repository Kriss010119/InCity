using System;

namespace TopLayer.Repositories
{
    /// <summary>
    /// Вспомогательные методы для SQL-запросов: вычисление ограничивающего прямоугольника координат
    /// для предварительной фильтрации перед формулой гаверсинусов.
    /// </summary>
    internal static class DbHelper
    {
        private const double EarthRadiusMeters = 6371000.0;

        /// <summary>
        /// Вычисляет границы прямоугольника по координатам и радиусу в метрах.
        /// </summary>
        public static (double minLat, double maxLat, double minLon, double maxLon) GetBoundingBox(double lat, double lon, int radiusMeters)
        {
            double latDelta = (radiusMeters / EarthRadiusMeters) * (180.0 / Math.PI);
            double lonDelta = latDelta / Math.Cos(lat * Math.PI / 180.0);

            return (lat - latDelta, lat + latDelta, lon - lonDelta, lon + lonDelta);
        }

        /// <summary>
        /// SQL-фрагмент формулы гаверсинусов для фильтрации по расстоянию.
        /// Используется после предварительной фильтрации по прямоугольнику.
        /// </summary>
        public const string HaversineSql = @"
            (6371000 * 2 * ASIN(SQRT(
                POWER(SIN(RADIANS(latitude - @lat) / 2), 2) +
                COS(RADIANS(@lat)) * COS(RADIANS(latitude)) *
                POWER(SIN(RADIANS(longitude - @lon) / 2), 2)
            ))) <= @radius";

        /// <summary>
        /// SQL-фрагмент предварительной фильтрации по прямоугольнику координат.
        /// </summary>
        public const string BoundingBoxSql = @"
            latitude BETWEEN @minLat AND @maxLat
            AND longitude BETWEEN @minLon AND @maxLon";
    }
}