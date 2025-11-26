import { ApolloClient, InMemoryCache, HttpLink, split, ApolloProvider } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'

// Replace these with your actual Hasura endpoints
const HASURA_HTTP = import.meta.env.VITE_HASURA_HTTP || 'YOUR_HASURA_HTTP_ENDPOINT'
const HASURA_WS = import.meta.env.VITE_HASURA_WS || 'YOUR_HASURA_WS_ENDPOINT'
const HASURA_ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET || 'YOUR_HASURA_ADMIN_SECRET'

const httpLink = new HttpLink({
  uri: HASURA_HTTP,
  headers: {
    'x-hasura-admin-secret': HASURA_ADMIN_SECRET
  }
})

const wsLink = new GraphQLWsLink(createClient({
  url: HASURA_WS,
  connectionParams: {
    headers: {
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET
    }
  }
}))

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLink
)

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
})

export default client