using System.Text.Json;
using System.Text;

namespace EFileManagerLib
{
    public class JsonFileManager
    {
        private readonly JsonSerializerOptions _jsonOptions;

        public JsonFileManager()
        {
            _jsonOptions = new JsonSerializerOptions
            {
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
        }

        /// <summary>
        /// Сохраняет любой объект в JSON файл
        /// </summary>
        /// <typeparam name="T">Тип сохраняемого объекта</typeparam>
        /// <param name="data">Данные для сохранения</param>
        /// <param name="filePath">Путь к файлу</param>
        public async Task SaveToJsonFile<T>(T data, string filePath)
        {
            try
            {
                var json = JsonSerializer.Serialize(data, _jsonOptions);
                await SaveJsonToFile(json, filePath);
                Console.WriteLine($"   Файл создан: {filePath} ({json.Length / 1024} KB)");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка сохранения файла {filePath}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Сохраняет готовую JSON строку в файл
        /// </summary>
        /// <param name="json">JSON строка</param>
        /// <param name="filePath">Путь к файлу</param>
        public async Task SaveJsonToFile(string json, string filePath)
        {
            try
            {
                await File.WriteAllTextAsync(filePath, json, Encoding.UTF8);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка записи в файл {filePath}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Читает JSON файл в объект указанного типа
        /// </summary>
        /// <typeparam name="T">Тип объекта</typeparam>
        /// <param name="filePath">Путь к файлу</param>
        /// <returns>Десериализованный объект</returns>
        public async Task<T> ReadFromJsonFile<T>(string filePath)
        {
            try
            {
                var json = await File.ReadAllTextAsync(filePath, Encoding.UTF8);
                return JsonSerializer.Deserialize<T>(json, _jsonOptions)!;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка чтения файла {filePath}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Удаляет файл
        /// </summary>
        public void DeleteFile(string filePath)
        {
            try
            {
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка удаления файла {filePath}: {ex.Message}");
            }
        }

        /// <summary>
        /// Переименовывает файл
        /// </summary>
        public void RenameFile(string sourcePath, string targetPath)
        {
            try
            {
                if (File.Exists(sourcePath))
                {
                    if (File.Exists(targetPath))
                    {
                        DeleteFile(targetPath);
                    }
                    File.Move(sourcePath, targetPath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка переименования файла {sourcePath} -> {targetPath}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Создает директорию, если она не существует
        /// </summary>
        public void CreateDirectory(string directoryPath)
        {
            try
            {
                if (!Directory.Exists(directoryPath))
                {
                    Directory.CreateDirectory(directoryPath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка создания директории {directoryPath}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Проверяет существование файла
        /// </summary>
        public bool FileExists(string filePath)
        {
            return File.Exists(filePath);
        }

        /// <summary>
        /// Проверяет существование директории
        /// </summary>
        public bool DirectoryExists(string directoryPath)
        {
            return Directory.Exists(directoryPath);
        }
    }
}
