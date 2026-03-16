using System;
using System.Collections.Generic;
using System.Text.Json;
using DomainLib.Routes;

namespace TopLayer.Repositories
{
    internal static class SurfaceParseHelper
    {
        public static List<RouteInfo> ParseRouteInfoArray(object? routeInfoRaw)
        {
            List<RouteInfo> routes = new List<RouteInfo>();

            if (routeInfoRaw is string[] arr)
            {
                foreach (string item in arr)
                {
                    RouteInfoDto? dto = Deserialize<RouteInfoDto>(item);
                    if (dto != null)
                    {
                        routes.Add(new RouteInfo((ulong)dto.route_id, dto.route_number, dto.sequence_num));
                    }
                }
            }

            return routes;
        }

        private static T? Deserialize<T>(string json)
        {
            try
            {
                return JsonSerializer.Deserialize<T>(json);
            }
            catch
            {
                return default;
            }
        }

        private sealed class RouteInfoDto
        {
            public int route_id { get; set; }
            public string? route_number { get; set; }
            public int sequence_num { get; set; }
        }
    }
}
