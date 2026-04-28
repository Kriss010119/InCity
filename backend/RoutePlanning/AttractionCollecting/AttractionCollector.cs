using DomainLib.Interfaces;
using DomainLib.Attractions;
using DomainLib;
using DomainLib.Service;
using System;
using System.Collections.Generic;

namespace RoutePlanning.AttractionCollecting
{
    internal class AttractionCollector
    {
        private IAttraction[] _attractions;
        private List<Cluster> _clusters;

        private const double MinTimeFactor = 0.75;
        private const double MaxTimeFactor = 0.95;
        private const int LongRouteDurationThreshold = 300;
        private const double DistanceNormalizationMeters = 3000.0;
        private const int ReplacementCandidatesCount = 5;
        private const int MaxGastroClusters = 3;

        public AttractionCollector(IEnumerable<IAttraction> attractions)
        {
            _attractions = [.. attractions];
            ClusterCollector clusterCollector = new(_attractions);
            _clusters = clusterCollector.CreateClusters();
        }

        /// <summary>
        /// Отбирает кластеры достопримечательностей для маршрута на основании координат пользователя и желаемой длительности.
        /// Возвращает упорядоченный массив кластеров для посещения.
        /// </summary>
        public Cluster[] SelectClusters(double latitude, double longitude, int time)
        {
            if (_clusters.Count == 0)
            {
                return [];
            }

            int minTime = (int)(time * MinTimeFactor);
            int maxTime = (int)(time * MaxTimeFactor);
            int requiredGastro = time > LongRouteDurationThreshold ? 2 : 1;

            List<Cluster> selected = SelectByRating(_clusters, latitude, longitude, minTime, maxTime, requiredGastro);

            selected = OrderClusters(selected, latitude, longitude, time);

            return [.. selected];
        }

        /// <summary>
        /// Формирует набор из кластеров-кандидатов на замену целевого кластера в маршруте.
        /// Фактор расстояния учитывает позицию целевого кластера: высчитывается относительно соседей в маршруте.
        /// Замена не должна нарушать требование по количеству гастрономических кластеров.
        /// </summary>
        public Cluster[] GetReplacements(Cluster[] route, int targetIndex, double startLat, double startLon, int time)
        {
            if (targetIndex < 0 || targetIndex >= route.Length)
            {
                return [];
            }

            Cluster targetCluster = route[targetIndex];
            int requiredGastro = time > LongRouteDurationThreshold ? 2 : 1;

            bool targetIsGastro = IsGastronomyCluster(targetCluster);
            int gastroInRoute = CountGastronomyClusters(route);
            int gastroAfterRemoval = targetIsGastro ? gastroInRoute - 1 : gastroInRoute;

            HashSet<ulong> routeAttractionIds = CollectAttractionIds(route, targetIndex);

            double prevLat, prevLon;
            double nextLat, nextLon;
            bool hasNext;

            if (targetIndex == 0)
            {
                prevLat = startLat;
                prevLon = startLon;
            }
            else
            {
                prevLat = GetClusterCenterLatitude(route[targetIndex - 1]);
                prevLon = GetClusterCenterLongitude(route[targetIndex - 1]);
            }

            hasNext = targetIndex < route.Length - 1;
            if (hasNext)
            {
                nextLat = GetClusterCenterLatitude(route[targetIndex + 1]);
                nextLon = GetClusterCenterLongitude(route[targetIndex + 1]);
            }
            else
            {
                nextLat = 0;
                nextLon = 0;
            }

            double maxInterestRate = GetMaxInterestRate(_clusters);

            List<Pair<Cluster, double>> candidates = new List<Pair<Cluster, double>>();

            foreach (Cluster cluster in _clusters)
            {
                if (cluster == targetCluster)
                {
                    continue;
                }

                if (HasOverlappingAttractions(cluster, routeAttractionIds))
                {
                    continue;
                }

                if (!CanReplaceWithoutViolatingGastro(cluster, targetIsGastro, gastroAfterRemoval, requiredGastro))
                {
                    continue;
                }

                double distRate = hasNext
                    ? CalculateDistanceRateBetween(cluster, prevLat, prevLon, nextLat, nextLon)
                    : CalculateDistanceRate(cluster, prevLat, prevLon);

                double mvr = CalculateMustVisitRate(cluster.InterestRate, maxInterestRate, distRate);

                candidates.Add(new Pair<Cluster, double>(cluster, mvr));
            }

            candidates.Sort((a, b) => b.Second.CompareTo(a.Second));

            int resultCount = Math.Min(ReplacementCandidatesCount, candidates.Count);
            Cluster[] result = new Cluster[resultCount];

            for (int i = 0; i < resultCount; i++)
            {
                result[i] = candidates[i].First;
            }

            return result;
        }

