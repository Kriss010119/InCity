using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using DomainLib.Routes;

namespace TopLayer.Repositories
{
    /// <summary>
    /// Парсер текстового представления composite type массивов из PostgreSQL.
    /// SQL-запросы кастят composite type массивы в ::text, чтобы Dapper мог их прочитать.
    /// </summary>
    internal static class SurfaceParseHelper
    {
        private static readonly Regex RouteInfoPattern = new Regex(
            @"\((\d+),([^,]*?),(\d+)\)", RegexOptions.Compiled);

        private static readonly Regex MetroLineInfoPattern = new Regex(
            @"\((\d+),([^,]*?),([^,]*?),(\d+)\)", RegexOptions.Compiled);

        private static readonly Regex MetroTransferPattern = new Regex(
            @"\(""?([^""(),]*?)""?,(\d+),([^,]*?),([^,]*?),(\d+)\)", RegexOptions.Compiled);

        public static List<RouteInfo> ParseRouteInfoText(string? text)
        {
            List<RouteInfo> routes = new List<RouteInfo>();

            if (string.IsNullOrEmpty(text) || text == "{}")
            {
                return routes;
            }

            foreach (Match match in RouteInfoPattern.Matches(text))
            {
                int routeId = int.Parse(match.Groups[1].Value);
                string routeNumber = match.Groups[2].Value.Trim('"');
                int sequence = int.Parse(match.Groups[3].Value);

                routes.Add(new RouteInfo((ulong)routeId, routeNumber, sequence));
            }

            return routes;
        }

        public static List<MetroRouteInfo> ParseMetroLineInfoText(string? text)
        {
            List<MetroRouteInfo> routes = new List<MetroRouteInfo>();

            if (string.IsNullOrEmpty(text) || text == "{}")
            {
                return routes;
            }

            HashSet<string> hs = new();
            foreach (Match match in MetroLineInfoPattern.Matches(text))
            {
                int lineId = int.Parse(match.Groups[1].Value);
                string routeNumber = match.Groups[2].Value.Trim('"');
                string color = match.Groups[3].Value.Trim('"');
                int sequence = int.Parse(match.Groups[4].Value);

                ulong routeId = (ulong)(lineId * 10);

                if (hs.Add(routeNumber))
                {
                    routeId += 1;
                }
                else
                {
                    routeId += 2;
                }
                routes.Add(new MetroRouteInfo(routeId, routeNumber, sequence, color));
            }

            return routes;
        }

        public static List<KeyValuePair<ulong, List<MetroRouteInfo>>> ParseMetroTransfersText(string? text)
        {
            var result = new Dictionary<ulong, List<MetroRouteInfo>>();

            if (string.IsNullOrEmpty(text) || text == "{}")
            {
                return new List<KeyValuePair<ulong, List<MetroRouteInfo>>>();
            }

            HashSet<string> hs = new();
            foreach (Match match in MetroTransferPattern.Matches(text))
            {
                ulong stationId = ulong.Parse(match.Groups[1].Value);
                int lineId = int.Parse(match.Groups[2].Value);
                string routeNumber = match.Groups[3].Value.Trim('"');
                string color = match.Groups[4].Value.Trim('"');
                int sequence = int.Parse(match.Groups[5].Value);

                ulong routeId = (ulong)(lineId * 10);

                if (hs.Add(routeNumber))
                {
                    routeId += 1;
                }
                else
                {
                    routeId += 2;
                }
                MetroRouteInfo mri = new MetroRouteInfo(routeId, routeNumber, sequence, color);

                if (!result.ContainsKey(stationId))
                {
                    result[stationId] = new List<MetroRouteInfo>();
                }
                result[stationId].Add(mri);
            }

            return new List<KeyValuePair<ulong, List<MetroRouteInfo>>>(result);
        }
    }
}