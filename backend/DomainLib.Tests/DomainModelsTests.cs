using Xunit;
using DomainLib.Stations;
using DomainLib.Routes;
using DomainLib.Enumerators;
using DomainLib.Service;
using DomainLib.Interfaces;
using DomainLib.Attractions;

namespace DomainLib.Tests
{
    public class StationTests
    {
        [Fact]
        public void BusStop_Constructor_SetsAllProperties()
        {
            var routes = new List<RouteInfo> { new RouteInfo(1, "46", 5) };
            var stop = new BusStop(100, 59.95, 30.32, "Летний сад", routes, "Летний сад");

            Assert.Equal((ulong)100, stop.ID);
            Assert.Equal(59.95, stop.Latitude);
            Assert.Equal(30.32, stop.Longitude);
            Assert.Equal("Летний сад", stop.Name);
            Assert.Equal(TransportType.Bus, stop.Type);
            Assert.Single(stop.Routes);
            Assert.Equal("Летний сад", stop.LocalName);
        }

        [Fact]
        public void BusStop_NullRoutes_CreatesEmptyList()
        {
            var stop = new BusStop(1, 0, 0, "Тест", null, null);

            Assert.NotNull(stop.Routes);
            Assert.Empty(stop.Routes);
        }

        [Fact]
        public void BusStop_ImplementsIStation()
        {
            var stop = new BusStop(1, 0, 0, "Тест", null, null);
            Assert.IsAssignableFrom<IStation>(stop);
        }

        [Fact]
        public void TramStop_HasCorrectTransportType()
        {
            var stop = new TramStop(1, 0, 0, "Тест", null, null);
            Assert.Equal(TransportType.Tram, stop.Type);
        }

        [Fact]
        public void TrolleybusStop_HasCorrectTransportType()
        {
            var stop = new TrolleybusStop(1, 0, 0, "Тест", null, null);
            Assert.Equal(TransportType.Trolleybus, stop.Type);
        }

        [Fact]
        public void MetroStation_Constructor_SetsProperties()
        {
            var routes = new List<MetroRouteInfo>
            {
                new MetroRouteInfo(1, "3", 5, "#FF0000")
            };
            var station = new MetroStation(200, 55.75, 37.62, "Арбатская", routes, null, "Арбатская");

            Assert.Equal((ulong)200, station.ID);
            Assert.Equal("Арбатская", station.Name);
            Assert.Equal(TransportType.Metro, station.Type);
            Assert.NotNull(station.Routes);
            Assert.Single(station.Routes);
            Assert.False(station.IsTransfer);
            Assert.Null(station.Transfers);
        }

        [Fact]
        public void MetroStation_WithTransfers_IsTransferTrue()
        {
            var routes = new List<MetroRouteInfo> { new MetroRouteInfo(1, "5", 10, "#8B4513") };
            var transferRoutes = new List<MetroRouteInfo> { new MetroRouteInfo(2, "6", 8, "#FF8C00") };
            var transfers = new List<KeyValuePair<ulong, List<MetroRouteInfo>>>
            {
                new KeyValuePair<ulong, List<MetroRouteInfo>>(300, transferRoutes)
            };

            var station = new MetroStation(200, 55.75, 37.62, "Октябрьская", routes, transfers, null);

            Assert.True(station.IsTransfer);
            Assert.NotNull(station.Transfers);
            Assert.Single(station.Transfers);
        }

        [Fact]
        public void MetroStation_EmptyTransfers_IsTransferFalse()
        {
            var station = new MetroStation(1, 0, 0, "Тест", null, new List<KeyValuePair<ulong, List<MetroRouteInfo>>>(), null);
            Assert.False(station.IsTransfer);
        }

        [Fact]
        public void MetroStation_NullRoutes_IsAllowed()
        {
            var station = new MetroStation(1, 0, 0, "Тест", null, null, null);
            Assert.Null(station.Routes);
        }
    }

    public class RouteInfoTests
    {
        [Fact]
        public void RouteInfo_Constructor_SetsProperties()
        {
            var ri = new RouteInfo(42, "76", 15);

            Assert.Equal((ulong)42, ri.RouteID);
            Assert.Equal("76", ri.RouteNumber);
            Assert.Equal(15, ri.Order);
        }

