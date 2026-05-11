using Xunit;
using DomainLib.Attractions;
using DomainLib.Interfaces;

namespace DomainLib.Tests
{
    public class ClusterTests
    {
        private Attraction CreateAttraction(ulong id, string category, int visitMinutes, int tagCount)
        {
            var tags = new List<string>();
            for (int i = 0; i < tagCount; i++)
                tags.Add($"tag{i}=value{i}");

            return new Attraction(id, $"Attraction_{id}", 54.63, 39.75, category, null, null, visitMinutes, tags);
        }

        private Event CreateEvent(ulong id, string category, int visitMinutes)
        {
            return new Event(id, $"Event_{id}", 55.75, 37.62, category, visitMinutes);
        }

        [Fact]
        public void Cluster_SingleAttraction_EstimatedTimeEqualsVisitTime()
        {
            var attr = CreateAttraction(1, "Музеи", 30, 5);
            var cluster = new Cluster(["Музеи"], [attr]);

            // EstimatedTime = time / sqrt(1) = 30
            Assert.Equal(30, cluster.EstimatedTime);
        }

        [Fact]
        public void Cluster_TwoAttractions_EstimatedTimeDividedBySqrt2()
        {
            var attr1 = CreateAttraction(1, "Музеи", 30, 5);
            var attr2 = CreateAttraction(2, "Музеи", 40, 3);
            var cluster = new Cluster(["Музеи"], [attr1, attr2]);

            // EstimatedTime = (30 + 40) / sqrt(2) = 70 / 1.414 ≈ 49
            int expected = (int)(70.0 / Math.Sqrt(2));
            Assert.Equal(expected, cluster.EstimatedTime);
        }

        [Fact]
        public void Cluster_SingleAttraction_InterestRateBasedOnTags()
        {
            var attr = CreateAttraction(1, "Музеи", 30, 10);
            var cluster = new Cluster(["Музеи"], [attr]);

            Assert.Equal(10.2, cluster.InterestRate, precision: 5);
        }

        [Fact]
        public void Cluster_TwoAttractions_InterestRateIsAverage()
        {
            var attr1 = CreateAttraction(1, "Музеи", 30, 10);
            var attr2 = CreateAttraction(2, "Музеи", 20, 6);
            var cluster = new Cluster(["Музеи"], [attr1, attr2]);

            double expected = (10 * 1.02 + 6 * 1.02) / 2;
            Assert.Equal(expected, cluster.InterestRate, precision: 5);
        }

        [Fact]
        public void Cluster_SingleEvent_InterestRateFixedWeight()
        {
            var ev = CreateEvent(1, EventCategory.Concert, 120);
            var cluster = new Cluster([EventCategory.Concert], [ev]);

            // InterestRate = 8 / 1 = 8
            Assert.Equal(8.0, cluster.InterestRate, precision: 5);
        }

        [Fact]
        public void Cluster_SingleEvent_EstimatedTimeEqualsVisitTime()
        {
            var ev = CreateEvent(1, EventCategory.Concert, 120);
            var cluster = new Cluster([EventCategory.Concert], [ev]);

            Assert.Equal(120, cluster.EstimatedTime);
        }

        [Fact]
        public void Cluster_MixedAttractionAndEvent_InterestRateAveraged()
        {
            var attr = CreateAttraction(1, "Музеи", 30, 10);
            var ev = CreateEvent(2, EventCategory.Exhibition, 60);
            var cluster = new Cluster(["Музеи", EventCategory.Exhibition], [attr, ev]);

            // InterestRate = (10 * 1.02 + 8) / 2 = (10.2 + 8) / 2 = 9.1
            double expected = (10 * 1.02 + 8) / 2;
            Assert.Equal(expected, cluster.InterestRate, precision: 5);
        }

        [Fact]
        public void Cluster_EmptyCategories_DoesNotThrow()
        {
            var attr = CreateAttraction(1, "Музеи", 30, 5);
            var cluster = new Cluster([], [attr]);

            Assert.Empty(cluster.Categories);
            Assert.Single(cluster.Attractions);
        }

        [Fact]
        public void Cluster_CategoriesPreserved()
        {
            var attr = CreateAttraction(1, "Музеи", 30, 5);
            string[] categories = ["Музеи", "Парки"];
            var cluster = new Cluster(categories, [attr]);

            Assert.Equal(2, cluster.Categories.Length);
            Assert.Contains("Музеи", cluster.Categories);
            Assert.Contains("Парки", cluster.Categories);
        }

        [Fact]
        public void Cluster_AttractionsPreserved()
        {
            var attr1 = CreateAttraction(1, "Музеи", 30, 5);
            var attr2 = CreateAttraction(2, "Парки", 20, 3);
            var cluster = new Cluster(["Музеи", "Парки"], [attr1, attr2]);

            Assert.Equal(2, cluster.Attractions.Length);
            Assert.Equal((ulong)1, cluster.Attractions[0].ID);
            Assert.Equal((ulong)2, cluster.Attractions[1].ID);
        }

        [Fact]
        public void Cluster_ZeroTagsAttraction_InterestRateUsesTagCount()
        {
            var attr = CreateAttraction(1, "Музеи", 30, 0);
            var cluster = new Cluster(["Музеи"], [attr]);

            Assert.Equal(0.0, cluster.InterestRate, precision: 5);
        }

        [Fact]
        public void Cluster_ThreeAttractions_EstimatedTimeDividedBySqrt3()
        {
            var attr1 = CreateAttraction(1, "М", 30, 5);
            var attr2 = CreateAttraction(2, "М", 30, 5);
            var attr3 = CreateAttraction(3, "М", 30, 5);
            var cluster = new Cluster(["М"], [attr1, attr2, attr3]);

            int expected = (int)(90.0 / Math.Sqrt(3));
            Assert.Equal(expected, cluster.EstimatedTime);
        }
    }
}