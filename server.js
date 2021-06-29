var app = require("express")();
const { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');
const cors = require("cors");

// db connection
const mongoose = require('mongoose');
const UserModel = require('./models/user');
const ArticleModel = require('./models/article');
const CommentModel = require('./models/comment');

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
        articles: [Article]
    }

    type Article {
      user: User,
      comments: [Comment]
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
`);

let resolver = {
  user: async (args) => { 
    let user = await UserModel.findById(args.id).populate('articles').exec();
    return user;
  },
  allUser: async (args) => {
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
  article: async (args) => {
    // first approach
    let article = await ArticleModel.findById(args.id).populate(['user']).exec();
    return article;

    // second approach
    /* let article = await ArticleModel.findById(args.id);
    let user = await UserModel.findById(article.user);
    return {
      // you can user ... seprator instead of two lines below
      // title: article.title,
      // body: article.body,
      ...article._doc,
      user: user
    } */
  },
  allArticle: async () => {
    let articles = await ArticleModel.find().populate(['user', {
      path: 'comments',
      match : {
        approved: true
      },
      populate: ['user']
    }]);
    return articles;
  }
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

