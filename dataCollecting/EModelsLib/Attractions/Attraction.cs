using System.Collections.Generic;

namespace EModelsLib.Attractions
{
    public class Attraction
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Category { get; set; }
        public string Subcategory { get; set; }
        public double? Square { get; set; }
        public int EstimatedVisitMinutes { get; set; }
        public string OsmType { get; set; }
        public List<string> Tags { get; set; } = new List<string>();
    }
}