using System;
using System.Collections.Generic;
using DomainLib.Routes;

namespace TopLayer.Repositories
{
    /// <summary>
    /// Общий парсер для composite type route_info из PostgreSQL.
    /// Npgsql возвращает composite type массивы как object[] кортежей.
    /// </summary>
    internal static class SurfaceParseHelper
    {
        public static List<RouteInfo> ParseRouteInfoArray(object? routeInfoRaw)
        {
            List<RouteInfo> routes = new List<RouteInfo>();

            if (routeInfoRaw is object[] arr)
            {
                foreach (var item in arr)
                {
                    if (item is ValueTuple<int, string?, int> tuple)
                    {
                        routes.Add(new RouteInfo((ulong)tuple.Item1, tuple.Item2, tuple.Item3));
                    }
                }
            }

            return routes;
        }
    }
}