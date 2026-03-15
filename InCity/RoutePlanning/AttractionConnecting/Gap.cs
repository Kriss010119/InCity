using System;
using System.Collections.Generic;
using DomainLib.Stations;
using DomainLib.Interfaces;

namespace RoutePlanning.AttractionConnecting
{
    public class Gap<T> where T : IStation
    {
        public int Order { get; }
        public T StartNode { get; }
        public T EndNode { get; }
        public T[] NodesVisited { get; }
        public string Transport { get; }
        public string RouteNumber { get; }

        public Gap(int order, T startNode, T endNode, T[] nodesVisited, string transport, string routeNumber)
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
