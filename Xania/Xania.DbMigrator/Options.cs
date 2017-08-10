using System;
using System.IO;
using Fclp;

namespace Xania.DbMigrator
{
    public class Options
    {
        private string _connectionString;
        private string _dacPacFile;
        private string _library;
        private string _properties;

        private Options _inner;
        private string _bacPacFile;
        private ActionType? _action;

        public string ConnectionString
        {
            get => _connectionString ?? _inner?.ConnectionString;
            set => _connectionString = value;
        }

        public string Library
        {
            get => _library ?? _inner?.Library;
            set => _library = value;
        }

        public string DacPacFile
        {
            get => _dacPacFile ?? _inner?.DacPacFile;
            set => _dacPacFile = value;
        }

        public string Properties
        {
            get => _properties;
            set
            {
                _properties = value;
                _inner = FromFile(value);
            }
        }

        public string BacPacFile
        {
            get => _bacPacFile ?? _inner?.BacPacFile;
            set => _bacPacFile = value;
        }

        public ActionType? Action
        {
            get => _action ?? _inner?.Action ?? ActionType.Default;
            set => _action = value;
        }

        private static Options FromFile(string file)
        {
            var result = new Options();
            foreach (var line in File.ReadAllText(file).Split('\n'))
            {
                var i = line.IndexOf(':');
                if (i > 0)
                {
                    var prop = line.Substring(0, i);
                    var value = line.Substring(i + 1);
                    switch (prop.Trim().ToLowerInvariant())
                    {
                        case "action":
                            result.Action = (ActionType)Enum.Parse(typeof(ActionType), value.Trim());
                            break;
                        case "bacpac":
                            result.BacPacFile = value.Trim();
                            break;
                        case "dacpac":
                            result.DacPacFile = value.Trim();
                            break;
                        case "library":
                        case "dll":
                            result.Library = value.Trim();
                            break;
                        case "connectionString":
                            result.ConnectionString = value.Trim();
                            break;
                        case "properties":
                        case "inherit":
                            result.Properties = value.Trim();
                            break;
                    }
                }
            }
            return result;
        }

        public static Options FromArgs(string[] args)
        {
            var p = new FluentCommandLineParser<Options>();

            p.Setup(arg => arg.ConnectionString)
                .As('c', "connectionString");

            p.Setup(arg => arg.Action)
                .As('a', "action");

            p.Setup(arg => arg.DacPacFile)
                .As('d', "dacpac");

            p.Setup(arg => arg.Properties)
                .As('f', "properties");

            p.Setup(arg => arg.Library)
                .As('l', "library");

            p.Parse(args);

            var options = p.Object;
            return options;

        }
    }

    [Flags]
    public enum ActionType
    {
        None = 0,
        BackUp = 1,
        Upgrade = 2,
        Default = 3,
        Restore = 4,
        All = 7
    }
}