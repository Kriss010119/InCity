using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EModelsLib.Routes
{
    public sealed class MetroRouteInfo : RouteInfo
    {
        public string Color { get; set; }

        public MetroRouteInfo(string color, string routeNumber, int order) : base(routeNumber, order)
        {
            Color = color;
        }
    }
}
