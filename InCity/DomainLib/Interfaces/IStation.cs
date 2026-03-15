using DomainLib.Routes;
using System.Collections.Generic;
using System;

namespace DomainLib.Interfaces
{
    public interface IStation
    {
        ulong ID { get; }
        string? Name { get; }
        double Latitude { get; }
        double Longitude { get; }
        List<RouteInfo> Routes { get; }
    }
}
