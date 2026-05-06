using System;
using System.Text.Json.Serialization;

namespace MidLayer.Contracts
{
    public class RouteResponse
    {
        [JsonPropertyName("visitPoints")]
        public ClusterDto[] VisitPoints { get; set; } = [];

        [JsonPropertyName("sections")]
        public SectionDto[] Sections { get; set; } = [];
    }

    /// <summary>
    /// Составной объект: главная достопримечательность кластера + остальные.
    /// </summary>
    public class ClusterDto
    {
        [JsonPropertyName("mainAttraction")]
        public VisitPointDto MainAttraction { get; set; } = null!;

        [JsonPropertyName("otherAttractions")]
        public VisitPointDto[] OtherAttractions { get; set; } = [];

        [JsonPropertyName("estimatedTimeInMinutes")]
        public int EstimatedTimeInMinutes { get; set; }
    }

    public class VisitPointDto
    {
        [JsonPropertyName("id")]
        public ulong Id { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("latitude")]
        public double Latitude { get; set; }

        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }

        [JsonPropertyName("category")]
        public string? Category { get; set; }

        [JsonPropertyName("subcategory")]
        public string? Subcategory { get; set; }

        [JsonPropertyName("square")]
        public double? Square { get; set; }

        [JsonPropertyName("estimatedVisitMinutes")]
        public int EstimatedVisitMinutes { get; set; }

        [JsonPropertyName("osmType")]
        public string? OsmType { get; set; }

        [JsonPropertyName("tags")]
        public string[] Tags { get; set; } = [];
    }

    public class SectionDto
    {
        [JsonPropertyName("gaps")]
        public GapDto[] Gaps { get; set; } = [];

        [JsonPropertyName("estimatedTimeInMinutes")]
        public int EstimatedTimeInMinutes { get; set; }

        [JsonPropertyName("numberOfTransfers")]
        public int NumberOfTransfers { get; set; }
    }

    public class GapDto
    {
        [JsonPropertyName("startNode")]
        public NodeDto StartNode { get; set; } = null!;

        [JsonPropertyName("endNode")]
        public NodeDto EndNode { get; set; } = null!;

        [JsonPropertyName("transport")]
        public string Transport { get; set; } = "";

        [JsonPropertyName("routeNumber")]
        public string RouteNumber { get; set; } = "";

        [JsonPropertyName("nodesVisited")]
        public NodeDto[] NodesVisited { get; set; } = [];
    }

    public class NodeDto
    {
        [JsonPropertyName("nodeId")]
        public ulong NodeId { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("latitude")]
        public double Latitude { get; set; }

        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }

        [JsonPropertyName("role")]
        public string? Role { get; set; }

        [JsonPropertyName("sequence")]
        public int Sequence { get; set; }
    }
}