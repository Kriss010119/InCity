using System;
using System.IO;

namespace CityDataCollector.Infrastructure
{
    /// <summary>
    /// Логгер в файл формата logs/YYYY-MM-DD.txt.
    /// При повторном запуске в тот же день — файл перезаписывается.
    /// </summary>
    public sealed class FileLogger
    {
        private readonly string _filePath;
        private static FileLogger? _instance;

        public static FileLogger Instance => _instance ?? throw new InvalidOperationException("Logger not initialized");

        public static void Initialize()
        {
            string logsDir = Path.Combine("data", "logs");
            Directory.CreateDirectory(logsDir);
            string fileName = $"{DateTime.Now:yyyy-MM-dd}.txt";
            string filePath = Path.Combine(logsDir, fileName);

            // Перезаписываем файл если запуск в тот же день
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            _instance = new FileLogger(filePath);
            _instance.Log("=== Запуск сборщика данных ===");
        }

        private FileLogger(string filePath)
        {
            _filePath = filePath;
        }

        public void Log(string message)
        {
            string line = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}";
            Console.WriteLine(line);
            File.AppendAllText(_filePath, line + Environment.NewLine);
        }

        public void LogError(string message, Exception? ex = null)
        {
            string line = ex != null
                ? $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] ОШИБКА: {message} | {ex.Message}"
                : $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] ОШИБКА: {message}";
            Console.WriteLine(line);
            File.AppendAllText(_filePath, line + Environment.NewLine);
        }
    }
}