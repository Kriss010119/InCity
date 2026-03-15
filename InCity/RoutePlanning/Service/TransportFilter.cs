using System;

namespace RoutePlanning.Service
{
    public struct TransportFilter
    {
        public bool BusesIncluded = true;
        public bool TramsIncluded = true;
        public bool TrolleybusesIncluded = true;
        public bool MetroIncluded = true;

        public TransportFilter(bool buses, bool trams, bool trolleybuses, bool metro)
        {
            BusesIncluded = buses;
            TramsIncluded = trams;
            TrolleybusesIncluded = trolleybuses;
            MetroIncluded = metro;
        }
    }
}
