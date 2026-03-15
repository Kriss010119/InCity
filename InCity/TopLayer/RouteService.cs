using System;
using System.Threading.Tasks;
using MidLayer.Contracts;
using MidLayer.Parsers;
using MidLayer.DataAccess;
using RoutePlanning.AttractionConnecting;
using RoutePlanning.Service;
using DomainLib.Attractions;
using DomainLib.Service;

namespace TopLayer.Services
{
    /// <summary>
    /// Сервис маршрутизации: принимает параметры запроса,
    /// загружает данные, вызывает бизнес-логику, возвращает ответ.
    /// </summary>
    public class RouteService
    {
        private readonly DataLoader _dataLoader;
        private readonly IArrivalPointRepository _arrivalPointRepo;

        public RouteService(DataLoader dataLoader, IArrivalPointRepository arrivalPointRepo)
        {
            _dataLoader = dataLoader;
            _arrivalPointRepo = arrivalPointRepo;
        }

        /// <summary>
        /// Строит маршрут от точки на карте.
        /// Используется при прямом указании координат и при заказе с отелем
        /// (фронтенд сам извлекает координаты отеля).
        /// </summary>
        public async Task<RouteResponse> BuildRouteFromPointAsync(RouteFromPointQuery query)
        {
            int durationMinutes = RequestParser.ParseDuration(query.Duration);
            TransportFilter transportFilter = RequestParser.ParseTransportFilter(query.Transport);
            AttractionFilter attractionFilter = RequestParser.ParseAttractionFilter(query.Attractions, query.Subattractions);

            return await BuildRouteAsync(query.Lat, query.Lng, durationMinutes, transportFilter, attractionFilter);
        }

        /// <summary>
        /// Строит маршрут от ж/д станции или аэропорта по коду прибытия.
        /// </summary>
        public async Task<RouteResponse> BuildRouteFromOrderAsync(RouteFromOrderQuery query)
        {
            ArrivalPoint? point = await _arrivalPointRepo.GetByCodeAsync(query.ArrivalCode);

            if (point == null)
            {
                return new RouteResponse { VisitPoints = [], Sections = [] };
            }

            int durationMinutes = RequestParser.ParseDuration(query.Duration);
            TransportFilter transportFilter = RequestParser.ParseTransportFilter(query.Transport);
            AttractionFilter attractionFilter = RequestParser.ParseAttractionFilter(query.Attractions, query.Subattractions);

            return await BuildRouteAsync(point.Latitude, point.Longitude, durationMinutes, transportFilter, attractionFilter);
        }

        private async Task<RouteResponse> BuildRouteAsync(double lat, double lon, int durationMinutes,
            TransportFilter transportFilter, AttractionFilter attractionFilter)
        {
            CityData cityData = await _dataLoader.LoadCityDataAsync(
                lat, lon,
                attractionFilter.Categories,
                attractionFilter.Subcategories
            );

            RoutePlanner planner = new RoutePlanner(
                cityData.BusStops, cityData.BusRoutes,
                cityData.TramStops, cityData.TramRoutes,
                cityData.TrolleybusStops, cityData.TrolleybusRoutes,
                cityData.MetroStations, cityData.MetroRoutes,
                cityData.Attractions
            );

            Pair<Cluster[], Section[]> result = planner.Execute(lat, lon, transportFilter, durationMinutes);

            return ResponseBuilder.BuildRouteResponse(result.First, result.Second);
        }
    }
}