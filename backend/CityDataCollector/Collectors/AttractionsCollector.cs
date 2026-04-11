using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using DomainLib.Attractions;
using CityDataCollector.Infrastructure;

namespace CityDataCollector.Collectors
{
    public class AttractionData
    {
        public long Id { get; set; }
        public string Name { get; set; } = "";
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Category { get; set; } = "";
        public string Subcategory { get; set; } = "";
        public double? Square { get; set; }
        public int EstimatedVisitMinutes { get; set; }
        public string OsmType { get; set; } = "";
        public List<string> Tags { get; set; } = new();
    }

    /// <summary>
    /// Сборщик достопримечательностей. Для каждой категории выполняет набор Overpass-запросов,
    /// результаты сохраняются по файлу на категорию.
    /// EstimatedVisitMinutes = 0 (рассчитывается алгоритмом маршрутизации).
    /// </summary>
    public class AttractionsCollector
    {
        private readonly OverpassClient _client;

        public AttractionsCollector(OverpassClient client)
        {
            _client = client;
        }

        /// <summary>
        /// Собирает все достопримечательности и возвращает словарь: имя файла → список объектов.
        /// </summary>
        public async Task<Dictionary<string, List<AttractionData>>> CollectAsync(string cityName, string cityNameEn)
        {
            FileLogger.Instance.Log($"  Начало сбора достопримечательностей для {cityName}");

            var results = new Dictionary<string, List<AttractionData>>();
            var seenIds = new HashSet<long>();

            var categories = GetCategoryQueries(cityName);

            foreach (var (fileKey, queries) in categories)
            {
                var categoryAttractions = new List<AttractionData>();

                foreach (var (queryKey, query, category, subcategory) in queries)
                {
                    var json = await _client.ExecuteQueryAsync(query);
                    if (json == null) continue;

                    var parsed = ParseAttractions(json, category, subcategory);

                    foreach (var a in parsed)
                    {
                        if (!seenIds.Contains(a.Id))
                        {
                            seenIds.Add(a.Id);
                            categoryAttractions.Add(a);
                        }
                    }

                    await Task.Delay(300);
                }

                if (categoryAttractions.Count > 0)
                {
                    string fileName = $"attractions_{fileKey}_{cityNameEn}.json";
                    results[fileName] = categoryAttractions;
                    FileLogger.Instance.Log($"    {fileKey}: {categoryAttractions.Count} объектов");
                }
            }

            FileLogger.Instance.Log($"  Достопримечательности: всего {seenIds.Count} объектов");
            return results;
        }

