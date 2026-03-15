using System;
using System.Collections.Generic;

namespace RoutePlanning.Service
{
    public class AttractionFilter
    {
        public string[] Categories { get; }
        public string[] Subcategories { get; }

        public AttractionFilter(string[] categories, string[] subCategories)
        {
            Categories = categories;
            Subcategories = subCategories;
        }
    }
}
