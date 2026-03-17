using DomainLib.Interfaces;
using System;
using System.Collections.Generic;

namespace DomainLib.Routes
{
    public abstract class Route : IRoute
    {
        public ulong ID { get; }
        public string? RouteNumber { get; }
        public string? Name { get; }
        public List<IStation> Stops { get; }

        public Route(ulong id, string? routeNumber, string? name, List<IStation>? stops)
        {
            ID = id;
            RouteNumber = routeNumber;
            Name = name;
            Stops = stops ?? new List<IStation>();
        }
    }
}