        [Fact]
        public void MetroRouteInfo_Constructor_SetsColorProperty()
        {
            var mri = new MetroRouteInfo(1, "3", 5, "#FF0000");

            Assert.Equal((ulong)1, mri.RouteID);
            Assert.Equal("3", mri.RouteNumber);
            Assert.Equal(5, mri.Order);
            Assert.Equal("#FF0000", mri.Color);
        }

        [Fact]
        public void MetroRouteInfo_InheritsFromRouteInfo()
        {
            var mri = new MetroRouteInfo(1, "3", 5, "#FF0000");
            Assert.IsAssignableFrom<RouteInfo>(mri);
        }

        [Fact]
        public void MetroRouteInfo_NullColor_IsAllowed()
        {
            var mri = new MetroRouteInfo(1, "3", 5, null);
            Assert.Null(mri.Color);
        }
    }

    public class RouteTests
    {
        [Fact]
        public void BusRoute_Constructor_SetsProperties()
        {
            var stops = new List<IStation>
            {
                new BusStop(1, 59.95, 30.32, "Остановка 1", null, null),
                new BusStop(2, 59.96, 30.33, "Остановка 2", null, null)
            };

            var route = new BusRoute(100, "46", "Маршрут 46", stops, "", "", "", "");

            Assert.Equal((ulong)100, route.ID);
            Assert.Equal("46", route.RouteNumber);
            Assert.Equal("Маршрут 46", route.Name);
            Assert.Equal(2, route.Stops.Count);
        }

        [Fact]
        public void BusRoute_NullStops_CreatesEmptyList()
        {
            var route = new BusRoute(1, "1", "Тест", [], "", "", "", "");

            Assert.NotNull(route.Stops);
            Assert.Empty(route.Stops);
        }

        [Fact]
        public void BusRoute_ImplementsIRoute()
        {
            var route = new BusRoute(1, "1", "Тест", null, "", "", "", "");
            Assert.IsAssignableFrom<IRoute>(route);
        }

        [Fact]
        public void TramRoute_InheritsFromRoute()
        {
            var route = new TramRoute(1, "5", "Трамвай 5", null, "", "", "", "");
            Assert.IsAssignableFrom<Route>(route);
        }

        [Fact]
        public void TrolleybusRoute_InheritsFromRoute()
        {
            var route = new TrolleybusRoute(1, "10", "Троллейбус 10", null, "", "", "", "");
            Assert.IsAssignableFrom<Route>(route);
        }
    }

    public class PairTests
    {
        [Fact]
        public void Pair_Constructor_SetsProperties()
        {
            var pair = new Pair<int, string>(42, "hello");

            Assert.Equal(42, pair.First);
            Assert.Equal("hello", pair.Second);
        }

        [Fact]
        public void Pair_MutableProperties_CanBeChanged()
        {
            var pair = new Pair<int, string>(1, "a");
            pair.First = 2;
            pair.Second = "b";

            Assert.Equal(2, pair.First);
            Assert.Equal("b", pair.Second);
        }

        [Fact]
        public void Pair_WithComplexTypes_WorksCorrectly()
        {
            var attractions = new[] { new Attraction(1, "Тест", 0, 0, null, null, null, 10, null) };
            var pair = new Pair<Attraction[], int>(attractions, 5);

            Assert.Single(pair.First);
            Assert.Equal(5, pair.Second);
        }

        [Fact]
        public void Pair_NullValues_Allowed()
        {
            var pair = new Pair<string?, int[]?>(null, null);

            Assert.Null(pair.First);
            Assert.Null(pair.Second);
        }
    }

    public class TransportTypeTests
    {
        [Fact]
        public void TransportType_HasFourValues()
        {
            var values = Enum.GetValues<TransportType>();
            Assert.Equal(4, values.Length);
        }

        [Fact]
        public void TransportType_ValuesAreCorrect()
        {
            Assert.Equal(0, (int)TransportType.Bus);
            Assert.Equal(1, (int)TransportType.Metro);
            Assert.Equal(2, (int)TransportType.Tram);
            Assert.Equal(3, (int)TransportType.Trolleybus);
        }
    }
}