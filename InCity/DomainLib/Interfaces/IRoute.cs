using DomainLib.Enumerators;
using DomainLib.Routes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DomainLib.Interfaces
{
    public interface IRoute
    {
        ulong ID { get; }
        public string? RouteNumber { get; }
        public string? Name { get; }
        public List<IStation> Stops { get; }
    }
}
