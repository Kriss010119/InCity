using DomainLib.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DomainLib.Attractions
{
    public class Event : IAttraction
    {
        public ulong ID { get; }
        public string Name { get; }
        public double Latitude { get; }
        public double Longitude { get; }
        public string Category { get; }
        public int EstimatedVisitMinutes { get; }

        public Event(ulong id, string name, double latitude, double longitude, string category, int estimatedVisitMinutes)
        {
            ID = id;
            Name = name;
            Latitude = latitude;
            Longitude = longitude;
            Category = category;
            EstimatedVisitMinutes = estimatedVisitMinutes;
        }
    }
}
