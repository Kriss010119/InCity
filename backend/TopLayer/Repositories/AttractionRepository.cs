using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using DomainLib.Interfaces;
using DomainLib.Attractions;
using MidLayer.DataAccess;

namespace TopLayer.Repositories
{
    internal class AttractionRepository : IAttractionRepository
    {
        private readonly string _connectionString;

        public AttractionRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        public async Task<IEnumerable<IAttraction>> GetAttractionsAsync(double latitude, double longitude, int radiusMeters,
            string[] categories, string[] subcategories)
        {
            var box = DbHelper.GetBoundingBox(latitude, longitude, radiusMeters);

            string categorySql = categories.Length > 0 ? "AND category = ANY(@categories)" : "";
            string subcategorySql = subcategories.Length > 0 ? "AND subcategory = ANY(@subcategories)" : "";

            string sql = $@"
                SELECT id, name, latitude, longitude, category, subcategory, 
                       square, estimated_visit_minutes, tags::text as tags_text
                FROM attractions
                WHERE {DbHelper.BoundingBoxSql}
                AND {DbHelper.HaversineSql}
                {categorySql}
                {subcategorySql}";

            using var connection = new NpgsqlConnection(_connectionString);

            var rows = await connection.QueryAsync(sql, new
            {
                lat = latitude,
                lon = longitude,
                radius = radiusMeters,
                minLat = box.minLat,
                maxLat = box.maxLat,
                minLon = box.minLon,
                maxLon = box.maxLon,
                categories = categories,
                subcategories = subcategories
            });

            List<IAttraction> result = new List<IAttraction>();

            foreach (var row in rows)
            {
                List<string> tagList = ParseTextArray((string?)row.tags_text);

                result.Add(new Attraction(
                    (ulong)(long)row.id,
                    (string?)row.name,
                    (double)(decimal)row.latitude,
                    (double)(decimal)row.longitude,
                    (string?)row.category,
                    (string?)row.subcategory,
                    row.square != null ? (double?)(decimal)row.square : null,
                    (int)(row.estimated_visit_minutes ?? 30),
                    tagList
                ));
            }

            return result;
        }

        private static List<string> ParseTextArray(string? text)
        {
            List<string> result = new List<string>();
            if (string.IsNullOrEmpty(text) || text == "{}") return result;

            string inner = text.TrimStart('{').TrimEnd('}');
            if (string.IsNullOrEmpty(inner)) return result;

            bool inQuotes = false;
            int start = 0;

            for (int i = 0; i <= inner.Length; i++)
            {
                if (i == inner.Length || (inner[i] == ',' && !inQuotes))
                {
                    string item = inner[start..i].Trim().Trim('"');
                    if (item.Length > 0) result.Add(item);
                    start = i + 1;
                }
                else if (inner[i] == '"')
                {
                    inQuotes = !inQuotes;
                }
            }

            return result;
        }
    }
}