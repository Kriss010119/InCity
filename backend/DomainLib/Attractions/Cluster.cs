using System;
using System.Collections.Generic;
using DomainLib.Interfaces;


namespace DomainLib.Attractions
{
    public class Cluster
    {
        public string[] Categories { get; }
        public IAttraction[] Attractions { get; }
        public int EstimatedTime { get; }
        public double InterestRate { get; }

        public Cluster(string[] categories, IAttraction[] attractions)
        {
            Categories = categories;
            Attractions = attractions;

            double time = 0;
            double interestRateUnnormilized = 0;
            foreach (var attraction in attractions)
            {
                time += attraction.EstimatedVisitMinutes;
                if (attraction is Attraction)
                {
                    interestRateUnnormilized += GetTagCount(attraction) * 1.02;
                }
                else
                {
                    interestRateUnnormilized += 8;
                }
            }
            EstimatedTime = (int)(time / Math.Sqrt(attractions.Length));
            InterestRate = interestRateUnnormilized / attractions.Length;
        }

        private int GetTagCount(IAttraction attraction)
        {
            if (attraction is Attraction attr)
            {
                return attr.Tags.Count;
            }
            return 1;
        }
    }
}