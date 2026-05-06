using DomainLib.Interfaces;
using DomainLib.Service;

namespace DomainLib.Attractions
{
    /// <summary>
    /// Класс, работающий с отфильтрованным по типу достопримечательностей массивом и формирующий на его основе кластеры объектов.
    /// Кластеризация учитывает правила совместимости категорий.
    /// </summary>
    public class ClusterCollector
    {
        public List<Pair<IAttraction, bool>> Attractions { get; set; }

        /// <summary>
        /// Категории, объекты которых всегда образуют одиночные кластеры.
        /// </summary>
        private static readonly HashSet<string> SoloCategories = new HashSet<string>
        {
            AttractionCategories.MuseumsAndGalleries,
            AttractionCategories.TheatersAndConcertHalls,
            AttractionCategories.GastronomicObjects,
            AttractionCategories.ChildrenObjects,
            AttractionCategories.FamousPeoplePlaces,
            AttractionCategories.ScienceAndEducation,

            EventCategory.Film,
            EventCategory.Exhibition,
            EventCategory.Concert,
            EventCategory.Festival,
            EventCategory.Fair,
            EventCategory.BusinessEvent,
            EventCategory.ChildrenEvent,
            EventCategory.CharityEvent
    };

        /// <summary>
        /// Словарь правил совместимости: для каждой кластеризуемой категории перечислены категории,
        /// с которыми она может объединяться в кластер.
        /// </summary>
        private static readonly Dictionary<string, HashSet<string>> CompatibilityRules = new Dictionary<string, HashSet<string>>
        {
            {
                AttractionCategories.ReligiousObjects,
                new HashSet<string>
                {
                    AttractionCategories.ReligiousObjects,
                    AttractionCategories.ArchitecturalObjects
                }
            },
            {
                AttractionCategories.ContemporaryArts,
                new HashSet<string>
                {
                    AttractionCategories.ContemporaryArts
                }
            },
            {
                AttractionCategories.ParksAndGardens,
                new HashSet<string>
                {
                    AttractionCategories.ParksAndGardens,
                    AttractionCategories.MonumentsAndMemorials,
                    AttractionCategories.ArchitecturalObjects
                }
            },
            {
                AttractionCategories.ArchitecturalObjects,
                new HashSet<string>
                {
                    AttractionCategories.ArchitecturalObjects,
                    AttractionCategories.ReligiousObjects,
                    AttractionCategories.ParksAndGardens
                }
            },
            {
                AttractionCategories.MonumentsAndMemorials,
                new HashSet<string>
                {
                    AttractionCategories.MonumentsAndMemorials,
                    AttractionCategories.ParksAndGardens
                }
            }
        };

        public ClusterCollector(IEnumerable<IAttraction> attractions)
        {
            Attractions = new List<Pair<IAttraction, bool>>();
            foreach (IAttraction attraction in attractions)
            {
                Attractions.Add(new Pair<IAttraction, bool>(attraction, false));
            }
        }

        public List<Cluster> CreateClusters()
        {
            List<Cluster> ans = new List<Cluster>();

            for (int i = 0; i < Attractions.Count; i++)
            {
                if (Attractions[i].Second)
                {
                    continue;
                }

                Attractions[i].Second = true;
                IAttraction seed = Attractions[i].First;

                if (IsSoloCategory(seed.Category))
                {
                    ans.Add(new Cluster([seed.Category!], [seed]));
                    continue;
                }

                HashSet<string> categories = new HashSet<string> { seed.Category! };
                List<IAttraction> clust = new List<IAttraction> { seed };

                for (int j = i + 1; j < Attractions.Count; j++)
                {
                    if (Attractions[j].Second)
                    {
                        continue;
                    }

                    IAttraction candidate = Attractions[j].First;

                    if (IsSoloCategory(candidate.Category))
                    {
                        continue;
                    }

                    if (!AreCompatible(seed.Category!, candidate.Category!))
                    {
                        continue;
                    }

                    if (clust.Any(el => InRadius(el, candidate, 200)))
                    {
                        clust.Add(candidate);
                        categories.Add(candidate.Category!);
                        Attractions[j].Second = true;
                    }
                }

                ans.Add(new Cluster([.. categories], [.. clust]));
            }

            ResetFlags();

            return ans;
        }

        /// <summary>
        /// Проверяет, принадлежит ли категория к списку одиночных (некластеризуемых).
        /// </summary>
        private static bool IsSoloCategory(string? category)
        {
            if (category == null)
            {
                return true;
            }

            return SoloCategories.Contains(category);
        }

        /// <summary>
        /// Проверяет взаимную совместимость двух категорий для объединения в кластер.
        /// Обе категории должны допускать друг друга в своих правилах.
        /// </summary>
        private static bool AreCompatible(string category1, string category2)
        {
            if (!CompatibilityRules.TryGetValue(category1, out HashSet<string>? allowed1))
            {
                return false;
            }

            if (!allowed1.Contains(category2))
            {
                return false;
            }

            if (!CompatibilityRules.TryGetValue(category2, out HashSet<string>? allowed2))
            {
                return false;
            }

            return allowed2.Contains(category1);
        }

        /// <summary>
        /// Сбрасывает флаги использования достопримечательностей, чтобы позволить повторную кластеризацию.
        /// </summary>
        private void ResetFlags()
        {
            foreach (Pair<IAttraction, bool> pair in Attractions)
            {
                pair.Second = false;
            }
        }

        private static bool InRadius(IAttraction curr, IAttraction targ, int rad)
        {
            double lat1Rad = DegreesToRadians(curr.Latitude);
            double lon1Rad = DegreesToRadians(curr.Longitude);
            double lat2Rad = DegreesToRadians(targ.Latitude);
            double lon2Rad = DegreesToRadians(targ.Longitude);

            double deltaLat = lat2Rad - lat1Rad;
            double deltaLon = lon2Rad - lon1Rad;

            double a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
                       Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                       Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);

            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            double distance = 6371000 * c;

            return distance <= rad;
        }

        private static double DegreesToRadians(double degrees)
        {
            return degrees * Math.PI / 180.0;
        }
    }
}