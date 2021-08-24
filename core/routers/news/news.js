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


function getNewsGraphQL(path, app, mongoDBService) {
  const QueryType = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      getNews: {
        type: new GraphQLList(ArticleType),
        args: {
          category: { type: ArticleCategoryType }
        },
        resolve: (source, {category}) => {
          const data = mongoDBService.newsService.getNewsInCategory(category);
          return data.map(_ => ({
            source: _.source.name,
            author: _.author,
            title:  _.title,
            description:  _.description,
            url:  _.url,
            urlToImage:  _.urlToImage,
            publishedAt:  _.publishedAt,
            content:  _.content,
          }))
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
