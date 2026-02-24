using System;
using System.Collections.Generic;

namespace EModelsLib.Attractions
{
    public static class VisitTimeEstimator
    {
        public static int EstimateVisitTime(Attraction attraction)
        {
            if (attraction == null)
            {
                return 0;
            }

            string[] constants =
            {
                AttractionCategories.MonumentsAndMemorials,
                AttractionCategories.TheatersAndConcertHalls,
                AttractionCategories.ScienceAndEducation,
                AttractionCategories.GastronomicObjects,
                AttractionCategories.ContemporaryArts,
            };

            if (constants.Contains(attraction.Category))
            {
                return BaseVisitTimes[attraction.Subcategory];
            }

            double time = BaseVisitTimes[attraction.Subcategory];

            if (attraction.Category == AttractionCategories.MuseumsAndGalleries)
            {
                if (attraction.Tags.Any(tag => tag.Contains("building:levels")))
                {
                    string levelsTag = attraction.Tags.Find(tag => tag.Contains("building:levels"))!;
                    if (int.TryParse(levelsTag[(levelsTag.IndexOf('=') + 1) .. ].Trim(), out int levels))
                    {
                        time *= levels < 6 ? ((levels / 2) + 1) : 3;
                    }
                }

                if (attraction.Square != null)
                {
                    if (attraction.Square > 20_000) time *= 2;
                    else if (attraction.Square > 10_000) time *= 1.7;
                    else if (attraction.Square > 5_000) time *= 1.35;
                    else if (attraction.Square < 400) time *= 0.8;
                }
            }

            if (attraction.Category == AttractionCategories.ArchitecturalObjects)
            {
                if (attraction.Subcategory == AttractionCategories.Architecture.Historic)
                {
                    if (attraction.Tags.Any(tag => tag.Contains("building:levels")))
                    {
                        string levelsTag = attraction.Tags.Find(tag => tag.Contains("building:levels"))!;
                        if (int.TryParse(levelsTag[(levelsTag.IndexOf('=') + 1)..].Trim(), out int levels))
                        {
                            time *= levels < 6 ? ((levels / 2) + 1) : 3;
                        }
                    }

                    if (attraction.Square != null)
                    {
                        if (attraction.Square > 20_000) time *= 2;
                        else if (attraction.Square > 10_000) time *= 1.7;
                        else if (attraction.Square > 5_000) time *= 1.35;
                        else if (attraction.Square < 400) time *= 0.8;
                    }
                }
                else
                {
                    if (attraction.Square != null)
                    {
                        if (attraction.Square > 200_000) time *= 1.5;
                        else if (attraction.Square < 100_000) time *= 0.7;
                    }
                }
            }

            if (attraction.Category == AttractionCategories.ParksAndGardens)
            {
                if (attraction.Square != null)
                {
                    if (attraction.Square > 3_000_000) time *= 5;
                    else if (attraction.Square > 1_000_000) time *= 3;
                    else if (attraction.Square > 400_000) time *= 2;
                    else if (attraction.Square < 80_000) time *= 0.6;
                    else if (attraction.Square < 40_000) time *= 0.3;
                }
                else
                {
                    time *= 0.3;
                }
            }

            if (attraction.Category == AttractionCategories.ReligiousObjects)
            {
                if (attraction.Square != null)
                {
                    if (attraction.Square > 10_000) time *= 1.3;
                }
            }

            if (attraction.Category == AttractionCategories.FamousPeoplePlaces)
            {
                if (attraction.Tags.Any(tag => tag.Contains("building:levels")))
                {
                    string levelsTag = attraction.Tags.Find(tag => tag.Contains("building:levels"))!;
                    if (int.TryParse(levelsTag[(levelsTag.IndexOf('=') + 1)..].Trim(), out int levels))
                    {
                        time *= levels < 4 ? ((levels / 2) + 1) : 2;
                    }
                }

                if (attraction.Square != null)
                {
                    if (attraction.Square > 20_000) time *= 2;
                    else if (attraction.Square > 10_000) time *= 1.7;
                    else if (attraction.Square > 5_000) time *= 1.35;
                    else if (attraction.Square < 400) time *= 0.8;
                }
            }

            if (attraction.Category == AttractionCategories.ChildrenObjects)
            {
                if (attraction.Subcategory == AttractionCategories.Children.Zoos)
                {
                    if (attraction.Square != null)
                    {
                        if (attraction.Square < 80_000) time *= 0.6666;
                        else if (attraction.Square < 40_000) time *= 0.5;
                        else if (attraction.Square < 20_000) time *= 0.3333;
                    }
                }
            }

            return (int)time;
        }

        private static readonly Dictionary<string, int> BaseVisitTimes = new Dictionary<string, int>
        {
            // Музеи и галереи
            { AttractionCategories.Museums.Historical, 30 },
            { AttractionCategories.Museums.Art, 40 },
            { AttractionCategories.Museums.Nature, 30 },
            { AttractionCategories.Museums.War, 20 },
            { AttractionCategories.Museums.Gallery, 20 },
            { AttractionCategories.Museums.General, 30 },

            // Архитектурные объекты
            { AttractionCategories.Architecture.Castles, 50 },
            { AttractionCategories.Architecture.Historic, 30 },

            // Парки и сады
            { AttractionCategories.Parks.Urban, 30 },
            { AttractionCategories.Parks.Natural, 40 },

            // Памятники
            { AttractionCategories.Monuments.Sculpture, 3 },
            { AttractionCategories.Monuments.Memorials, 1 },
            { AttractionCategories.Monuments.Fountains, 5 },

            // Театры и концертные залы
            { AttractionCategories.Theaters.Academic, 180 }, // Спектакль
            { AttractionCategories.Theaters.ConcertHalls, 120 }, // Концерт
            { AttractionCategories.Theaters.Cinemas, 120 }, // Фильм

            // Религиозные объекты
            { AttractionCategories.Religious.Christian, 15 },
            { AttractionCategories.Religious.Monasteries, 30 },
            { AttractionCategories.Religious.Muslim, 15 },
            { AttractionCategories.Religious.Jewish, 15 },

            // Наука и образование
            { AttractionCategories.ScienceEducation.Libraries, 40 },
            { AttractionCategories.ScienceEducation.Observatories, 30 },
            { AttractionCategories.ScienceEducation.Planetariums, 75 },

            // Гастрономия
            { AttractionCategories.Gastronomy.FineDining, 120 },
            { AttractionCategories.Gastronomy.Cafes, 45 },
            { AttractionCategories.Gastronomy.Restaurant, 90 },

            // Современное искусство
            { AttractionCategories.ContemporaryArt.Galleries, 60 },
            { AttractionCategories.ContemporaryArt.PublicArt, 20 },

            { AttractionCategories.FamousPeople.HouseMuseums, 30 },
            { AttractionCategories.FamousPeople.Residences, 30 },

            // Детские объекты
            { AttractionCategories.Children.Aquariums, 120 },
            { AttractionCategories.Children.Dolphinarium, 120 },
            { AttractionCategories.Children.Circuses, 120 },
            { AttractionCategories.Children.Zoos, 180 }
        };
    }
}