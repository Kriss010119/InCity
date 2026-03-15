using DomainLib.Stations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RoutePlanning.AttractionConnecting
{
    public class MetroGap
    {
        public int Order { get; }
        public MetroStation StartNode { get; }
        public MetroStation EndNode { get; }
        public MetroStation[] NodesVisited { get; }
        public string Transport { get; }
        public string RouteNumber { get; }

        public MetroGap(int order, MetroStation startNode, MetroStation endNode, MetroStation[] nodesVisited, string transport, string routeNumber)
        {
            Order = order;
            StartNode = startNode;
            EndNode = endNode;
            NodesVisited = nodesVisited;
            Transport = transport;
            RouteNumber = routeNumber;
        }
    }
}
