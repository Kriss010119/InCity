using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EModelsLib.Stops
{
    public class MetroStationInfo
    {
        public string Name { get; set; }
        public string LocalName { get; set; }
        public string Line { get; set; }

        public MetroStationInfo(string name, string localName, string line)
        {
            Name = name;
            LocalName = localName;
            Line = line;
        }
    }
}
