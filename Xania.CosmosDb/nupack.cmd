REM msbuild Xania.DbMigrator.csproj /p:Configuration=NET45 /p:TargetFrameworkVersion=v4.5 /p:DefineConstants="NET45;TRACE" /p:OutputPath=bin\DebugNet45\
msbuild Xania.CosmosDB.csproj /p:Configuration=Release /p:OutputPath=bin\Release\
..\.nuget\nuget.exe pack -IncludeReferencedProjects .\Xania.CosmosDB.csproj -Prop Configuration=Release