        private List<(string fileKey, List<(string key, string query, string cat, string subcat)> queries)> GetCategoryQueries(string city)
        {
            return new()
            {
                ("muzei_i_galerei", new()
                {
                    ("historical", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""museum""][""museum""=""history""](area.s); out geom;", AttractionCategories.MuseumsAndGalleries, AttractionCategories.Museums.Historical),
                    ("art", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""museum""][""museum""=""art""](area.s); out geom;", AttractionCategories.MuseumsAndGalleries, AttractionCategories.Museums.Art),
                    ("nature", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""museum""][""museum""=""nature""](area.s); out geom;", AttractionCategories.MuseumsAndGalleries, AttractionCategories.Museums.Nature),
                    ("war", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""museum""][""museum""=""war""](area.s); out geom;", AttractionCategories.MuseumsAndGalleries, AttractionCategories.Museums.War),
                    ("gallery", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""gallery""](area.s); out geom;", AttractionCategories.MuseumsAndGalleries, AttractionCategories.Museums.Gallery),
                    ("all_museums", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""museum""](area.s); out geom;", AttractionCategories.MuseumsAndGalleries, AttractionCategories.Museums.General),
                }),
                ("arkhitekturnye_obekty", new()
                {
                    ("historic", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; (nwr[""historic""=""manor""](area.s); nwr[""historic""=""castle""](area.s);); out geom;", AttractionCategories.ArchitecturalObjects, AttractionCategories.Architecture.Historic),
                    ("castles", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""historic""~""fort|fortress""](area.s); out geom;", AttractionCategories.ArchitecturalObjects, AttractionCategories.Architecture.Castles),
                }),
                ("parki_i_sady", new()
                {
                    ("parks", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""leisure""=""park""](area.s); out geom;", AttractionCategories.ParksAndGardens, AttractionCategories.Parks.Urban),
                    ("natural", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""leisure""=""nature_reserve""](area.s); out geom;", AttractionCategories.ParksAndGardens, AttractionCategories.Parks.Natural),
                }),
                ("pamyatniki_i_memorialy", new()
                {
                    ("monuments", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""historic""=""monument""](area.s); out geom;", AttractionCategories.MonumentsAndMemorials, AttractionCategories.Monuments.Sculpture),
                    ("memorials", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""historic""=""memorial""](area.s); out geom;", AttractionCategories.MonumentsAndMemorials, AttractionCategories.Monuments.Memorials),
                    ("sculptures", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""artwork""][""artwork_type""~""sculpture|statue""](area.s); out geom;", AttractionCategories.MonumentsAndMemorials, AttractionCategories.Monuments.Sculpture),
                    ("fountains", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""amenity""=""fountain""](area.s); out geom;", AttractionCategories.MonumentsAndMemorials, AttractionCategories.Monuments.Fountains),
                }),
                ("teatry_i_kontsertnye_ploshchadki", new()
                {
                    ("theaters", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; (nwr[""amenity""=""theatre""](area.s); nwr[""building""=""theatre""](area.s);); out geom;", AttractionCategories.TheatersAndConcertHalls, AttractionCategories.Theaters.Academic),
                    ("concerts", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""amenity""=""concert_hall""](area.s); out geom;", AttractionCategories.TheatersAndConcertHalls, AttractionCategories.Theaters.ConcertHalls),
                    ("cinemas", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""amenity""=""cinema""](area.s); out geom;", AttractionCategories.TheatersAndConcertHalls, AttractionCategories.Theaters.Cinemas),
                }),
                ("religioznye_obekty", new()
                {
                    ("churches", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; (nwr[""amenity""=""place_of_worship""][""religion""=""christian""](area.s); nwr[""building""=""church""](area.s);); out geom;", AttractionCategories.ReligiousObjects, AttractionCategories.Religious.Christian),
                    ("mosques", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""amenity""=""place_of_worship""][""religion""=""muslim""](area.s); out geom;", AttractionCategories.ReligiousObjects, AttractionCategories.Religious.Muslim),
                    ("monasteries", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""historic""=""monastery""](area.s); out geom;", AttractionCategories.ReligiousObjects, AttractionCategories.Religious.Monasteries),
                    ("synagogues", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""amenity""=""place_of_worship""][""religion""=""jewish""](area.s); out geom;", AttractionCategories.ReligiousObjects, AttractionCategories.Religious.Jewish),
                }),
                ("obekty_nauki_i_obrazovaniya", new()
                {
                    ("libraries", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""amenity""=""library""](area.s); out geom;", AttractionCategories.ScienceAndEducation, AttractionCategories.ScienceEducation.Libraries),
                    ("planetariums", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""planetarium""](area.s); out geom;", AttractionCategories.ScienceAndEducation, AttractionCategories.ScienceEducation.Planetariums),
                    ("observatories", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""man_made""=""observatory""](area.s); out geom;", AttractionCategories.ScienceAndEducation, AttractionCategories.ScienceEducation.Observatories),
                }),
                ("gastronomicheskie_obekty", new()
                {
                    ("restaurants", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; (nwr[""amenity""=""restaurant""][""website""](area.s); nwr[""amenity""=""restaurant""][""contact:website""](area.s);); out geom;", AttractionCategories.GastronomicObjects, AttractionCategories.Gastronomy.Restaurant),
                    ("fine_dining", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; (nwr[""amenity""=""restaurant""][""stars""](area.s); nwr[""amenity""=""restaurant""][""michelin""](area.s);); out geom;", AttractionCategories.GastronomicObjects, AttractionCategories.Gastronomy.FineDining),
                    ("cafes", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; (nwr[""amenity""=""cafe""][""website""](area.s); nwr[""amenity""=""cafe""][""contact:website""](area.s); nwr[""amenity""=""cafe""][""historic""](area.s);); out geom;", AttractionCategories.GastronomicObjects, AttractionCategories.Gastronomy.Cafes),
                }),
                ("sovremennoe_iskusstvo", new()
                {
                    ("artworks", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""artwork""](area.s); out geom;", AttractionCategories.ContemporaryArts, AttractionCategories.ContemporaryArt.PublicArt),
                    ("murals", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""artwork_type""=""mural""](area.s); out geom;", AttractionCategories.ContemporaryArts, AttractionCategories.ContemporaryArt.PublicArt),
                    ("contemporary", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""gallery""][""art""=""contemporary""](area.s); out geom;", AttractionCategories.ContemporaryArts, AttractionCategories.ContemporaryArt.Galleries),
                }),
                ("mesta_svyazannye_s_izvestnymi_lichnostyami", new()
                {
                    ("house_museums", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""museum""][""museum""~""house|person|memorial""](area.s); out geom;", AttractionCategories.FamousPeoplePlaces, AttractionCategories.FamousPeople.HouseMuseums),
                    ("historic_houses", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""historic""=""house""](area.s); out geom;", AttractionCategories.FamousPeoplePlaces, AttractionCategories.FamousPeople.Residences),
                }),
                ("detskie_obekty", new()
                {
                    ("zoos", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""zoo""](area.s); out geom;", AttractionCategories.ChildrenObjects, AttractionCategories.Children.Zoos),
                    ("aquariums", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""aquarium""](area.s); out geom;", AttractionCategories.ChildrenObjects, AttractionCategories.Children.Aquariums),
                    ("circuses", $@"[out:json][timeout:90]; area[name=""{city}""]->.s; nwr[""tourism""=""circus""](area.s); out geom;", AttractionCategories.ChildrenObjects, AttractionCategories.Children.Circuses),
                }),
            };
        }

        private List<AttractionData> ParseAttractions(string json, string category, string subcategory)
        {
            var list = new List<AttractionData>();

            try
            {
                using var doc = JsonDocument.Parse(json);
                foreach (var el in doc.RootElement.GetProperty("elements").EnumerateArray())
                {
                    try
                    {
                        if (!el.TryGetProperty("tags", out var tags)) continue;
                        string name = OsmParser.GetTag(tags, "name");
                        if (string.IsNullOrEmpty(name)) continue;

                        string type = el.GetProperty("type").GetString() ?? "";
                        double lat, lon;
                        double? square = null;

                        if (type == "node")
                        {
                            lat = el.GetProperty("lat").GetDouble();
                            lon = el.GetProperty("lon").GetDouble();
                        }
                        else
                        {
                            (lat, lon) = OsmParser.GetCenterCoordinates(el);
                            square = OsmParser.CalculateArea(el);
                        }

                        if (lat == 0 && lon == 0) continue;

                        list.Add(new AttractionData
                        {
                            Id = el.GetProperty("id").GetInt64(),
                            Name = name,
                            Latitude = lat,
                            Longitude = lon,
                            Category = category,
                            Subcategory = subcategory,
                            Square = square,
                            EstimatedVisitMinutes = 0, // рассчитывается основным алгоритмом
                            OsmType = type,
                            Tags = OsmParser.CollectAllTags(tags)
                        });
                    }
                    catch { continue; }
                }
            }
            catch (Exception ex)
            {
                FileLogger.Instance.LogError("  Ошибка парсинга достопримечательностей", ex);
            }

            return list;
        }
    }
}