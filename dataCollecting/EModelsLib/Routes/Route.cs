using System;
using System.Collections.Generic;

namespace EModelsLib.Routes
{
    public abstract class Route
    {
        public long Id { get; set; }
        public string RouteNumber { get; set; }
        public string Name { get; set; }
        public List<RouteStop> Stops { get; set; } = new List<RouteStop>();

        public Route(long id, string routeNumber, string name, List<RouteStop> stops)
        {
            Id = id;
            RouteNumber = routeNumber;
            Name = name;
            Stops = stops;
        }
    }
}
