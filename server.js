var express = require("express");
const { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');

var schema = buildSchema(`
    type Query {
        hello: String
    }
`);

var root = { hello: () => 'hello world!' };

var app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));


app.listen(4000, () => console.log('app running on http://localhost:4000/graphql'))