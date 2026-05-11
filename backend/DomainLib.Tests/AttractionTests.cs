using Xunit;
using DomainLib.Attractions;
using DomainLib.Interfaces;

namespace DomainLib.Tests
{
    public class AttractionTests
    {
        [Fact]
        public void Attraction_Constructor_SetsAllProperties()
        {
            var tags = new List<string> { "tourism=museum", "name=Test" };
            var attraction = new Attraction(1, "Музей", 54.63, 39.75, "Музеи и галереи", "Исторические музеи", 500.0, 30, tags);

            Assert.Equal((ulong)1, attraction.ID);
            Assert.Equal("Музей", attraction.Name);
            Assert.Equal(54.63, attraction.Latitude);
            Assert.Equal(39.75, attraction.Longitude);
            Assert.Equal("Музеи и галереи", attraction.Category);
            Assert.Equal("Исторические музеи", attraction.Subcategory);
            Assert.Equal(500.0, attraction.Square);
            Assert.Equal(30, attraction.EstimatedVisitMinutes);
            Assert.Equal(2, attraction.Tags.Count);
        }

        [Fact]
        public void Attraction_NullTags_CreatesEmptyList()
        {
            var attraction = new Attraction(1, "Тест", 0, 0, null, null, null, 10, null);

            Assert.NotNull(attraction.Tags);
            Assert.Empty(attraction.Tags);
        }

        [Fact]
        public void Attraction_NullName_AllowsNull()
        {
            var attraction = new Attraction(1, null, 0, 0, null, null, null, 10, null);
            Assert.Null(attraction.Name);
        }

        [Fact]
        public void Attraction_ImplementsIAttraction()
        {
            var attraction = new Attraction(1, "Тест", 54.63, 39.75, "Категория", "Подкатегория", null, 30, null);
            Assert.IsAssignableFrom<IAttraction>(attraction);
        }

        [Fact]
        public void Attraction_ZeroSquare_IsAllowed()
        {
            var attraction = new Attraction(1, "Тест", 0, 0, null, null, 0.0, 10, null);
            Assert.Equal(0.0, attraction.Square);
        }

        [Fact]
        public void Attraction_LargeId_HandledCorrectly()
        {
            ulong largeId = 9999999999;
            var attraction = new Attraction(largeId, "Тест", 0, 0, null, null, null, 10, null);
            Assert.Equal(largeId, attraction.ID);
        }
    }

    public class EventTests
    {
        [Fact]
        public void Event_Constructor_SetsAllProperties()
        {
            var ev = new Event(100, "Концерт рок-группы", 55.75, 37.62, EventCategory.Concert, 120);

            Assert.Equal((ulong)100, ev.ID);
            Assert.Equal("Концерт рок-группы", ev.Name);
            Assert.Equal(55.75, ev.Latitude);
            Assert.Equal(37.62, ev.Longitude);
            Assert.Equal(EventCategory.Concert, ev.Category);
            Assert.Equal(120, ev.EstimatedVisitMinutes);
        }

        [Fact]
        public void Event_ImplementsIAttraction()
        {
            var ev = new Event(1, "Тест", 0, 0, EventCategory.Exhibition, 60);
            Assert.IsAssignableFrom<IAttraction>(ev);
        }

        [Fact]
        public void Event_CanBeTreatedAsIAttraction()
        {
            IAttraction ev = new Event(1, "Выставка", 59.93, 30.33, EventCategory.Exhibition, 60);

            Assert.Equal((ulong)1, ev.ID);
            Assert.Equal("Выставка", ev.Name);
            Assert.Equal(EventCategory.Exhibition, ev.Category);
            Assert.Equal(60, ev.EstimatedVisitMinutes);
        }

        [Fact]
        public void Event_AllCategories_AreValid()
        {
            string[] categories = {
                EventCategory.Film, EventCategory.Exhibition, EventCategory.Concert,
                EventCategory.Festival, EventCategory.Fair, EventCategory.BusinessEvent,
                EventCategory.ChildrenEvent, EventCategory.CharityEvent
            };

            foreach (string cat in categories)
            {
                var ev = new Event(1, "Тест", 0, 0, cat, 60);
                Assert.Equal(cat, ev.Category);
            }

            Assert.Equal(8, categories.Length);
        }
    }
}