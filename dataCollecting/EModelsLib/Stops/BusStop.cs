using EModelsLib.Routes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EModelsLib.Stops
{
    public class BusStop : Stop
    {
        public List<RouteInfo> Routes { get; set; } = new List<RouteInfo>();
        public string LocalName { get; set; }

        public BusStop(long id, string name, double latitude, double longitude, string localName, List<RouteInfo> routes) 
            : base(id, name, latitude, longitude)
        {
            Routes = routes;
            LocalName = localName;
        }
    }
}
