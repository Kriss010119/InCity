using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DomainLib.Interfaces
{
    public interface IAttraction
    {
        ulong ID { get; }
        string? Name { get; }
        double Latitude { get; }
        double Longitude { get; }
        string? Category { get; }
        int EstimatedVisitMinutes { get; }
    }
}