        /// <summary>
        /// Вычисляет коэффициент удлинения маршрута на основе дистанции от кластера до опорной точки.
        /// Возвращает значение в диапазоне (0; 1], где 1 — кластер находится в опорной точке.
        /// </summary>
        private static double CalculateDistanceRate(Cluster cluster, double refLatitude, double refLongitude)
        {
            double centerLat = GetClusterCenterLatitude(cluster);
            double centerLon = GetClusterCenterLongitude(cluster);

            double distance = SpatialMath.Distance(refLatitude, refLongitude, centerLat, centerLon);

            return DistanceNormalizationMeters / (DistanceNormalizationMeters + distance);
        }

        /// <summary>
        /// Вычисляет коэффициент удлинения маршрута относительно двух опорных точек (предыдущий и следующий кластер).
        /// Итоговое значение — среднее из двух коэффициентов близости.
        /// </summary>
        private static double CalculateDistanceRateBetween(Cluster cluster,
            double prevLat, double prevLon, double nextLat, double nextLon)
        {
            double centerLat = GetClusterCenterLatitude(cluster);
            double centerLon = GetClusterCenterLongitude(cluster);

            double distToPrev = SpatialMath.Distance(prevLat, prevLon, centerLat, centerLon);
            double distToNext = SpatialMath.Distance(nextLat, nextLon, centerLat, centerLon);

            double ratePrev = DistanceNormalizationMeters / (DistanceNormalizationMeters + distToPrev);
            double rateNext = DistanceNormalizationMeters / (DistanceNormalizationMeters + distToNext);

            return (ratePrev + rateNext) / 2.0;
        }

        /// <summary>
        /// Вычисляет mustVisitRate — итоговый рейтинг кластера как среднее геометрическое
        /// нормализованного коэффициента интереса и коэффициента близости.
        /// </summary>
        private static double CalculateMustVisitRate(double interestRate, double maxInterestRate, double distanceRate)
        {
            double normalizedInterest = maxInterestRate > 0
                ? interestRate / maxInterestRate
                : 0;

            return Math.Sqrt(normalizedInterest * distanceRate);
        }

        /// <summary>
        /// Разделяет кластеры на гастрономические и остальные, сортирует каждый список по mustVisitRate,
        /// затем набирает нужное количество из каждого, укладываясь в допустимый диапазон времени.
        /// </summary>
        private static List<Cluster> SelectByRating(List<Cluster> allClusters, double startLat, double startLon,
            int minTime, int maxTime, int requiredGastro)
        {
            double maxInterestRate = GetMaxInterestRate(allClusters);

            List<Pair<Cluster, double>> gastroClusters = new List<Pair<Cluster, double>>();
            List<Pair<Cluster, double>> otherClusters = new List<Pair<Cluster, double>>();

            for (int i = 0; i < allClusters.Count; i++)
            {
                double distRate = CalculateDistanceRate(allClusters[i], startLat, startLon);
                double mvr = CalculateMustVisitRate(allClusters[i].InterestRate, maxInterestRate, distRate);

                Pair<Cluster, double> entry = new(allClusters[i], mvr);

                if (IsGastronomyCluster(allClusters[i]))
                {
                    gastroClusters.Add(entry);
                }
                else
                {
                    otherClusters.Add(entry);
                }
            }

            gastroClusters.Sort((a, b) => b.Second.CompareTo(a.Second));
            otherClusters.Sort((a, b) => b.Second.CompareTo(a.Second));

            List<Cluster> selected = new List<Cluster>();
            int currentTime = 0;

            int gastroToSelect = Math.Min(requiredGastro, MaxGastroClusters);
            FillFromSortedReferencingCount(gastroClusters, selected, ref currentTime, maxTime, gastroToSelect);

            FillFromSortedReferencingTime(otherClusters, selected, ref currentTime, minTime, maxTime);

            return selected;
        }

