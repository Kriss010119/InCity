using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DomainLib.Routes
{
    public class MetroRouteInfo : RouteInfo
    {
        public string? Color { get; }

        public MetroRouteInfo(ulong id, string? routeNumber, int order, string? color) : base(id, routeNumber, order)
        {
            Color = color;
        }
    }
}
