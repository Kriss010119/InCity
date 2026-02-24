using System;
using System.Text.RegularExpressions;
using System.Text;
using EFileManagerLib;

namespace DataCollectors
{
    public abstract class BaseDataCollector
    {
        private protected readonly HttpClient _httpClient;
        private protected readonly JsonFileManager _fileManager;
        private protected const string OverpassUrl = "https://overpass-api.de/api/interpreter";
        private protected string _cityName;
        private protected string _cityFolderPath;

        public string CityName
        {
            get => _cityName;
            set
            {
                if (value == null)
                {
                    return;
                }

                _cityName = value;
                string _cityFolderPath = Path.Combine("data", ConvertToEnglishTranslit(_cityName));
            }
        }

        public BaseDataCollector(string cityName)
        {
            _httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(180),
                DefaultRequestHeaders = { { "User-Agent", "CityTransportCollector/1.0" } }
            };

            _fileManager = new JsonFileManager();
            _cityName = cityName;
            _cityFolderPath = Path.Combine("data", ConvertToEnglishTranslit(_cityName));
        }

        /// <summary>
        /// Создает файловую систему для файлов с данными.
        /// </summary>
        /// <param name="cityNameEn">Название города.</param>
        private protected void CreateDataDirectoryStructure(string cityNameEn)
        {
            string dataFolder = "data";
            _fileManager.CreateDirectory(dataFolder);

            _fileManager.CreateDirectory(_cityFolderPath);
            Console.WriteLine($"Создана папка для города: {_cityFolderPath}\n");
        }

        private protected string ConvertToEnglishTranslit(string russianName)
        {
            var translitMap = new Dictionary<char, string>
            {
                {'а', "a"}, {'б', "b"}, {'в', "v"}, {'г', "g"}, {'д', "d"},
                {'е', "e"}, {'ё', "yo"}, {'ж', "zh"}, {'з', "z"}, {'и', "i"},
                {'й', "y"}, {'к', "k"}, {'л', "l"}, {'м', "m"}, {'н', "n"},
                {'о', "o"}, {'п', "p"}, {'р', "r"}, {'с', "s"}, {'т', "t"},
                {'у', "u"}, {'ф', "f"}, {'х', "kh"}, {'ц', "ts"}, {'ч', "ch"},
                {'ш', "sh"}, {'щ', "shch"}, {'ъ', ""}, {'ы', "y"}, {'ь', ""},
                {'э', "e"}, {'ю', "yu"}, {'я', "ya"},
                {'А', "A"}, {'Б', "B"}, {'В', "V"}, {'Г', "G"}, {'Д', "D"},
                {'Е', "E"}, {'Ё', "Yo"}, {'Ж', "Zh"}, {'З', "Z"}, {'И', "I"},
                {'Й', "Y"}, {'К', "K"}, {'Л', "L"}, {'М', "M"}, {'Н', "N"},
                {'О', "O"}, {'П', "P"}, {'Р', "R"}, {'С', "S"}, {'Т', "T"},
                {'У', "U"}, {'Ф', "F"}, {'Х', "Kh"}, {'Ц', "Ts"}, {'Ч', "Ch"},
                {'Ш', "Sh"}, {'Щ', "Shch"}, {'Ъ', ""}, {'Ы', "Y"}, {'Ь', ""},
                {'Э', "E"}, {'Ю', "Yu"}, {'Я', "Ya"}
            };

            var result = new StringBuilder();

            foreach (char c in russianName)
            {
                if (translitMap.TryGetValue(c, out string? translit))
                {
                    result.Append(translit);
                }
                else if (char.IsLetterOrDigit(c) || c == ' ' || c == '-')
                {
                    result.Append(c);
                }
                else
                {
                    result.Append('_');
                }
            }

            // Убираем двойные подчеркивания и пробелы
            string transliterated = result.ToString();
            transliterated = Regex.Replace(transliterated, @"\s+", "_");
            transliterated = Regex.Replace(transliterated, @"_+", "_");
            transliterated = transliterated.Trim('_').ToLower();

            return transliterated;
        }

        private protected async Task<string> ExecuteOverpassQuery(string query)
        {
            query = query.Trim()
                        .Replace("\r\n", " ")
                        .Replace("\n", " ")
                        .Replace("  ", " ");

            var maxRetries = 7;

            for (int retry = 0; retry < maxRetries; retry++)
            {
                try
                {
                    var requestContent = $"data={Uri.EscapeDataString(query)}";
                    var content = new StringContent(requestContent, Encoding.UTF8, "application/x-www-form-urlencoded");

                    var response = await _httpClient.PostAsync(OverpassUrl, content);

                    if (response.IsSuccessStatusCode)
                    {
                        return await response.Content.ReadAsStringAsync();
                    }
                    else if (response.StatusCode == System.Net.HttpStatusCode.GatewayTimeout)
                    {
                        if (retry < maxRetries - 1)
                        {
                            await Task.Delay(3000 * (retry + 1));
                            continue;
                        }
                    }

                    var errorContent = await response.Content.ReadAsStringAsync();
                    throw new HttpRequestException($"HTTP {response.StatusCode}");
                }
                catch (TaskCanceledException) when (retry < maxRetries - 1)
                {
                    await Task.Delay(3000 * (retry + 1));
                }
            }

            throw new Exception("Не удалось выполнить запрос после нескольких попыток");
        }
    }
}
