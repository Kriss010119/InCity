using System;

namespace EModelsLib.Routes
{
    public class RouteInfo
    {
        public string RouteNumber { get; set; }
        public int Order { get; set; }

        public RouteInfo(string routeNumber, int order)
        {
            RouteNumber = routeNumber;
            Order = order;
        }
    }
}