        /// <summary>
        /// Добавляет из отсортированного списка ровно count кластеров, не превышая maxTime.
        /// Возвращает количество фактически добавленных кластеров.
        /// </summary>
        private static int FillFromSortedReferencingCount(List<Pair<Cluster, double>> sorted, List<Cluster> selected,
            ref int currentTime, int maxTime, int count)
        {
            int added = 0;

            foreach (Pair<Cluster, double> entry in sorted)
            {
                if (added >= count)
                {
                    break;
                }

                if (currentTime + entry.First.EstimatedTime > maxTime)
                {
                    continue;
                }

                selected.Add(entry.First);
                currentTime += entry.First.EstimatedTime;
                added++;
            }

            return added;
        }

        /// <summary>
        /// Добавляет кластеры из отсортированного списка, пока суммарное время не достигнет minTime,
        /// не превышая maxTime.
        /// </summary>
        private static void FillFromSortedReferencingTime(List<Pair<Cluster, double>> sorted, List<Cluster> selected,
            ref int currentTime, int minTime, int maxTime)
        {
            foreach (Pair<Cluster, double> entry in sorted)
            {
                if (currentTime >= minTime)
                {
                    break;
                }

                if (currentTime + entry.First.EstimatedTime > maxTime)
                {
                    continue;
                }

                selected.Add(entry.First);
                currentTime += entry.First.EstimatedTime;
            }
        }

        /// <summary>
        /// Упорядочивает отобранные кластеры: гастрокластеры размещаются в середине (и в конце при длинных маршрутах),
        /// остальные упорядочиваются методом ближайшего соседа для минимизации дистанции.
        /// </summary>
        private static List<Cluster> OrderClusters(List<Cluster> selected, double startLat, double startLon, int time)
        {
            if (selected.Count <= 1)
            {
                return selected;
            }

            List<Cluster> gastroClusters = new List<Cluster>();
            List<Cluster> otherClusters = new List<Cluster>();

            foreach (Cluster cl in selected)
            {
                if (IsGastronomyCluster(cl))
                {
                    gastroClusters.Add(cl);
                }
                else
                {
                    otherClusters.Add(cl);
                }
            }

            List<Cluster> orderedOthers = OrderByNearestNeighbor(otherClusters, startLat, startLon);

            List<Cluster> result = new List<Cluster>();

            if (time >= LongRouteDurationThreshold && gastroClusters.Count >= 2)
            {
                Cluster gastroMiddle = gastroClusters[0];
                Cluster gastroEnd = gastroClusters[1];

                int middleIndex = orderedOthers.Count / 2;

                result.AddRange(orderedOthers.GetRange(0, middleIndex));
                result.Add(gastroMiddle);

                if (middleIndex < orderedOthers.Count)
                {
                    result.AddRange(orderedOthers.GetRange(middleIndex, orderedOthers.Count - middleIndex));
                }

                result.Add(gastroEnd);
            }
            else if (gastroClusters.Count >= 1)
            {
                Cluster gastroMiddle = gastroClusters[0];
                int middleIndex = orderedOthers.Count / 2;

                result.AddRange(orderedOthers.GetRange(0, middleIndex));
                result.Add(gastroMiddle);

                if (middleIndex < orderedOthers.Count)
                {
                    result.AddRange(orderedOthers.GetRange(middleIndex, orderedOthers.Count - middleIndex));
                }

                for (int i = 1; i < gastroClusters.Count; i++)
                {
                    result.Add(gastroClusters[i]);
                }
            }
            else
            {
                result.AddRange(orderedOthers);
            }

            return result;
        }

