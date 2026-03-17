using DomainLib.Stations;
using DomainLib.Interfaces;
using System;
using System.Collections.Generic;

namespace DomainLib.Routes
{
    public class BusRoute : Route
    {
        public string From { get; }
        public string To { get; }
        public string Operator { get; }
        public string Network { get; }

        public BusRoute(ulong id, string routeNumber, string name, List<IStation> stops, string from, string to, string op, string network)
            : base(id, routeNumber, name, stops)
        {
            From = from;
            To = to;
            Operator = op;
            Network = network;
        }
    }
}
