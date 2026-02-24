using System;
using System.Collections.Generic;
using EModelsLib.Routes;

namespace EModelsLib.Stops
{
    public class MetroStation : Stop
    {
        public List<string> Lines { get; set; }
        public List<MetroRouteInfo> Routes { get; set; }
        public bool IsTransfer { get; set; }
        public List<KeyValuePair<string, List<MetroRouteInfo>>> Transfers { get; set; }
        public string LocalName { get; set; }

        public MetroStation(long id, string name, double latitude, double longitude,
                           List<string> lines, string localName, List<MetroRouteInfo> routes)
            : base(id, name, latitude, longitude)
        {
            Lines = lines;
            LocalName = localName;
            Routes = routes ?? new List<MetroRouteInfo>();
            Transfers = new List<KeyValuePair<string, List<MetroRouteInfo>>>();
            IsTransfer = false;
        }

        public void AddTransfer(MetroStation metroStation)
        {
            Transfers.Add(new KeyValuePair<string, List<MetroRouteInfo>>(metroStation.Name, metroStation.Routes));
            IsTransfer = true;
        }
    }
}