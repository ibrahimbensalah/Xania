CREATE PROCEDURE [dbo].[add_migration]
(
	@Id nchar(100),
	@Script text
)
AS
BEGIN
	DECLARE @exists BIT = 
		CASE WHEN EXISTS (SELECT * FROM DbMigrationHistory WHERE Id = @Id) THEN 1 ELSE 0 END

	MERGE INTO DbMigrationHistory as tar
	USING (
		VALUES (@Id, GETDATE(), @Script)
	) AS src (Id, [Date], [Script]) ON src.Id = tar.Id
	WHEN NOT MATCHED THEN
		INSERT (Id, [Date], [Script])
		VALUES (Id, [Date], [Script])
	WHEN MATCHED THEN
		UPDATE SET [Script] = src.[Script]
	;

	SELECT CASE WHEN @exists = 1 THEN CAST(0 AS BIT) ELSE CAST(1 AS BIT) END
END
