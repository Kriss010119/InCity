using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EModelsLib.Routes
{
    public sealed class RouteStop
    {
        public long NodeId { get; set; }
        public string Name { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Role { get; set; }
        public int Sequence { get; set; }

        public RouteStop(long nodeId, string name, double latitude, double longitude, string role, int sequence)
        {
            NodeId = nodeId;
            Name = name;
            Latitude = latitude;
            Longitude = longitude;
            Role = role;
            Sequence = sequence;
        }
    }
}
