using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using CityDataCollector.Infrastructure;

namespace CityDataCollector.Infrastructure
{
    /// <summary>
    /// HTTP-клиент для Overpass API с повторными попытками, экспоненциальным backoff,
    /// и обработкой 429/5xx ошибок. Продолжает работу при любых ошибках.
    /// </summary>
    public sealed class OverpassClient : IDisposable
    {
        private readonly HttpClient _http;
        private const string OverpassUrl = "https://overpass-api.de/api/interpreter";
        private const int MaxRetries = 15;
        private const int BaseDelayMs = 1000;
        private const int MaxDelayMs = 30000;

        /// <summary>
        /// Расшифровки HTTP-кодов, которые может вернуть Overpass API.
        /// </summary>
        private static readonly Dictionary<int, string> HttpStatusDescriptions = new()
        {
            { 200, "OK — запрос выполнен успешно" },
            { 400, "Bad Request — ошибка в синтаксисе запроса Overpass QL" },
            { 403, "Forbidden — доступ запрещён, возможно IP заблокирован" },
            { 404, "Not Found — ресурс не найден" },
            { 408, "Request Timeout — сервер не дождался завершения запроса" },
            { 429, "Too Many Requests — слишком много запросов, сервер перегружен" },
            { 500, "Internal Server Error — внутренняя ошибка сервера Overpass" },
            { 502, "Bad Gateway — прокси-сервер получил неверный ответ" },
            { 503, "Service Unavailable — сервер Overpass временно недоступен (перегрузка или обслуживание)" },
            { 504, "Gateway Timeout — прокси-сервер не дождался ответа от Overpass" },
        };

        private static string DescribeStatus(int statusCode)
        {
            return HttpStatusDescriptions.TryGetValue(statusCode, out string? desc)
                ? $"{statusCode} ({desc})"
                : $"{statusCode} (неизвестный код ответа)";
        }

        public OverpassClient()
        {
            _http = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(300),
                DefaultRequestHeaders = { { "User-Agent", "CityDataCollector/2.0" } }
            };
        }

        /// <summary>
        /// Выполняет запрос к Overpass API с повторными попытками.
        /// Возвращает null только если все попытки исчерпаны.
        /// </summary>
        public async Task<string?> ExecuteQueryAsync(string query)
        {
            query = query.Trim().Replace("\r\n", " ").Replace("\n", " ");

            for (int attempt = 1; attempt <= MaxRetries; attempt++)
            {
                try
                {
                    var requestContent = $"data={Uri.EscapeDataString(query)}";
                    var content = new StringContent(requestContent, Encoding.UTF8, "application/x-www-form-urlencoded");

                    var response = await _http.PostAsync(OverpassUrl, content);

                    if (response.IsSuccessStatusCode)
                    {
                        return await response.Content.ReadAsStringAsync();
                    }

                    int code = (int)response.StatusCode;

                    if (response.StatusCode == HttpStatusCode.TooManyRequests ||
                        code >= 500)
                    {
                        int delay = Math.Min(BaseDelayMs * (int)Math.Pow(2, attempt - 1), MaxDelayMs);
                        FileLogger.Instance.Log($"  Overpass вернул {DescribeStatus(code)}, попытка {attempt}/{MaxRetries}, ожидание {delay / 1000}с...");
                        await Task.Delay(delay);
                        continue;
                    }

                    FileLogger.Instance.LogError($"  Overpass вернул {DescribeStatus(code)}, попытка {attempt}/{MaxRetries}");

                    if (attempt < MaxRetries)
                    {
                        await Task.Delay(BaseDelayMs * attempt);
                    }
                }
                catch (TaskCanceledException)
                {
                    FileLogger.Instance.Log($"  Таймаут запроса (сервер не ответил за 300с), попытка {attempt}/{MaxRetries}");
                    if (attempt < MaxRetries)
                    {
                        await Task.Delay(BaseDelayMs * attempt);
                    }
                }
                catch (HttpRequestException ex)
                {
                    FileLogger.Instance.LogError($"  Сетевая ошибка (проверьте интернет-соединение), попытка {attempt}/{MaxRetries}", ex);
                    if (attempt < MaxRetries)
                    {
                        await Task.Delay(BaseDelayMs * attempt);
                    }
                }
            }

            FileLogger.Instance.LogError($"  Все {MaxRetries} попыток исчерпаны — данные по этому запросу не получены");
            return null;
        }

        public void Dispose()
        {
            _http.Dispose();
        }
    }
}