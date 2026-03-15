using System;
using System.Threading.Tasks;
using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using MidLayer.DataAccess;

namespace TopLayer.Repositories
{
    internal class ArrivalPointRepository : IArrivalPointRepository
    {
        private readonly string _connectionString;

        public ArrivalPointRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        public async Task<ArrivalPoint?> GetByCodeAsync(string code)
        {
            string sql = @"
                SELECT code, name, latitude, longitude
                FROM arrival_points
                WHERE code = @code
                LIMIT 1";

            using var connection = new NpgsqlConnection(_connectionString);

            var row = await connection.QueryFirstOrDefaultAsync(sql, new { code = code });

            if (row == null)
            {
                return null;
            }

            return new ArrivalPoint
            {
                Code = (string)row.code,
                Name = (string?)row.name,
                Latitude = (double)(decimal)row.latitude,
                Longitude = (double)(decimal)row.longitude
            };
        }
    }
}