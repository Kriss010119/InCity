using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EModelsLib.Routes
{
    public class MetroRoute : Route
    {
        public string Color { get; set; }
        public string Line { get; set; }
        public string Operator { get; set; }

        public MetroRoute(long id, string routeNumber, string name, List<RouteStop> stops,
                         string color, string line, string op)
            : base(id, routeNumber, name, stops)
        {
            Color = color;
            Line = line;
            Operator = op;
        }
    }
}
