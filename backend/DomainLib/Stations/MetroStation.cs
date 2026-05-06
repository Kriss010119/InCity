using System;
using System.Collections.Generic;
using DomainLib.Routes;
using DomainLib.Enumerators;
using DomainLib.Interfaces;

namespace DomainLib.Stations
{
    public class MetroStation : Station
    {
        public List<MetroRouteInfo>? Routes { get; }
        public bool IsTransfer => Transfers != null && Transfers.Count > 0;
        public List<KeyValuePair<ulong, List<MetroRouteInfo>>>? Transfers { get; }
        public string? LocalName { get; }

        public MetroStation(ulong id, double latitude, double longitude, string? name,
            List<MetroRouteInfo>? routes, List<KeyValuePair<ulong, List<MetroRouteInfo>>>? transfers, string? localName) 
            : base(id, latitude, longitude, name, TransportType.Metro)
        {
            Routes = routes;
            Transfers = transfers;
            LocalName = localName;
        }
    }
}
