using System;
using System.Linq;
using System.Reflection;

namespace Xania.DbMigrator
{
    class Program
    {
        /// <summary>
        /// dbmigrator validate dacpacPath
        /// dbmigrator upgrade dacpac
        /// dbmigrator restore dacpac
        /// dbmigrator publish dacpac
        /// dbmigrator backup 
        /// </summary>
        /// <param name="args"></param>
        static void Main(string[] args)
        {
            var options = Options.FromArgs(args);

            Console.WriteLine($@"Action {options.Action}");

            if (options.Action?.HasFlag(ActionType.BackUp) == true)
                Runner.BackUp(options.BacPacFile, options.ConnectionString);
            if (options.Action?.HasFlag(ActionType.Upgrade) == true)
            {
                try
                {
                    Runner.Upgrade(options.ConnectionString, Assembly.LoadFrom(options.Library));
                }
                catch (Exception ex)
                {
                    if (options.Action?.HasFlag(ActionType.Restore) != true)
                    {
                        Console.Error.WriteLine(ex.Message);
                        Console.WriteLine(ex);
                        Runner.RestoreAsync(options.BacPacFile, options.ConnectionString).Wait();
                    }
                }
            }
            if (options.Action?.HasFlag(ActionType.Validate) == true)
                Runner.ValidateDac(options.DacPacFile, options.ConnectionString);
            if (options.Action?.HasFlag(ActionType.Publish) == true)
                Runner.PublishDac(options.DacPacFile, options.ConnectionString);
            if (options.Action?.HasFlag(ActionType.Restore) == true)
                Runner.RestoreAsync(options.BacPacFile, options.ConnectionString).Wait();
        }
    }
}

