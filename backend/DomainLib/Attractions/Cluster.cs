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
            EstimatedTime = 0;

            double interestRateUnnormilized = 0;

            if (categories.Length == 1 && categories[0] == AttractionCategories.GastronomicObjects)
            {
                foreach (IAttraction attr in attractions)
                {
                    if (attr is Attraction)
                    {
                        EstimatedTime = Math.Max(EstimatedTime, attr.EstimatedVisitMinutes);
                        interestRateUnnormilized += GetTagCount(attr);
                    }
                }
            }
            else
            {
                double time = 0;
                int flag = 0;
                int numOfGastro = 0;
                foreach (IAttraction attraction in attractions)
                {
                    if (attraction.Category == AttractionCategories.GastronomicObjects)
                    {
                        flag = 1;
                        numOfGastro++;
                    }
                    else
                    {
                        time += attraction.EstimatedVisitMinutes;
                    }

                    if (attraction is Attraction)
                    {
                        interestRateUnnormilized += GetTagCount(attraction) * attraction.EstimatedVisitMinutes * (attraction.Category == AttractionCategories.GastronomicObjects ? 1.03 : 1);
                    }
                    else
                    {
                        interestRateUnnormilized += 18 * attraction.EstimatedVisitMinutes;
                    }
                }
                EstimatedTime = (int)(time / Math.Sqrt(attractions.Length - numOfGastro)) + flag * 90;
            }

            InterestRate = interestRateUnnormilized / (double)EstimatedTime;
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