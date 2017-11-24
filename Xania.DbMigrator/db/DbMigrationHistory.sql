CREATE TABLE [dbo].[DbMigrationHistory]
(
	[Id] NCHAR(100) NOT NULL, 
	[Date] DATETIME NOT NULL, 
	[Script] TEXT NOT NULL, 
	CONSTRAINT [PK_DbMigrationHistory] PRIMARY KEY ([Id])
)