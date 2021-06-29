var app = require("express")();
const { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');
const cors = require("cors");

// db connection
const mongoose = require('mongoose');
const UserModel = require('./models/user');
const ArticleModel = require('./models/article');

var schema = buildSchema(`
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
        name: String,
        age: Int,
        admin: Boolean,
        email: String,
    }
    type Article {
      user: User,
      title: String,
      body: String,
      createdAt: String,
      updatedAt: String
    }
`);

let resolver = {
  user: async (args) => await UserModel.findById(args.id),
  allUser: async (args) => {
    let page = args.page || 1;
    let limit = args.limit || 10;
    let users = await UserModel.paginate({}, {page, limit})
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
  article: async (args) => await ArticleModel.findById(args.id),
  allArticle: async () => await ArticleModel.find({})
};

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: resolver,
  graphiql: true,
}));

mongoose
  .connect("mongodb://localhost/graphql", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("db connected");
  })
  .catch(err => {
    console.error("db not connected!!", err)
  })

const port = process.env.myPort || 4000;
app.listen(port, (err) => {
  if (err) console.log(err)
  else console.log(`app listen to port ${port}`);
});

