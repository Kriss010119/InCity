using System.Text;
using System.Text.RegularExpressions;

namespace CityDataCollector.Infrastructure
{
    public static class Transliterator
    {
        private static readonly Dictionary<char, string> Map = new()
        {
            {'а', "a"}, {'б', "b"}, {'в', "v"}, {'г', "g"}, {'д', "d"},
            {'е', "e"}, {'ё', "yo"}, {'ж', "zh"}, {'з', "z"}, {'и', "i"},
            {'й', "y"}, {'к', "k"}, {'л', "l"}, {'м', "m"}, {'н', "n"},
            {'о', "o"}, {'п', "p"}, {'р', "r"}, {'с', "s"}, {'т', "t"},
            {'у', "u"}, {'ф', "f"}, {'х', "kh"}, {'ц', "ts"}, {'ч', "ch"},
            {'ш', "sh"}, {'щ', "shch"}, {'ъ', ""}, {'ы', "y"}, {'ь', ""},
            {'э', "e"}, {'ю', "yu"}, {'я', "ya"}
        };

        public static string ToLatin(string russianName)
        {
            var sb = new StringBuilder();

            foreach (char c in russianName.ToLower())
            {
                if (Map.TryGetValue(c, out string? t))
                    sb.Append(t);
                else if (char.IsLetterOrDigit(c) || c == ' ' || c == '-')
                    sb.Append(c);
                else
                    sb.Append('_');
            }

            string result = sb.ToString();
            result = Regex.Replace(result, @"\s+", "_");
            result = Regex.Replace(result, @"_+", "_");
            return result.Trim('_');
        }
    }
}