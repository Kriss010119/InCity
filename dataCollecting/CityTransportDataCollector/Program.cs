using DataCollectors;
using EModelsLib.Interfaces;
using System.Text;

namespace CityTransportDataCollector
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;

            Console.WriteLine("==================================================");
            Console.WriteLine("СБОРЩИК ДАННЫХ ГОРОДА");
            Console.WriteLine("==================================================\n");

            Console.WriteLine("Введите название города (например: Москва, Санкт-Петербург, Казань):");
            Console.Write("> ");
            var cityName = Console.ReadLine()?.Trim();

            if (string.IsNullOrEmpty(cityName))
            {
                Console.WriteLine("Не указано название города. Завершаем работу.");
                Console.ReadKey();
                return;
            }

            Console.WriteLine($"\nНачинаем сбор данных для города: {cityName}");
            Console.WriteLine("Это может занять несколько минут...\n");

            IDataCollector[] collectors = {
                new BusDataCollector(cityName),
                //new MetroDataCollector(cityName),
                //new TramDataCollector(cityName),
                //new TrolleybusDataCollector(cityName),
                //new AttractionsDataCollector(cityName)
            };

            //for (int i = 0; i < 5; i++)
            //{
            //    try
            //    {
            //        await collector.CollectDataForCityAsync();
            //        return;
            //    }
            //    catch (Exception ex)
            //    {
            //        Console.WriteLine($"\nПроизошла ошибка: {ex.Message}");
            //        if (ex.InnerException != null)
            //        {
            //            Console.WriteLine($"Внутренняя ошибка: {ex.InnerException.Message}");
            //        }
            //    }
            //}

            foreach (IDataCollector collector in collectors)
            {
                for (int i = 0; i < 5; i++)
                {
                    try
                    {
                        await collector.CollectDataForCityAsync();
                        break;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"\nПроизошла ошибка: {ex.Message}");
                    }
                }
            }

            Console.WriteLine("\nНажмите любую клавишу для выхода...");
            Console.ReadKey();
        }
    }
}
