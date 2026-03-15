using System;
using System.Collections.Generic;
using DomainLib.Attractions;

namespace MidLayer.Mapping
{
    /// <summary>
    /// Маппинг строковых ключей из фронтенда на доменные константы.
    /// </summary>
    public static class FrontendKeyMap
    {
        public static readonly Dictionary<string, int> DurationMap = new Dictionary<string, int>
        {
            { "very-short", 105 },
            { "short", 160 },
            { "medium", 300 },
            { "long", 450 }
        };

        public static readonly Dictionary<string, string> CategoryMap = new Dictionary<string, string>
        {
            { "museum", AttractionCategories.MuseumsAndGalleries },
            { "park-and-garden", AttractionCategories.ParksAndGardens },
            { "architecture", AttractionCategories.ArchitecturalObjects },
            { "monument", AttractionCategories.MonumentsAndMemorials },
            { "theatre", AttractionCategories.TheatersAndConcertHalls },
            { "religious", AttractionCategories.ReligiousObjects },
            { "science-education", AttractionCategories.ScienceAndEducation },
            { "gastronomy", AttractionCategories.GastronomicObjects },
            { "contemporary-art", AttractionCategories.ContemporaryArts },
            { "famous-people", AttractionCategories.FamousPeoplePlaces },
            { "children", AttractionCategories.ChildrenObjects }
        };

        public static readonly Dictionary<string, string> SubcategoryMap = new Dictionary<string, string>
        {
            { "historical", AttractionCategories.Museums.Historical },
            { "art", AttractionCategories.Museums.Art },
            { "nature", AttractionCategories.Museums.Nature },
            { "war", AttractionCategories.Museums.War },
            { "gallery", AttractionCategories.Museums.Gallery },
            { "general-museum", AttractionCategories.Museums.General },
            { "historic-architecture", AttractionCategories.Architecture.Historic },
            { "castles", AttractionCategories.Architecture.Castles },
            { "urban", AttractionCategories.Parks.Urban },
            { "natural", AttractionCategories.Parks.Natural },
            { "sculpture", AttractionCategories.Monuments.Sculpture },
            { "memorials", AttractionCategories.Monuments.Memorials },
            { "fountains", AttractionCategories.Monuments.Fountains },
            { "academic", AttractionCategories.Theaters.Academic },
            { "concert-hall", AttractionCategories.Theaters.ConcertHalls },
            { "cinema-hall", AttractionCategories.Theaters.Cinemas },
            { "christian", AttractionCategories.Religious.Christian },
            { "monasteries", AttractionCategories.Religious.Monasteries },
            { "muslim", AttractionCategories.Religious.Muslim },
            { "jewish", AttractionCategories.Religious.Jewish },
            { "libraries", AttractionCategories.ScienceEducation.Libraries },
            { "observatories", AttractionCategories.ScienceEducation.Observatories },
            { "planetariums", AttractionCategories.ScienceEducation.Planetariums },
            { "restaurant", AttractionCategories.Gastronomy.Restaurant },
            { "cafe", AttractionCategories.Gastronomy.Cafes },
            { "fine-dining", AttractionCategories.Gastronomy.FineDining },
            { "contemporary-galleries", AttractionCategories.ContemporaryArt.Galleries },
            { "public-art", AttractionCategories.ContemporaryArt.PublicArt },
            { "house-museums", AttractionCategories.FamousPeople.HouseMuseums },
            { "residences", AttractionCategories.FamousPeople.Residences },
            { "aquariums", AttractionCategories.Children.Aquariums },
            { "dolphinarium", AttractionCategories.Children.Dolphinarium },
            { "circuses", AttractionCategories.Children.Circuses },
            { "zoos", AttractionCategories.Children.Zoos }
        };

        public static readonly Dictionary<string, string> EventCategoryMap = new Dictionary<string, string>
        {
            { "cinema", EventCategory.Film },
            { "exhibitions", EventCategory.Exhibition },
            { "concerts", EventCategory.Concert },
            { "festivals", EventCategory.Festival },
            { "fairs", EventCategory.Fair },
            { "business", EventCategory.BusinessEvent },
            { "kids-events", EventCategory.ChildrenEvent },
            { "charity", EventCategory.CharityEvent }
        };
    }
}