using System;
using System.Collections.Generic;
using DomainLib.Stations;
using DomainLib.Interfaces;

namespace RoutePlanning.AttractionConnecting
{
    public class Section
    {
        public Gap<IStation>[] Gaps {  get; }
        public MetroGap[] MetroGaps { get; }
        public int EstimatedTimeInMinutes { get; }
        public int NumberOfTransfers { get; }
        public bool MetrosFirst { get; }

        public Section(Gap<IStation>[] gaps, MetroGap[] metroGaps, int estimatedTimeInMinutes, int numberOfTransfers, bool metrosFirst)
        {
            Gaps = gaps;
            MetroGaps = metroGaps;
            EstimatedTimeInMinutes = estimatedTimeInMinutes;
            NumberOfTransfers = numberOfTransfers;
            MetrosFirst = metrosFirst;
        }
    }
}
