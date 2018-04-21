//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Linq.Expressions;
//using FluentAssertions;
//using NUnit.Framework;
//using Xania.Graphs.Linq;

//namespace Xania.Graphs.Runtime.Tests
//{
//    public class TraversalTests
//    {
//        [Test]
//        public void IdentityTraversalTest()
//        {
//            Expression<Func<Person, Person>> expr = p => p;
//            var traversal = GraphQueryProvider.ToTraversal(expr.Body);
//            traversal.HasMany().Should().BeFalse();
//        }

//        [Test]
//        public void ManyMemberTraversalTest()
//        {
//            Expression<Func<Person, IEnumerable<Person>>> expr = p => p.Friends;
//            var traversal = GraphQueryProvider.ToTraversal(expr.Body);
//            traversal.HasMany().Should().BeTrue();
//        }

//        [Test]
//        public void SingleFromManyMemberTraversalTest()
//        {
//            Expression<Func<Person, IEnumerable<int>>> expr = p => p.Friends.Select(e => e.Id);
//            var traversal = GraphQueryProvider.ToTraversal(expr.Body);
//            traversal.HasMany().Should().BeTrue();
//        }

//        [Test]
//        public void SingleFriendTraversalTest()
//        {
//            Expression<Func<Person, Person>> expr = p => p.Friend;
//            var traversal = GraphQueryProvider.ToTraversal(expr.Body);
//            traversal.HasMany().Should().BeFalse();
//        }

//        [Test]
//        public void SinglePropertyTraversalTest()
//        {
//            Expression<Func<Person, int>> expr = p => p.Id;
//            var traversal = GraphQueryProvider.ToTraversal(expr.Body);
//            traversal.HasMany().Should().BeFalse();
//        }
//    }
//}
