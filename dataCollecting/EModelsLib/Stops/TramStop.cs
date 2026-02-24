using EModelsLib.Routes;
using System.Collections.Generic;

namespace EModelsLib.Stops
{
    public class TramStop : Stop
    {
        public List<RouteInfo> Routes { get; set; }
        public string LocalName { get; set; }

        public TramStop(long id, string name, double latitude, double longitude,
                       string localName, List<RouteInfo> routes)
            : base(id, name, latitude, longitude)
        {
            Routes = routes ?? new List<RouteInfo>();
            LocalName = localName;
        }
    }
}