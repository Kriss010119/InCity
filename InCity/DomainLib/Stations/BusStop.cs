using System;
using System.Collections.Generic;
using DomainLib.Interfaces;
using DomainLib.Routes;
using DomainLib.Enumerators;

namespace DomainLib.Stations
{
    public class BusStop : Station, IStation
    {
        public List<RouteInfo> Routes { get; }
        public string? LocalName { get; }


        public BusStop(ulong id, double latitude, double longitude, string? name, List<RouteInfo>? routes, string? localName) :
            base(id, latitude, longitude, name, TransportType.Bus)
        {
            Routes = routes ?? [];
            LocalName = localName;
        }
    }
}
