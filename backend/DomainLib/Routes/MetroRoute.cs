using DomainLib.Stations;
using System;
using System.Collections.Generic;

namespace DomainLib.Routes
{
    public class MetroRoute
    {
        public ulong ID { get; }
        public string? RouteNumber { get; }
        public string? Name { get; }
        public List<MetroStation> Stations { get; }
        public string Color { get; }
        public string Line { get; }
        public string Operator { get; }
        public bool IsLoop { get => (Name ?? "").Contains("кольц", StringComparison.CurrentCultureIgnoreCase); }

        public MetroRoute(ulong id, string routeNumber, string name, List<MetroStation> stations, string color, string line, string op)
        {
            ID = id;
            RouteNumber = routeNumber;
            Name = name;
            Stations = stations;
            Color = color;
            Line = line;
            Operator = op;
        }
    }
}
