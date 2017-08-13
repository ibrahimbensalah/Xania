..\.nuget\nuget.exe restore -PackagesDirectory ..\packages

msbuild
msbuild Xania.Railway.csproj /p:Configuration=NET40 /p:TargetFrameworkVersion=v4.0 /p:DefineConstants="NET4;TRACE" /p:OutputPath=bin\DebugNet40\

..\.nuget\nuget.exe pack -IncludeReferencedProjects .\Xania.Railway.csproj
