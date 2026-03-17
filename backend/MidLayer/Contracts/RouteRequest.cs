using System;

namespace MidLayer.Contracts
{
    /// <summary>
    /// Параметры запроса GET /route-from-point.
    /// Используется при указании координат напрямую (точка на карте или координаты отеля от фронтенда).
    /// </summary>
    public class RouteFromPointQuery
    {
        public double Lat { get; set; }
        public double Lng { get; set; }
        public string Duration { get; set; } = "medium";
        public string Transport { get; set; } = "";
        public string Attractions { get; set; } = "";
        public string Subattractions { get; set; } = "";
        public string Events { get; set; } = "";
    }

    /// <summary>
    /// Параметры запроса GET /route-from-order.
    /// Используется для ж/д билетов и авиабилетов. Координаты определяются по коду станции/аэропорта из БД.
    /// </summary>
    public class RouteFromOrderQuery
    {
        /// <summary>
        /// Код станции или аэропорта прибытия (например: "SVO", "DME", "2000000").
        /// </summary>
        public string ArrivalCode { get; set; } = "";

        public string Duration { get; set; } = "medium";
        public string Transport { get; set; } = "";
        public string Attractions { get; set; } = "";
        public string Subattractions { get; set; } = "";
        public string Events { get; set; } = "";
    }
}