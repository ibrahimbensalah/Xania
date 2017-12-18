# Xania.CosmosDB

Write Linq to connect to your Azure Cosmos Graph DB

```CSharp
var myFriends = 
  from p in peopleStore
  where p.Friend.Name == "Ibrahim"
  select p
```

## Getting Started

***Prerequisite**:
Create a cosmos db account following [these steps](https://docs.microsoft.com/nl-nl/azure/cosmos-db/documentdb-get-started)*
 and find the endpointurl and api security token to be able to connect to the database from external applications

In Visual Studio 2017 Community Edition, create a new Console App (.NET Framework) and target .net 4.6. 

Next go to `Package Manager Console` and run the following command to install the required tools to connect to Azure Cosmos DB

> Install-Package Xania.CosmosDB -pre

1. **Connect to Azure**

Go to Program.Main and add the following code snippet which will establish a connection to azure cosmos db

```CSharp
    static void Main(string[] args)
    {
        using (var client = new Client(EndpointUrl, PrimaryKey))
        {
            ...
```

2. **Insert new records**

Now that we have established a connection, first we will add a new record to the database

```CSharp
            ....
            var ibrahim = new Person()
            {
                FirstName = "Ibrahim",
                Friend = new Person() { FirstName = "Az" }
            };
            client.UpsertAsync(ibrahim).Wait();
            ....
```

3. **Query data**

```CSharp
            ....
            var people = client.Query<Person>();
            var array =
                from p in people
                where p.FirstName == "Ibrahim"
                select p;
        }
    }
```

---
## Querying data

Here are examples that show the possible linq queries that you can write to query a gremlin supported database like Cosmos Db.

----

`var people = db.Query<Person>()`

| Desc | LINQ | Gremlin |
| ---- | ---- | ------- |
| Select everybody  | ```from p in people select p ```   | g.V().hasLabel("person").as('p').union(identity(), outE()) |
| Select by Id | ```from p in people where p.Id == 1 select p ```   | ```g.V().hasLabel("person").has("id",eq("1")).union(identity(), outE())```|
| Select by parent's Id | ```from p in people where p.Parent.Id == 2 select p ```   | ```g.V().hasLabel("person").where(__.out('parent').has("id",eq("2"))).union(identity(), outE())```|
| Select all friends | ```from p in people where p.Id == 1 from f in p.Friends select f```   | ```g.V().hasLabel("person").has("id",eq("1")).as('p').out('friends').as('f').union(identity(), outE())``` |
| Select custom result | ```from p in people select new { p.FirstName } ```   | ??? suggestions are welcome |
| Join without connecting edge | from p in people join c in contacts on p.FirstName equals c.Name select c | ??? suggestions are welcome |

