using System;

namespace EModelsLib.Primitives
{
    public class OsmNode
    {
        public long Id { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Name { get; set; }

        public OsmNode(long id, double lat, double lon, string name)
        {
            Id = id;
            Latitude = lat;
            Longitude = lon;
            Name = name;
        }
    }
}
