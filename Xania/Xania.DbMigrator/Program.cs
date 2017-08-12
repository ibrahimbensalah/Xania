using System;
using System.Linq;
using System.Reflection;

namespace Xania.DbMigrator
{
    class Program
    {
        static void Main(string[] args)
        {
            var options = Options.FromArgs(args);

            Console.WriteLine($@"Action {options.Action}");

            if (options.Action?.HasFlag(ActionType.BackUp) == true)
                Runner.BackUp(options);
            if (options.Action?.HasFlag(ActionType.Upgrade) == true)
            {
                try
                {
                    Runner.Upgrade(options, Assembly.LoadFrom(options.Library));
                }
                catch (Exception ex)
                {
                    if (options.Action?.HasFlag(ActionType.Restore) != true)
                    {
                        Console.Error.WriteLine(ex.Message);
                        Console.WriteLine(ex);
                        Runner.RestoreAsync(options).Wait();
                    }
                }
            }
            if (options.Action?.HasFlag(ActionType.Validate) == true)
                Runner.ValidateDac(options);
            if (options.Action?.HasFlag(ActionType.Publish) == true)
                Runner.PublishDac(options);
            if (options.Action?.HasFlag(ActionType.Restore) == true)
                Runner.RestoreAsync(options).Wait();
        }
    }
}

