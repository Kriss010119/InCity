using DomainLib.Routes;
using DomainLib.Interfaces;
using System;
using System.Collections.Generic;
using DomainLib.Enumerators;

namespace DomainLib.Stations
{
    public class TramStop : Station, IStation
    {
        public List<RouteInfo> Routes { get; }
        public string? LocalName { get; }

        public TramStop(ulong id, double latitude, double longitude, string? name, List<RouteInfo>? routes, string? localName)
            : base(id, latitude, longitude, name, TransportType.Tram)
        {
            Routes = routes ?? new List<RouteInfo>();
            LocalName = localName;
        }
    }
}