        /// <summary>
        /// Упорядочивает кластеры методом ближайшего соседа начиная от стартовой точки.
        /// </summary>
        private static List<Cluster> OrderByNearestNeighbor(List<Cluster> clusters, double startLat, double startLon)
        {
            if (clusters.Count <= 1)
            {
                return clusters;
            }

            List<Cluster> remaining = new List<Cluster>(clusters);
            List<Cluster> ordered = new List<Cluster>();

            double refLat = startLat;
            double refLon = startLon;

            while (remaining.Count > 0)
            {
                int nearestIndex = 0;
                double nearestDist = double.MaxValue;

                for (int i = 0; i < remaining.Count; i++)
                {
                    double dist = SpatialMath.Distance(refLat, refLon,
                        GetClusterCenterLatitude(remaining[i]),
                        GetClusterCenterLongitude(remaining[i]));

                    if (dist < nearestDist)
                    {
                        nearestDist = dist;
                        nearestIndex = i;
                    }
                }

                Cluster nearest = remaining[nearestIndex];
                ordered.Add(nearest);
                remaining.RemoveAt(nearestIndex);

                refLat = GetClusterCenterLatitude(nearest);
                refLon = GetClusterCenterLongitude(nearest);
            }

            return ordered;
        }

        /// <summary>
        /// Проверяет, можно ли заменить целевой кластер на кандидата без нарушения требования по гастрокластерам.
        /// </summary>
        private static bool CanReplaceWithoutViolatingGastro(Cluster candidate, bool targetWasGastro,
            int gastroAfterRemoval, int requiredGastro)
        {
            bool candidateIsGastro = IsGastronomyCluster(candidate);

            if (targetWasGastro && !candidateIsGastro && gastroAfterRemoval < requiredGastro)
            {
                return false;
            }

            return true;
        }

        /// <summary>
        /// Собирает ID всех достопримечательностей из маршрута, исключая целевой кластер.
        /// </summary>
        private static HashSet<ulong> CollectAttractionIds(Cluster[] route, int excludeIndex)
        {
            HashSet<ulong> ids = new HashSet<ulong>();

            for (int i = 0; i < route.Length; i++)
            {
                if (i == excludeIndex)
                {
                    continue;
                }

                foreach (IAttraction attr in route[i].Attractions)
                {
                    ids.Add(attr.ID);
                }
            }

            return ids;
        }

        /// <summary>
        /// Проверяет, содержит ли кластер достопримечательности, уже присутствующие в маршруте.
        /// </summary>
        private static bool HasOverlappingAttractions(Cluster cluster, HashSet<ulong> routeIds)
        {
            foreach (IAttraction attr in cluster.Attractions)
            {
                if (routeIds.Contains(attr.ID))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool IsGastronomyCluster(Cluster cluster)
        {
            foreach (string c in cluster.Categories)
            {
                if (c == AttractionCategories.GastronomicObjects)
                {
                    return true;
                }
            }

            return false;
        }

        private static int CountGastronomyClusters(Cluster[] clusters)
        {
            int count = 0;

            foreach (Cluster cl in clusters)
            {
                if (IsGastronomyCluster(cl))
                {
                    count++;
                }
            }

            return count;
        }

        private static double GetMaxInterestRate(List<Cluster> clusters)
        {
            double max = 0;

            foreach (Cluster cl in clusters)
            {
                if (cl.InterestRate > max)
                {
                    max = cl.InterestRate;
                }
            }

            return max > 0 ? max : 1;
        }

        private static double GetClusterCenterLatitude(Cluster cluster)
        {
            double sum = 0;
            foreach (IAttraction attr in cluster.Attractions)
            {
                sum += attr.Latitude;
            }

            return sum / cluster.Attractions.Length;
        }

        private static double GetClusterCenterLongitude(Cluster cluster)
        {
            double sum = 0;
            foreach (IAttraction attr in cluster.Attractions)
            {
                sum += attr.Longitude;
            }

            return sum / cluster.Attractions.Length;
        }
    }
}