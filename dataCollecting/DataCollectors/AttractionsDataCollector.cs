using EModelsLib.Attractions;
using EModelsLib.Primitives;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using static EModelsLib.Attractions.AttractionCategories;
using System.Xml.Linq;
using EModelsLib.Interfaces;

namespace DataCollectors
{
    public class AttractionsDataCollector : BaseDataCollector, IDataCollector
    {
        public AttractionsDataCollector(string cityName) : base(cityName) { }

        public async Task CollectDataForCityAsync()
        {
            Console.WriteLine($"Начинаем сбор данных о достопримечательностях для города: {_cityName}\n");
            var cityNameEn = ConvertToEnglishTranslit(_cityName);
            Console.WriteLine($"Английское название файлов: {cityNameEn}\n");
            CreateDataDirectoryStructure(cityNameEn);

            var allAttractions = new List<Attraction>();

            // 1.МУЗЕИ И ГАЛЕРЕИ
            await CollectMuseumsAndGalleries(allAttractions, cityNameEn);

            // 2. АРХИТЕКТУРНЫЕ ОБЪЕКТЫ
            await CollectArchitecturalObjects(allAttractions, cityNameEn);

            // 3. ПАРКИ И САДЫ
            await CollectParksAndGardens(allAttractions, cityNameEn);

            // 4. ПАМЯТНИКИ И МЕМОРИАЛЫ
            await CollectMonumentsAndMemorials(allAttractions, cityNameEn);

            // 5. ТЕАТРЫ И КОНЦЕРТНЫЕ ПЛОЩАДКИ
            await CollectTheatersAndConcertHalls(allAttractions, cityNameEn);

            // 6. РЕЛИГИОЗНЫЕ ОБЪЕКТЫ
            await CollectReligiousObjects(allAttractions, cityNameEn);

            // 7. ОБЪЕКТЫ НАУКИ И ОБРАЗОВАНИЯ
            await CollectScienceAndEducationObjects(allAttractions, cityNameEn);

            // 8. ГАСТРОНОМИЧЕСКИЕ ОБЪЕКТЫ (только известные)
            await CollectGastronomicObjects(allAttractions, cityNameEn);

            // 9. СОВРЕМЕННОЕ ИСКУССТВО
            await CollectContemporaryArt(allAttractions, cityNameEn);

            // 10. МЕСТА, СВЯЗАННЫЕ С ИЗВЕСТНЫМИ ЛИЧНОСТЯМИ
            await CollectFamousPeoplePlaces(allAttractions, cityNameEn);

            // 11.ДЕТСКИЕ ОБЪЕКТЫ (только значимые)
            await CollectChildrenObjects(allAttractions, cityNameEn);

            if (allAttractions.Count == 0)
            {
                Console.WriteLine($"В городе {_cityName} не найдено достопримечательностей.");
                return;
            }

            Console.WriteLine($"\nНайдено {allAttractions.Count} достопримечательностей\n");

            Console.WriteLine("Рассчитываем примерное время посещения...");
            foreach (var attraction in allAttractions)
            {
                attraction.EstimatedVisitMinutes = VisitTimeEstimator.EstimateVisitTime(attraction);
            }

            await SaveAttractionsByCategory(allAttractions, cityNameEn);
        }

        private async Task CollectMuseumsAndGalleries(List<Attraction> attractions, string cityNameEn)
        {
            Console.WriteLine("1. МУЗЕИ И ГАЛЕРЕИ...");

            var queries = new Dictionary<string, (string query, string category, string subcategory)>
            {
                // Исторические музеи
                { "historical_museums",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""museum""][""museum""=""history""](area.searchArea);
                    out geom;",
                    AttractionCategories.MuseumsAndGalleries, AttractionCategories.Museums.Historical) },
                
