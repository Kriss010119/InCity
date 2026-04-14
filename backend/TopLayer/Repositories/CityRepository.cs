using System;
using System.Threading.Tasks;
using Dapper;
using MidLayer.DataAccess;
using Npgsql;

namespace TopLayer.Repositories
{
    /// <summary>
    /// ќпредел€ет город по координатам.
    /// »щет город через таблицу attractions Ч берЄт city_id ближайшей достопримечательности.
    /// </summary>
    public class CityRepository : ICityRepository
    {
        private readonly string _connectionString;

        public CityRepository(Microsoft.Extensions.Configuration.IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        public async Task<string?> GetCityNameByCoordinatesAsync(double latitude, double longitude)
        {
            string sql = @"
                SELECT c.name
                FROM attractions a
                JOIN cities c ON a.city_id = c.id
                WHERE a.latitude BETWEEN @lat - 0.5 AND @lat + 0.5
                  AND a.longitude BETWEEN @lon - 0.5 AND @lon + 0.5
                ORDER BY (a.latitude - @lat) * (a.latitude - @lat) + (a.longitude - @lon) * (a.longitude - @lon)
                LIMIT 1";

            using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QueryFirstOrDefaultAsync<string>(sql, new { lat = latitude, lon = longitude });
        }
    }
}