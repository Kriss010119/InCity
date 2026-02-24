using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EModelsLib.Routes
{
    public class BusRoute : Route
    {
        public string From { get; set; }
        public string To { get; set; }
        public string Operator { get; set; }
        public string Network { get; set; }

        public BusRoute(long id, string routeNumber, string name, List<RouteStop> stops, string from, string to, string op,  string network) 
            : base(id, routeNumber, name, stops)
        {
            From = from;
            To = to;
            Operator = op;
            Network = network;
        }
    }
}
