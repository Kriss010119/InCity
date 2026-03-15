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

            string categorySql = categories.Length > 0
                ? "AND category = ANY(@categories)"
                : "";

            string subcategorySql = subcategories.Length > 0
                ? "AND subcategory = ANY(@subcategories)"
                : "";

            string sql = $@"
                SELECT id, name, latitude, longitude, category, subcategory, 
                       square, estimated_visit_minutes, tags
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
                string[]? tags = row.tags as string[];
                List<string> tagList = tags != null ? new List<string>(tags) : new List<string>();

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
    }
}