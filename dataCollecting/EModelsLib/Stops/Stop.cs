using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EModelsLib.Stops
{
    public abstract class Stop
    {
        public string Name { get; set; }
        public long Id { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public Stop(long id, string name, double latitude, double longitude)
        {
            Id = id;
            Name = name;
            Latitude = latitude;
            Longitude = longitude;
        }
    }
}
