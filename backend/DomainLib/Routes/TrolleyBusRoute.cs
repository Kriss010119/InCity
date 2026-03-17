using DomainLib.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DomainLib.Routes
{
    public class TrolleybusRoute : Route
    {
        public string From { get; }
        public string To { get; }
        public string Operator { get; }
        public string Network { get; }

        public TrolleybusRoute(ulong id, string routeNumber, string name, List<IStation> stops, 
            string from, string to, string op, string network)
            : base(id, routeNumber, name, stops)
        {
            From = from;
            To = to;
            Operator = op;
            Network = network;
        }
    }
}
