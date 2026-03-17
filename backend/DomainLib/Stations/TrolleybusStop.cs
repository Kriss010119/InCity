using DomainLib.Interfaces;
using DomainLib.Routes;
using System;
using System.Collections.Generic;
using DomainLib.Enumerators;

namespace DomainLib.Stations
{
    public class TrolleybusStop : Station, IStation
    {
        public List<RouteInfo> Routes { get; }
        public string? LocalName { get; }

        public TrolleybusStop(ulong id, double latitude, double longitude, string? name, List<RouteInfo>? routes, string? localName) 
            : base(id, latitude, longitude, name, TransportType.Trolleybus)
        {
            Routes = routes ?? [];
            LocalName = localName;
        }
    }
}
