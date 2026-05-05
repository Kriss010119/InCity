using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MidLayer.Contracts;
using MidLayer.Parsers;
using MidLayer.DataAccess;
using MidLayer.KudaGo;
using RoutePlanning.AttractionConnecting;
using RoutePlanning.Service;
using DomainLib.Attractions;
using DomainLib.Interfaces;
using DomainLib.Service;

namespace TopLayer.Services
{
    /// <summary>
    /// Сервис маршрутизации: принимает параметры запроса,
    /// загружает данные, при необходимости подтягивает события из KudaGo,
    /// вызывает бизнес-логику, возвращает ответ.
    /// </summary>
    public class RouteService
    {
        private readonly DataLoader _dataLoader;
        private readonly IArrivalPointRepository _arrivalPointRepo;
        private readonly ICityRepository _cityRepo;

        public RouteService(DataLoader dataLoader, IArrivalPointRepository arrivalPointRepo, ICityRepository cityRepo)
        {
            _dataLoader = dataLoader;
            _arrivalPointRepo = arrivalPointRepo;
            _cityRepo = cityRepo;
        }

        public async Task<RouteResponse> BuildRouteFromPointAsync(RouteFromPointQuery query)
        {
            int durationMinutes = RequestParser.ParseDuration(query.Duration);
            TransportFilter transportFilter = RequestParser.ParseTransportFilter(query.Transport);
            string[] eventCategories = RequestParser.ParseEventCategories(query.Events);
            AttractionFilter attractionFilter = RequestParser.ParseAttractionFilter(query.Attractions, query.Subattractions, eventCategories.Length > 0);

            return await BuildRouteAsync(query.Lat, query.Lng, durationMinutes, transportFilter, attractionFilter, eventCategories);
        }

        public async Task<RouteResponse> BuildRouteFromOrderAsync(RouteFromOrderQuery query)
        {
            ArrivalPoint? point = await _arrivalPointRepo.GetByCodeAsync(query.ArrivalCode);

            if (point == null)
            {
                return new RouteResponse { VisitPoints = [], Sections = [] };
            }

            int durationMinutes = RequestParser.ParseDuration(query.Duration);
            TransportFilter transportFilter = RequestParser.ParseTransportFilter(query.Transport);
            string[] eventCategories = RequestParser.ParseEventCategories(query.Events);
            AttractionFilter attractionFilter = RequestParser.ParseAttractionFilter(query.Attractions, query.Subattractions, eventCategories.Length > 0);

            return await BuildRouteAsync(point.Latitude, point.Longitude, durationMinutes, transportFilter, attractionFilter, eventCategories);
        }

        private async Task<RouteResponse> BuildRouteAsync(double lat, double lon, int durationMinutes,
            TransportFilter transportFilter, AttractionFilter attractionFilter, string[] eventCategories)
        {
            // Запускаем загрузку данных из БД
            Task<CityData> cityDataTask = _dataLoader.LoadCityDataAsync(
                lat, lon,
                attractionFilter.Categories,
                attractionFilter.Subcategories
            );

            // Параллельно запрашиваем события из KudaGo (если фронтенд запросил)
            Task<List<Event>> eventsTask;
            if (eventCategories.Length > 0)
            {
                eventsTask = FetchEventsFromKudaGoAsync(lat, lon, eventCategories);
            }
            else
            {
                eventsTask = Task.FromResult(new List<Event>());
            }

            await Task.WhenAll(cityDataTask, eventsTask);

            CityData cityData = cityDataTask.Result;
            List<Event> events = eventsTask.Result;

            // Объединяем достопримечательности из БД и события из KudaGo
            List<IAttraction> allAttractions = new List<IAttraction>(cityData.Attractions);
            allAttractions.AddRange(events);

            RoutePlanner planner = new RoutePlanner(
                cityData.BusStops, cityData.BusRoutes,
                cityData.TramStops, cityData.TramRoutes,
                cityData.TrolleybusStops, cityData.TrolleybusRoutes,
                cityData.MetroStations, cityData.MetroRoutes,
                allAttractions
            );

            Pair<Cluster[], Section[]> result = planner.Execute(lat, lon, transportFilter, durationMinutes);

            return ResponseBuilder.BuildRouteResponse(result.First, result.Second);
        }

        /// <summary>
        /// Определяет город по координатам и запрашивает события из KudaGo API.
        /// Если город не поддерживается KudaGo или API недоступен — возвращает пустой список.
        /// </summary>
        private async Task<List<Event>> FetchEventsFromKudaGoAsync(double lat, double lon, string[] eventCategories)
        {
            try
            {
                string? cityName = await _cityRepo.GetCityNameByCoordinatesAsync(lat, lon);

                if (string.IsNullOrEmpty(cityName))
                {
                    return new List<Event>();
                }

                if (!KudaGoClient.IsCitySupported(cityName))
                {
                    return new List<Event>();
                }

                using var client = new KudaGoClient();
                return await client.FetchEventsAsync(cityName, eventCategories);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return new List<Event>();
            }
        }
    }
}