var app = require("express")();
const { ApolloServer, gql } = require('apollo-server-express')
const mongoose = require('mongoose');

// db connection
mongoose.connect("mongodb://localhost/graphql", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => { console.log("db connected"); })
  .catch(err => { console.error("db not connected!!", err) })

// Models
const UserModel = require('./models/user');
const ArticleModel = require('./models/article');
const CommentModel = require('./models/comment');

let typeDefs = gql`
    type Query {
        user(id: String): User,
        allUser(page: Int, limit: Int): userResult,
        article(id: String): Article,
        allArticle: [Article],
    }

    type userResult {
      users: [User],
      paginate: Paginate
    }

    type Paginate {
      total: Int
      limit: Int
      page: Int
      pages: Int
    }

    type User {
        name: String
        age: Int
        admin: Boolean
        email: String
        address: String
        articles: [Article]
    }

    type Article {
      user: User,
      comments: [Comment],
      title: String,
      body: String,
      createdAt: String,
      updatedAt: String,
    }

    type Comment {
      user: User,
      article: Article,
      approved: Boolean,
      comment: String
    }
`;

let resolvers = {
  Query: {
    user: async (parent, args) => await UserModel.findById(args.id),
    allUser: async (parent, args) => {
      let page = args.page || 1;
      let limit = args.limit || 10;
      let users = await UserModel.paginate({}, { page, limit })
      return {
        users: users.docs,
        paginate: {
          total: users.total,
          limit: users.limit,
          page: users.page,
          pages: users.pages
        }
      };
    },
    article: async (parent, args) => await ArticleModel.findById(args.id),
    allArticle: async () => await ArticleModel.find({}),
  },
  User: {
    articles: async (parent, args) => await ArticleModel.find({ user: parent.id })
  },
  Article: {
    user: async (parent, args) => await UserModel.findById(parent.user),
    comments: async (parent, args) => await CommentModel.find({ article: parent.id, approved: true })
  },
  Comment: {
    user: async (parent, args) => await UserModel.findById(parent.user),
    article: async (parent, args) => await ArticleModel.findById(parent.article)
  }
};

const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app })

const port = process.env.myPort || 4000;
app.listen(port, (err) => {
  if (err)
    console.log(err)
  else
    console.log(`app listen to port ${port}`);
});

