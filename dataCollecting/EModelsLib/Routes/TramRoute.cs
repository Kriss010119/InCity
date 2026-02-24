using System;
using System.Collections.Generic;

namespace EModelsLib.Routes
{
    public class TramRoute : Route
    {
        public string From { get; set; }
        public string To { get; set; }
        public string Operator { get; set; }
        public string Network { get; set; }

        public TramRoute(long id, string routeNumber, string name, List<RouteStop> stops,
                        string from, string to, string op, string network)
            : base(id, routeNumber, name, stops)
        {
            From = from;
            To = to;
            Operator = op;
            Network = network;
        }
    }
}