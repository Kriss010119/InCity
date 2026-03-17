using System;
using DomainLib.Enumerators;

namespace DomainLib.Stations
{
    public class Station : Node
    {
        public TransportType Type { get; }
        public ulong ID { get; }

        public Station(ulong id, double latitude, double longitude, string? name, TransportType type) : base(latitude, longitude, name)
        {
            Type = type;
            ID = id;
        }
    }
}
