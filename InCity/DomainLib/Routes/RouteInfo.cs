using System;

namespace DomainLib.Routes
{
    public class RouteInfo
    {
        public ulong RouteID { get; }
        public string? RouteNumber { get; }
        public int Order { get; }

        public RouteInfo(ulong id, string? routeNumber, int order)
        {
            RouteID = id;
            RouteNumber = routeNumber;
            Order = order;
        }
    }
}
