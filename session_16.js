var app = require("express")();
const { ApolloServer, gql, ForbiddenError } = require('apollo-server-express')
const { UserInputError, AuthenticationError } = require('apollo-server')
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

    type Mutation {
        addArticle(title: String!, body: String) : Article
        updateArticle(id: String!, title: String, body: String) : Article
        deleteArticle(id: String!) : Boolean
        registerUser(name: String!, email: String!, password: String!, age: Int!, address: String!) : Token!
        loginUser(email: String!, password: String!) : Token
    }

    type Token {
        token: String!
        user: User
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
        allUser: async (parent, args, { user }) => {
            let page = args.page || 1;
            let limit = args.limit || 10;

            if (!user) throw new ForbiddenError('Authenticated not set');

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
    Mutation: {
        addArticle: async (parent, args) => {
            let article = await ArticleModel.create({
                user: "5c46c0d169720e4bc0d05cc2",
                title: args.title,
                body: args.body,
            });

            return article
        },
        updateArticle: async (parent, args) => {
            // let article = await ArticleModel.updateOne({ _id : args.id } , {
            //     $set : {
            //         ...args
            //     }
            // });
            let article = await ArticleModel.findByIdAndUpdate(args.id, {
                ...args
            })
            if (!article) throw new Error("article ID not found !!")
            return await ArticleModel.findById(args.id);
        },
        deleteArticle: async (parent, args) => {
            let article = ArticleModel.findByIdAndRemove(args.id);
            if (!article) throw new Error("article ID not found !!");
            return true;
        },
        registerUser: async (parent, { name, email, age, address, password }, { api_secret_key }) => {
            let user = await UserModel.create({
                name,
                email,
                age,
                address,
                password: UserModel.hashPassword(password)
            })
            return {
                token: UserModel.createToken(user, api_secret_key, "2h"),
                user
            }
        },
        loginUser: async (parent, { email, password }, { api_secret_key }) => {
            let user = await UserModel.findOne({ email });
            if (!user) throw new UserInputError("No User Found")

            let isValid = user.comparePassword(password);
            if (!isValid) throw new AuthenticationError("You don't have right permission")

            return {
                token: UserModel.createToken(user, api_secret_key, "2h"),
                user
            }
        }
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

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
        let api_secret_key = '435j32!@#!##$%@342k4rm2_234';
        let user = await UserModel.checkApiToken(req, api_secret_key);
        return {
            user,
            api_secret_key
        }
    }
});

server.applyMiddleware({ app })

const port = process.env.myPort || 4000;
app.listen(port, (err) => {
    if (err)
        console.log(err)
    else
        console.log(`app listen to port ${port}`);
});

