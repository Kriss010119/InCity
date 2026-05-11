using Xunit;
using DomainLib;

namespace DomainLib.Tests
{
    public class SpatialMathTests
    {
        [Fact]
        public void Distance_SamePoint_ReturnsZero()
        {
            double result = SpatialMath.Distance(55.7558, 37.6173, 55.7558, 37.6173);
            Assert.Equal(0, result, precision: 1);
        }

        [Fact]
        public void Distance_MoscowToSaintPetersburg_ReturnsApprox634km()
        {
            // Москва (55.7558, 37.6173) — СПб (59.9343, 30.3351)
            double result = SpatialMath.Distance(55.7558, 37.6173, 59.9343, 30.3351);
            // Расстояние ~634 км
            Assert.InRange(result, 620_000, 650_000);
        }

        [Fact]
        public void Distance_ShortDistance_RyazanCenterToKremlin()
        {
            // Центр Рязани (54.6269, 39.7441) — Рязанский кремль (54.6362, 39.7502)
            double result = SpatialMath.Distance(54.6269, 39.7441, 54.6362, 39.7502);
            // Расстояние ~1070 м
            Assert.InRange(result, 900, 1200);
        }

        [Fact]
        public void Distance_IsSymmetric()
        {
            double d1 = SpatialMath.Distance(55.7558, 37.6173, 59.9343, 30.3351);
            double d2 = SpatialMath.Distance(59.9343, 30.3351, 55.7558, 37.6173);
            Assert.Equal(d1, d2, precision: 1);
        }

        [Fact]
        public void Distance_AlwaysNonNegative()
        {
            double result = SpatialMath.Distance(0, 0, -45.0, 120.0);
            Assert.True(result >= 0);
        }

        [Fact]
        public void InRadius_PointInsideRadius_ReturnsTrue()
        {
            // Две точки в Рязани на расстоянии ~1070 м, радиус 1500 м
            bool result = SpatialMath.InRadius(54.6269, 39.7441, 54.6362, 39.7502, 1500);
            Assert.True(result);
        }

        [Fact]
        public void InRadius_PointOutsideRadius_ReturnsFalse()
        {
            // Две точки в Рязани на расстоянии ~1070 м, радиус 500 м
            bool result = SpatialMath.InRadius(54.6269, 39.7441, 54.6362, 39.7502, 500);
            Assert.False(result);
        }

        [Fact]
        public void InRadius_SamePoint_ReturnsTrue()
        {
            bool result = SpatialMath.InRadius(55.7558, 37.6173, 55.7558, 37.6173, 1);
            Assert.True(result);
        }

        [Fact]
        public void InRadius_ExactBoundary_ReturnsTrue()
        {
            double dist = SpatialMath.Distance(54.6269, 39.7441, 54.6362, 39.7502);
            bool result = SpatialMath.InRadius(54.6269, 39.7441, 54.6362, 39.7502, (int)Math.Ceiling(dist));
            Assert.True(result);
        }

        [Fact]
        public void DegreesToRadians_ZeroDegrees_ReturnsZero()
        {
            Assert.Equal(0, SpatialMath.DegreesToRadians(0), precision: 10);
        }

        [Fact]
        public void DegreesToRadians_180Degrees_ReturnsPi()
        {
            Assert.Equal(Math.PI, SpatialMath.DegreesToRadians(180), precision: 10);
        }

        [Fact]
        public void DegreesToRadians_90Degrees_ReturnsHalfPi()
        {
            Assert.Equal(Math.PI / 2, SpatialMath.DegreesToRadians(90), precision: 10);
        }

        [Fact]
        public void DegreesToRadians_NegativeDegrees_ReturnsNegativeRadians()
        {
            Assert.Equal(-Math.PI, SpatialMath.DegreesToRadians(-180), precision: 10);
        }
    }
}