                // Художественные музеи
                { "art_museums",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""museum""][""museum""=""art""](area.searchArea);
                    out geom;",
                    AttractionCategories.MuseumsAndGalleries, AttractionCategories.Museums.Art) },
                
                // Научно-технические музеи
                { "science_museums",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""museum""][""museum""=""nature""](area.searchArea);
                    out geom;",
                    AttractionCategories.MuseumsAndGalleries, AttractionCategories.Museums.Nature) },
                
                // Литературные музеи
                { "literature_museums",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""museum""][""museum""=""war""](area.searchArea);
                    out geom;",
                    AttractionCategories.MuseumsAndGalleries, AttractionCategories.Museums.War) },
                
                // Галереи
                { "galleries",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""gallery""](area.searchArea);
                    out geom;",
                    AttractionCategories.MuseumsAndGalleries, AttractionCategories.Museums.Gallery) },
                
                // Все музеи (резервный запрос)
                { "all_museums",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""museum""](area.searchArea);
                    out geom;",
                    AttractionCategories.MuseumsAndGalleries, AttractionCategories.Museums.General) }
            };

            await ProcessAttractionQueries(attractions, queries, "музеев и галерей");
        }

        private async Task CollectArchitecturalObjects(List<Attraction> attractions, string cityNameEn)
        {
            Console.WriteLine("2. АРХИТЕКТУРНЫЕ ОБЪЕКТЫ...");

            var queries = new Dictionary<string, (string query, string category, string subcategory)>
            {
                // Исторические здания
                { "historic_buildings",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    (nwr[""historic""=""manor""](area.searchArea); nwr[""historic""=""castle""](area.searchArea););
                    out geom;",
                    AttractionCategories.ArchitecturalObjects, AttractionCategories.Architecture.Historic) },
                
                // Замки и крепости
                { "castles_fortresses",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""historic""~""fort|fortress""](area.searchArea);
                    out geom;",
                    AttractionCategories.ArchitecturalObjects, AttractionCategories.Architecture.Castles) },
            };

            await ProcessAttractionQueries(attractions, queries, "архитектурных объектов");
        }

        private async Task CollectParksAndGardens(List<Attraction> attractions, string cityNameEn)
        {
            Console.WriteLine("3. ПАРКИ И САДЫ...");

            var queries = new Dictionary<string, (string query, string category, string subcategory)>
            {
                // Парки
                { "parks",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""leisure""=""park""](area.searchArea);
                    out geom;",
                    AttractionCategories.ParksAndGardens, AttractionCategories.Parks.Urban) },
                
                // Природные территории
                { "natural_areas",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""leisure""=""nature_reserve""](area.searchArea);
                    out geom;",
                    AttractionCategories.ParksAndGardens, AttractionCategories.Parks.Natural) }
            };

            await ProcessAttractionQueries(attractions, queries, "парков и садов");
        }

        private async Task CollectMonumentsAndMemorials(List<Attraction> attractions, string cityNameEn)
        {
            Console.WriteLine("4. ПАМЯТНИКИ И МЕМОРИАЛЫ...");

            var queries = new Dictionary<string, (string query, string category, string subcategory)>
            {
                // Памятники
                { "monuments",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""historic""=""monument""](area.searchArea);
                    out geom;",
                    AttractionCategories.MonumentsAndMemorials, AttractionCategories.Monuments.Sculpture) },
                
                // Мемориалы
                { "memorials",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""historic""=""memorial""](area.searchArea);
                    out geom;",
                    AttractionCategories.MonumentsAndMemorials, AttractionCategories.Monuments.Memorials) },
                
                // Скульптуры и статуи
                { "sculptures",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""artwork""][""artwork_type""~""sculpture|statue""](area.searchArea);
                    out geom;",
                    AttractionCategories.MonumentsAndMemorials, AttractionCategories.Monuments.Sculpture) },
                
                // Фонтаны
                { "fountains",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""amenity""=""fountain""](area.searchArea);
                    out geom;",
                    AttractionCategories.MonumentsAndMemorials, AttractionCategories.Monuments.Fountains) },
            };

            await ProcessAttractionQueries(attractions, queries, "памятников и мемориалов");
        }

        private async Task CollectTheatersAndConcertHalls(List<Attraction> attractions, string cityNameEn)
        {
            Console.WriteLine("5. ТЕАТРЫ И КОНЦЕРТНЫЕ ПЛОЩАДКИ...");

            var queries = new Dictionary<string, (string query, string category, string subcategory)>
            {
                // Театры
                { "theaters",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    (
                        nwr[""amenity""=""theatre""](area.searchArea);
                        nwr[""building""=""theatre""](area.searchArea);
                    );
                    out geom;",
                    AttractionCategories.TheatersAndConcertHalls, AttractionCategories.Theaters.Academic) },

                // Концертные залы
                { "concert_halls",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""amenity""=""concert_hall""](area.searchArea);
                    out geom;",
                    AttractionCategories.TheatersAndConcertHalls, AttractionCategories.Theaters.ConcertHalls) },

                // Кинотеатры
                { "cinemas",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""amenity""=""cinema""](area.searchArea);
                    out geom;",
                    AttractionCategories.TheatersAndConcertHalls, AttractionCategories.Theaters.Cinemas) },

                // Оперные театры
                { "opera",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""theatre:type""=""opera""](area.searchArea);
                    out geom;",
                    AttractionCategories.TheatersAndConcertHalls, AttractionCategories.Theaters.Academic) }
            };

            await ProcessAttractionQueries(attractions, queries, "театров и концертных залов");
        }

        private async Task CollectReligiousObjects(List<Attraction> attractions, string cityNameEn)
        {
            Console.WriteLine("6. РЕЛИГИОЗНЫЕ ОБЪЕКТЫ...");

            var queries = new Dictionary<string, (string query, string category, string subcategory)>
            {
                // Храмы и церкви (христианские)
                { "churches",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    (
                        nwr[""amenity""=""place_of_worship""][""religion""=""christian""](area.searchArea);
                        nwr[""historic""=""church""](area.searchArea);
                        nwr[""building""=""church""](area.searchArea);
                    );
                    out geom;",
                    AttractionCategories.ReligiousObjects, AttractionCategories.Religious.Christian) },
                
                // Мечети
                { "mosques",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""amenity""=""place_of_worship""][""religion""=""muslim""](area.searchArea);
                    out geom;",
                    AttractionCategories.ReligiousObjects, AttractionCategories.Religious.Muslim) },
                
                // Монастыри
                { "monasteries",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""historic""=""monastery""](area.searchArea);
                    out geom;",
                    AttractionCategories.ReligiousObjects, AttractionCategories.Religious.Monasteries) },
                
                // Синагоги
                { "synagogues",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""amenity""=""place_of_worship""][""religion""=""jewish""](area.searchArea);
                    out geom;",
                    AttractionCategories.ReligiousObjects, AttractionCategories.Religious.Jewish) }
            };

            await ProcessAttractionQueries(attractions, queries, "религиозных объектов");
        }

        private async Task CollectScienceAndEducationObjects(List<Attraction> attractions, string cityNameEn)
        {
            Console.WriteLine("7. ОБЪЕКТЫ НАУКИ И ОБРАЗОВАНИЯ...");

            var queries = new Dictionary<string, (string query, string category, string subcategory)>
            {
                // Библиотеки (исторические или крупные)
                { "libraries",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""amenity""=""library""](area.searchArea);
                    out geom;",
                    AttractionCategories.ScienceAndEducation, AttractionCategories.ScienceEducation.Libraries) },

                // Планетарии
                { "planetariums",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""planetarium""](area.searchArea);
                    out geom;",
                    AttractionCategories.ScienceAndEducation, AttractionCategories.ScienceEducation.Planetariums) },

                // Обсерватории
                { "observatories",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""man_made""=""observatory""](area.searchArea);
                    out geom;",
                    AttractionCategories.ScienceAndEducation, AttractionCategories.ScienceEducation.Observatories) },
            };

            await ProcessAttractionQueries(attractions, queries, "объектов науки и образования");
        }

        private async Task CollectGastronomicObjects(List<Attraction> attractions, string cityNameEn)
        {
            Console.WriteLine("8. ГАСТРОНОМИЧЕСКИЕ ОБЪЕКТЫ (только с сайтом)...");

            var queries = new Dictionary<string, (string query, string category, string subcategory)>
            {
                // РЕСТОРАНЫ С САЙТОМ
                { "restaurants_with_website",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    (
                        nwr[""amenity""=""restaurant""][""website""](area.searchArea);
                        nwr[""amenity""=""restaurant""][""contact:website""](area.searchArea);
                    );
                    out geom;",
                    AttractionCategories.GastronomicObjects, AttractionCategories.Gastronomy.Restaurant) },
        
                // РЕСТОРАНЫ С ВЫСОКИМ РЕЙТИНГОМ (Michelin, и т.д.)
                { "premium_restaurants",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    (
                        nwr[""amenity""=""restaurant""][""stars""](area.searchArea);
                        nwr[""amenity""=""restaurant""][""michelin""](area.searchArea);
                    );
                    out geom;",
                    AttractionCategories.GastronomicObjects, AttractionCategories.Gastronomy.FineDining) },
        
                // КАФЕ С САЙТОМ (известные)
                { "cafes_with_website",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    (
                        nwr[""amenity""=""cafe""][""website""](area.searchArea);
                        nwr[""amenity""=""cafe""][""contact:website""](area.searchArea);
                        nwr[""amenity""=""cafe""][""historic""](area.searchArea);
                    );
                    out geom;",
                    AttractionCategories.GastronomicObjects, AttractionCategories.Gastronomy.Cafes) }
            };

            await ProcessAttractionQueries(attractions, queries, "гастрономических объектов");
        }

        private async Task CollectContemporaryArt(List<Attraction> attractions, string cityNameEn)
        {
            Console.WriteLine("9. СОВРЕМЕННОЕ ИСКУССТВО...");

            var queries = new Dictionary<string, (string query, string category, string subcategory)>
            {
                // Произведения искусства
                { "artworks",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""artwork""](area.searchArea);
                    out geom;",
                    AttractionCategories.ContemporaryArts, AttractionCategories.ContemporaryArt.PublicArt) },
                
                // Муралы и граффити
                { "murals",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""artwork_type""=""mural""](area.searchArea);
                    out geom;",
                    AttractionCategories.ContemporaryArts, AttractionCategories.ContemporaryArt.PublicArt) },
                
                // Галереи современного искусства
                { "contemporary_galleries",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""gallery""][""art""=""contemporary""](area.searchArea);
                    out geom;",
                    AttractionCategories.ContemporaryArts, AttractionCategories.ContemporaryArt.Galleries) }
            };

            await ProcessAttractionQueries(attractions, queries, "объектов современного искусства");
        }

        private async Task CollectFamousPeoplePlaces(List<Attraction> attractions, string cityNameEn)
        {
            Console.WriteLine("10. МЕСТА, СВЯЗАННЫЕ С ИЗВЕСТНЫМИ ЛИЧНОСТЯМИ...");

            var queries = new Dictionary<string, (string query, string category, string subcategory)>
            {
                // Дома-музеи
                { "house_museums",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""museum""][""museum""~""house|person|memorial""](area.searchArea);
                    out geom;",
                    AttractionCategories.FamousPeoplePlaces, AttractionCategories.FamousPeople.HouseMuseums) },
                
                // Исторические дома
                { "historic_houses",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""historic""=""house""](area.searchArea);
                    out geom;",
                    AttractionCategories.FamousPeoplePlaces, AttractionCategories.FamousPeople.Residences) }
            };

            await ProcessAttractionQueries(attractions, queries, "мест, связанных с известными личностями");
        }

        private async Task CollectChildrenObjects(List<Attraction> attractions, string cityNameEn)
        {
            Console.WriteLine("11. ДЕТСКИЕ ОБЪЕКТЫ (только значимые)...");

            var queries = new Dictionary<string, (string query, string category, string subcategory)>
            {
                // Зоопарки
                { "zoos",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""zoo""](area.searchArea);
                    out geom;",
                    AttractionCategories.ChildrenObjects, AttractionCategories.Children.Zoos) },
                
                // Аквариумы
                { "aquariums",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""aquarium""](area.searchArea);
                    out geom;",
                    AttractionCategories.ChildrenObjects, AttractionCategories.Children.Aquariums) },
                
                // Цирки
                { "circuses",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""circus""](area.searchArea);
                    out geom;",
                    AttractionCategories.ChildrenObjects, AttractionCategories.Children.Circuses) },
                
                // Дельфинарии
                { "dolphinariums",
                    ($@"[out:json][timeout:90];
                    area[""name""=""{_cityName}""]->.searchArea;
                    nwr[""tourism""=""dolphinarium""](area.searchArea);
                    out geom;",
                    AttractionCategories.ChildrenObjects, AttractionCategories.Children.Dolphinarium) }
            };

            await ProcessAttractionQueries(attractions, queries, "детских объектов");
        }

        private async Task ProcessAttractionQueries(
            List<Attraction> attractions,
            Dictionary<string, (string query, string category, string subcategory)> queries,
            string categoryName)
        {
            int totalFound = 0;

            foreach (var queryInfo in queries)
            {
                var (query, category, subcategory) = queryInfo.Value;
                string json = string.Empty;

                for (int i = 0; i < 7; i++)
                {
                    try
                    {
                        json = await ExecuteOverpassQuery(query);
                        var categoryAttractions = ParseAttractions(json, category, subcategory);

                        if (categoryAttractions.Count > 0)
                        {
                            attractions.AddRange(categoryAttractions);
                            totalFound += categoryAttractions.Count;
                            Console.WriteLine($"   {subcategory}: {categoryAttractions.Count}");
                        }

                        break;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"   Ошибка при получении {subcategory} попытка {i + 1}: {ex.Message}");
                        if (i < 6) await Task.Delay(1000);
                    }
                }

                await Task.Delay(500);
            }

            Console.WriteLine($"   Всего {categoryName}: {totalFound}\n");
        }

        private List<Attraction> ParseAttractions(string json, string category, string subcategory)
        {
            var attractions = new List<Attraction>();

            try
            {
                using JsonDocument doc = JsonDocument.Parse(json);
                var elements = doc.RootElement.GetProperty("elements");

                foreach (var element in elements.EnumerateArray())
                {
                    try
                    {
                        var type = element.GetProperty("type").GetString();
                        
                        Attraction? attraction = null;
                        
                        if (type == "node")
                        {
                            attraction = ParseNode(element, category, subcategory);
                        }
                        else if (type == "way")
                        {
                            attraction = ParseWay(element, category, subcategory);
                        }
                        else if (type == "relation")
                        {
                            attraction = ParseRelation(element, category, subcategory);
                        }

                        if (attraction != null)
                        {
                            attractions.Add(attraction);
                        }
                    }
                    catch (Exception)
                    {
                        continue;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка парсинга достопримечательностей: {ex.Message}");
            }

            return attractions;
        }

        private Attraction ParseNode(JsonElement element, string category, string subcategory)
        {
            if (!element.TryGetProperty("tags", out var tags))
                return null;

            var name = GetTagValue(tags, "name");
            if (string.IsNullOrEmpty(name))
                return null;

            var attraction = new Attraction
            {
                Id = element.GetProperty("id").GetInt64(),
                Name = name,
                Latitude = element.GetProperty("lat").GetDouble(),
                Longitude = element.GetProperty("lon").GetDouble(),
                Category = category,
                Subcategory = subcategory,
                OsmType = "node",
                Square = null
            };

            EnrichAttractionWithTags(attraction, tags);
            return attraction;
        }

        private Attraction ParseWay(JsonElement element, string category, string subcategory)
        {
            if (!element.TryGetProperty("tags", out var tags))
                return null;

            var name = GetTagValue(tags, "name");
            if (string.IsNullOrEmpty(name))
                return null;

            var attraction = new Attraction
            {
                Id = element.GetProperty("id").GetInt64(),
                Name = name,
                Category = category,
                Subcategory = subcategory,
                OsmType = "way",
                Latitude = 0,
                Longitude = 0,
                Square = null
            };

            attraction.Square = CalculateWayArea(element);

            if (element.TryGetProperty("center", out var center))
            {
                attraction.Latitude = center.GetProperty("lat").GetDouble();
                attraction.Longitude = center.GetProperty("lon").GetDouble();
            }
            
            else if (element.TryGetProperty("bounds", out var bounds))
            {
                var minLat = bounds.GetProperty("minlat").GetDouble();
                var maxLat = bounds.GetProperty("maxlat").GetDouble();
                var minLon = bounds.GetProperty("minlon").GetDouble();
                var maxLon = bounds.GetProperty("maxlon").GetDouble();

                attraction.Latitude = (minLat + maxLat) / 2;
                attraction.Longitude = (minLon + maxLon) / 2;
            }
            
            else if (element.TryGetProperty("geometry", out var geometry) && geometry.GetArrayLength() > 0)
            {
                var firstPoint = geometry[0];
                attraction.Latitude = firstPoint.GetProperty("lat").GetDouble();
                attraction.Longitude = firstPoint.GetProperty("lon").GetDouble();
            }

            EnrichAttractionWithTags(attraction, tags);
            return attraction;
        }

        private Attraction ParseRelation(JsonElement element, string category, string subcategory)
        {
            if (!element.TryGetProperty("tags", out var tags))
                return null;

            var name = GetTagValue(tags, "name");
            if (string.IsNullOrEmpty(name))
                return null;

            var attraction = new Attraction
            {
                Id = element.GetProperty("id").GetInt64(),
                Name = name,
                Category = category,
                Subcategory = subcategory,
                OsmType = "relation",
                Latitude = 0,
                Longitude = 0,
                Square = null
            };

            attraction.Square = CalculateRelationArea(element);

            if (element.TryGetProperty("center", out var center))
            {
                attraction.Latitude = center.GetProperty("lat").GetDouble();
                attraction.Longitude = center.GetProperty("lon").GetDouble();
            }

            else if (element.TryGetProperty("bounds", out var bounds))
            {
                var minLat = bounds.GetProperty("minlat").GetDouble();
                var maxLat = bounds.GetProperty("maxlat").GetDouble();
                var minLon = bounds.GetProperty("minlon").GetDouble();
                var maxLon = bounds.GetProperty("maxlon").GetDouble();

                attraction.Latitude = (minLat + maxLat) / 2;
                attraction.Longitude = (minLon + maxLon) / 2;
            }

            else if (element.TryGetProperty("members", out var members))
            {

                foreach (var member in members.EnumerateArray())
                {
                    if (member.GetProperty("type").GetString() == "node" &&
                        member.TryGetProperty("lat", out var lat) &&
                        member.TryGetProperty("lon", out var lon))
                    {
                        attraction.Latitude = lat.GetDouble();
                        attraction.Longitude = lon.GetDouble();
                        break;
                    }
                }


                if (attraction.Latitude == 0 && attraction.Longitude == 0)
                {
                    foreach (var member in members.EnumerateArray())
                    {
                        if (member.GetProperty("type").GetString() == "way" &&
                            member.TryGetProperty("lat", out var lat) &&
                            member.TryGetProperty("lon", out var lon))
                        {
                            attraction.Latitude = lat.GetDouble();
                            attraction.Longitude = lon.GetDouble();
                            break;
                        }
                    }
                }
            }

            EnrichAttractionWithTags(attraction, tags);
            return attraction;
        }

        /// <summary>
        /// Вычисляет площадь отношения в квадратных метрах
        /// </summary>
        private double? CalculateRelationArea(JsonElement element)
        {
            try
            {
                if (element.TryGetProperty("tags", out var tags))
                {
                    var areaFromTags = GetAreaFromTags(tags);
                    if (areaFromTags > 0)
                        return areaFromTags;
                }

                if (element.TryGetProperty("bounds", out var bounds))
                {
                    return CalculateBoundsArea(bounds);
                }

                if (element.TryGetProperty("geometry", out var geometry) && geometry.GetArrayLength() > 2)
                {
                    return CalculatePolygonArea(geometry);
                }

                return null;
            }
            catch (Exception)
            {
                return null;
            }
        }

        /// <summary>
        /// Получает площадь из тегов (в квадратных метрах)
        /// </summary>
        private double GetAreaFromTags(JsonElement tags)
        {
            var areaStr = GetTagValue(tags, "area") ??
                          GetTagValue(tags, "building:area") ??
                          GetTagValue(tags, "landuse:area") ??
                          GetTagValue(tags, "measure:area");

            if (!string.IsNullOrEmpty(areaStr))
            {
                areaStr = areaStr.Replace(" ", "").Replace("m²", "").Replace("sqm", "").Replace("sq m", "").Trim();

                if (double.TryParse(areaStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out double area))
                {
                    return area;
                }

                var match = System.Text.RegularExpressions.Regex.Match(areaStr, @"(\d+(?:\.\d+)?)");
                if (match.Success && double.TryParse(match.Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out area))
                {
                    return area;
                }
            }

            return 0;
        }

        /// <summary>
        /// Вычисляет площадь по bounds (в квадратных метрах)
        /// </summary>
        private double CalculateBoundsArea(JsonElement bounds)
        {
            var minLat = bounds.GetProperty("minlat").GetDouble();
            var maxLat = bounds.GetProperty("maxlat").GetDouble();
            var minLon = bounds.GetProperty("minlon").GetDouble();
            var maxLon = bounds.GetProperty("maxlon").GetDouble();

            double avgLat = (minLat + maxLat) / 2 * Math.PI / 180;

            double latMetersPerDegree = 111320;

            double lonMetersPerDegree = 111320 * Math.Cos(avgLat);

            double width = (maxLon - minLon) * lonMetersPerDegree;
            double height = (maxLat - minLat) * latMetersPerDegree;

            return Math.Abs(width * height);
        }

        /// <summary>
        /// Вычисляет площадь полигона по геометрии (в квадратных метрах)
        /// </summary>
        private double CalculatePolygonArea(JsonElement geometry)
        {
            var points = new List<(double lat, double lon)>();

            foreach (var point in geometry.EnumerateArray())
            {
                if (point.TryGetProperty("lat", out var lat) && point.TryGetProperty("lon", out var lon))
                {
                    points.Add((lat.GetDouble(), lon.GetDouble()));
                }
            }

            if (points.Count < 3)
                return 0;

            double area = 0;
            for (int i = 0; i < points.Count; i++)
            {
                var p1 = points[i];
                var p2 = points[(i + 1) % points.Count];

                area += (p2.lon - p1.lon) * (Math.PI / 180) *
                        (2 + Math.Sin(p1.lat * Math.PI / 180) + Math.Sin(p2.lat * Math.PI / 180));
            }

            area = Math.Abs(area * 6371000 * 6371000 / 2);

            return area;
        }

        /// <summary>
        /// Вычисляет площадь для way (линии/полигона) в квадратных метрах
        /// </summary>
        private double? CalculateWayArea(JsonElement element)
        {
            try
            {
                if (element.TryGetProperty("tags", out var tags))
                {
                    var areaFromTags = GetAreaFromTags(tags);
                    if (areaFromTags > 0)
                        return areaFromTags;
                }

                if (element.TryGetProperty("bounds", out var bounds))
                {
                    return CalculateBoundsArea(bounds);
                }

                if (element.TryGetProperty("geometry", out var geometry) && geometry.GetArrayLength() > 2)
                {
                    return CalculatePolygonArea(geometry);
                }

                return null;
            }
            catch (Exception)
            {
                return null;
            }
        }

        private void EnrichAttractionWithTags(Attraction attraction, JsonElement tags)
        {
            attraction.Tags = CollectAllTags(tags);
        }

        private List<string> CollectAllTags(JsonElement tags)
        {
            var tagList = new List<string>();

            foreach (var property in tags.EnumerateObject())
            {
                tagList.Add($"{property.Name}={property.Value.GetString()}");
            }

            return tagList;
        }

        private async Task SaveAttractionsByCategory(List<Attraction> attractions, string cityNameEn)
        {
            // Группируем по категориям
            var groupedByCategory = attractions
                .GroupBy(a => a.Category)
                .ToDictionary(g => g.Key, g => g.ToList());

            foreach (var categoryGroup in groupedByCategory)
            {
                var categoryName = categoryGroup.Key;
                var categoryAttractions = categoryGroup.Value;

                // Создаем безопасное имя файла из категории
                var safeCategoryName = CreateSafeFileName(categoryName);
                var filename = Path.Combine(_cityFolderPath, $"attractions_{safeCategoryName}_{cityNameEn}.json");

                await _fileManager.SaveToJsonFile(categoryAttractions, filename);
                Console.WriteLine($"{categoryName} сохранены в {Path.GetFileName(filename)} ({categoryAttractions.Count} объектов)");
            }

            // Также сохраняем все достопримечательности в один файл
            var allFilename = Path.Combine(_cityFolderPath, $"attractions_all_{cityNameEn}.json");
            await _fileManager.SaveToJsonFile(attractions, allFilename);
            Console.WriteLine($"Все достопримечательности сохранены в {Path.GetFileName(allFilename)} ({attractions.Count} объектов)\n");
        }

        private string CreateSafeFileName(string input)
        {
            // Транслитерация и очистка для имени файла
            var transliterated = ConvertToEnglishTranslit(input);
            transliterated = transliterated.Replace(" ", "_")
                                          .Replace("__", "_")
                                          .Replace("___", "_")
                                          .Trim('_')
                                          .ToLower();

            // Ограничиваем длину
            if (transliterated.Length > 50)
            {
                transliterated = transliterated.Substring(0, 50);
            }

            return transliterated;
        }

        private static string GetTagValue(JsonElement tags, string tagName)
        {
            try
            {
                if (tags.TryGetProperty(tagName, out var tag))
                    return tag.GetString() ?? "";
            }
            catch
            {
                return "";
            }
            return "";
        }
    }
}