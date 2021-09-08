const cors = require('cors');
const corsOptions = {
  origin: '*',
  maxAge: 31536000,
  methods: 'POST'
};
const {graphqlHTTP} = require('express-graphql');
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLSchema,
  GraphQLEnumType
} = require("graphql");

const ArticleType = new GraphQLObjectType({
  name: 'article',
  fields: () => ({
    id: { type: GraphQLString },
    source: { type: GraphQLString },
    author: { type: GraphQLString },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    url: { type: GraphQLString },
    urlToImage: { type: GraphQLString },
    publishedAt: { type: GraphQLString },
    content: { type: GraphQLString },
  })
});

const ArticleCategoryType = new GraphQLEnumType({
  name: 'category',
  values: {
    HEADLINE: { value: 'headline' },
    BUSINESS: { value: 'business' },
    ENTERTAINMENT: { value: 'entertainment' },
    HEALTH: { value: 'health' },
    SCIENCE: { value: 'science' },
    SPORTS: { value: 'sports' },
    TECHNOLOGY: { value: 'technology' },
  }
});


function getNewsGraphQL(path, app, elasticsearchService) {
  const QueryType = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      getNews: {
        type: new GraphQLList(ArticleType),
        args: {
          category: { type: ArticleCategoryType }
        },
        resolve: (source, {category}) => {
          return elasticsearchService.newsService.getLatestNewsInCategory(category);
        }
      }
    }
  });

  const schema = new GraphQLSchema({ query: QueryType });

  app.use(path, cors(corsOptions), graphqlHTTP({
    schema: schema,
    graphiql: true
  }))
}

module.exports = getNewsGraphQL;
