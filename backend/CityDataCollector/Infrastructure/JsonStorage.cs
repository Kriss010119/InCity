using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using CityDataCollector.Infrastructure;

namespace CityDataCollector.Infrastructure
{
    public static class JsonStorage
    {
        private static readonly JsonSerializerOptions Options = new()
        {
            WriteIndented = true,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public static async Task SaveAsync<T>(T data, string filePath)
        {
            try
            {
                string? dir = Path.GetDirectoryName(filePath);
                if (dir != null) Directory.CreateDirectory(dir);

                var json = JsonSerializer.Serialize(data, Options);
                await File.WriteAllTextAsync(filePath, json, Encoding.UTF8);
                FileLogger.Instance.Log($"  Сохранено: {Path.GetFileName(filePath)} ({json.Length / 1024} KB)");
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError($"  Ошибка сохранения {filePath}", ex);
            }
        }
    }
}