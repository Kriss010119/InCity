using System;
using System.Collections.Generic;
using DomainLib.Routes;
using DomainLib.Enumerators;
using DomainLib.Interfaces;

namespace DomainLib.Stations
{
    public class MetroStation : Station
    {
        public List<string>? Lines { get; }
        public List<MetroRouteInfo>? Routes { get; }
        public bool IsTransfer { get; }
        public List<KeyValuePair<string, List<MetroRouteInfo>>>? Transfers { get; }
        public string? LocalName { get; }

        public MetroStation(ulong id, double latitude, double longitude, string? name,
            List<string>? lines, List<MetroRouteInfo>? routes, bool isTransfer, List<KeyValuePair<string, List<MetroRouteInfo>>>? transfers,
            string? localName) : base(id, latitude, longitude, name, TransportType.Metro)
        {
            Lines = lines;
            Routes = routes;
            IsTransfer = isTransfer;
            Transfers = transfers;
            LocalName = localName;
        }
    }
}
