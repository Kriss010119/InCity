using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DomainLib.Interfaces;
using DomainLib.Stations;
using DomainLib.Routes;

namespace MidLayer.DataAccess
{
    public class DataLoader
    {
        private readonly IAttractionRepository _attractionRepo;
        private readonly IBusRepository _busRepo;
        private readonly ITramRepository _tramRepo;
        private readonly ITrolleybusRepository _trolleybusRepo;
        private readonly IMetroRepository _metroRepo;
        private readonly ICityRepository _cityRepo;

        private const int DefaultSearchRadiusMeters = 25000;

        public DataLoader(
            IAttractionRepository attractionRepo,
            IBusRepository busRepo,
            ITramRepository tramRepo,
            ITrolleybusRepository trolleybusRepo,
            IMetroRepository metroRepo,
            ICityRepository cityRepo)
        {
            _attractionRepo = attractionRepo;
            _busRepo = busRepo;
            _tramRepo = tramRepo;
            _trolleybusRepo = trolleybusRepo;
            _metroRepo = metroRepo;
            _cityRepo = cityRepo;
        }

        public async Task<string?> GetCityNameAsync(double latitude, double longitude)
        {
            return await _cityRepo.GetCityNameByCoordinatesAsync(latitude, longitude);
        }

        public async Task<CityData> LoadCityDataAsync(double latitude, double longitude,
            string[] categories, string[] subcategories, int searchRadius = DefaultSearchRadiusMeters)
        {
            // Первая волна: остановки и достопримечательности
            Task<IEnumerable<IAttraction>> attractionsTask = _attractionRepo.GetAttractionsAsync(
                latitude, longitude, searchRadius, categories, subcategories);

            Task<IEnumerable<BusStop>> busStopsTask = _busRepo.GetStopsAsync(latitude, longitude, searchRadius);
            Task<IEnumerable<TramStop>> tramStopsTask = _tramRepo.GetStopsAsync(latitude, longitude, searchRadius);
            Task<IEnumerable<TrolleybusStop>> trolleybusStopsTask = _trolleybusRepo.GetStopsAsync(latitude, longitude, searchRadius);
            Task<IEnumerable<MetroStation>> metroStationsTask = _metroRepo.GetStationsAsync(latitude, longitude, searchRadius);

            await Task.WhenAll(attractionsTask, busStopsTask, tramStopsTask,
                trolleybusStopsTask, metroStationsTask);

            IEnumerable<BusStop> busStops = busStopsTask.Result;
            IEnumerable<TramStop> tramStops = tramStopsTask.Result;
            IEnumerable<TrolleybusStop> trolleybusStops = trolleybusStopsTask.Result;
            IEnumerable<MetroStation> metroStations = metroStationsTask.Result;

            // Вторая волна: маршруты по ID найденных остановок/станций
            ulong[] busStopIds = busStops.Select(s => s.ID).ToArray();
            ulong[] tramStopIds = tramStops.Select(s => s.ID).ToArray();
            ulong[] trolleybusStopIds = trolleybusStops.Select(s => s.ID).ToArray();
            ulong[] metroStationIds = metroStations.Select(s => s.ID).ToArray();

            Task<IEnumerable<BusRoute>> busRoutesTask = _busRepo.GetRoutesForStopsAsync(busStopIds);
            Task<IEnumerable<TramRoute>> tramRoutesTask = _tramRepo.GetRoutesForStopsAsync(tramStopIds);
            Task<IEnumerable<TrolleybusRoute>> trolleybusRoutesTask = _trolleybusRepo.GetRoutesForStopsAsync(trolleybusStopIds);
            Task<IEnumerable<MetroRoute>> metroRoutesTask = _metroRepo.GetRoutesForStationsAsync(metroStationIds);

            await Task.WhenAll(busRoutesTask, tramRoutesTask, trolleybusRoutesTask, metroRoutesTask);

            return new CityData
            {
                Attractions = attractionsTask.Result,
                BusStops = busStops,
                BusRoutes = busRoutesTask.Result,
                TramStops = tramStops,
                TramRoutes = tramRoutesTask.Result,
                TrolleybusStops = trolleybusStops,
                TrolleybusRoutes = trolleybusRoutesTask.Result,
                MetroStations = metroStations,
                MetroRoutes = metroRoutesTask.Result
            };
        }
    }

    public class CityData
    {
        public IEnumerable<IAttraction> Attractions { get; set; } = [];
        public IEnumerable<BusStop> BusStops { get; set; } = [];
        public IEnumerable<BusRoute> BusRoutes { get; set; } = [];
        public IEnumerable<TramStop> TramStops { get; set; } = [];
        public IEnumerable<TramRoute> TramRoutes { get; set; } = [];
        public IEnumerable<TrolleybusStop> TrolleybusStops { get; set; } = [];
        public IEnumerable<TrolleybusRoute> TrolleybusRoutes { get; set; } = [];
        public IEnumerable<MetroStation> MetroStations { get; set; } = [];
        public IEnumerable<MetroRoute> MetroRoutes { get; set; } = [];
    }
}