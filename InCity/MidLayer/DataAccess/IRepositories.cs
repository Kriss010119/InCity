using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DomainLib.Interfaces;
using DomainLib.Stations;
using DomainLib.Routes;

namespace MidLayer.DataAccess
{
    /// <summary>
    /// Интерфейс репозитория достопримечательностей.
    /// Фильтрация по радиусу — через формулу гаверсинусов в SQL, без PostGIS.
    /// </summary>
    public interface IAttractionRepository
    {
        Task<IEnumerable<IAttraction>> GetAttractionsAsync(double latitude, double longitude, int radiusMeters,
            string[] categories, string[] subcategories);
    }

    public interface IBusRepository
    {
        Task<IEnumerable<BusStop>> GetStopsAsync(double latitude, double longitude, int radiusMeters);
        Task<IEnumerable<BusRoute>> GetRoutesForStopsAsync(IEnumerable<ulong> stopIds);
    }

    public interface ITramRepository
    {
        Task<IEnumerable<TramStop>> GetStopsAsync(double latitude, double longitude, int radiusMeters);
        Task<IEnumerable<TramRoute>> GetRoutesForStopsAsync(IEnumerable<ulong> stopIds);
    }

    public interface ITrolleybusRepository
    {
        Task<IEnumerable<TrolleybusStop>> GetStopsAsync(double latitude, double longitude, int radiusMeters);
        Task<IEnumerable<TrolleybusRoute>> GetRoutesForStopsAsync(IEnumerable<ulong> stopIds);
    }

    public interface IMetroRepository
    {
        Task<IEnumerable<MetroStation>> GetStationsAsync(double latitude, double longitude, int radiusMeters);
        Task<IEnumerable<MetroRoute>> GetRoutesAsync();
    }

    /// <summary>
    /// Репозиторий точек прибытия (ж/д станции, аэропорты).
    /// Таблица в БД: код, название, координаты.
    /// </summary>
    public interface IArrivalPointRepository
    {
        Task<ArrivalPoint?> GetByCodeAsync(string code);
    }

    public class ArrivalPoint
    {
        public string Code { get; set; } = "";
        public string? Name { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}