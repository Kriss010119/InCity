using System;
using System.Collections.Generic;
using DomainLib.Interfaces;

namespace DomainLib.Attractions
{
    public class Attraction : IAttraction
    {
        public ulong ID { get; }
        public string? Name { get; }
        public double Latitude { get; }
        public double Longitude { get; }
        public string? Category { get; }
        public string? Subcategory { get; }
        public double? Square { get; }
        public int EstimatedVisitMinutes { get; }
        public List<string> Tags { get; }

        public Attraction(ulong id, string? name, double latitude, double longitude, string? category, string? subcategory,
            double? square, int estimatedTime, List<string>? tags)
        {
            ID = id;
            Name = name;
            Latitude = latitude;
            Longitude = longitude;
            Category = category;
            Subcategory = subcategory;
            Square = square;
            EstimatedVisitMinutes = estimatedTime;
            Tags = tags ?? new List<string>();
        }
    }
}
