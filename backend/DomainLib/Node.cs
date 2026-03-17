using System;

namespace DomainLib
{
    public abstract class Node
    {
        public double Latitude { get; init; }
        public double Longitude { get; init; }
        public string? Name { get; init; }

        public Node(double latitude, double longitude, string? name)
        {
            Latitude = latitude;
            Longitude = longitude;
            Name = name;
        }

    }
}
