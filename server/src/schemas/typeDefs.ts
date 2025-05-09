const typeDefs = `
  type Book {
    bookId: ID!
    title: String
    authors: [String]
    description: String
    image: String
    link: String
  }

  input BookInput {
    bookId: ID!
    title: String!
    authors: [String!]!
    description: String!
    image: String
    link: String
  }

  type User {
    _id: ID!
    username: String!
    email: String!
    bookCount: Int
    savedBooks: [Book]
  }

  type Auth {
    token: ID!
    user: User
  }

  type Query {
    me: User
  }

  type Mutation {
    login(email: String!, password: String!): Auth
    addUser(username: String!, email: String!, password: String!): Auth
    saveBook(book: BookInput!): User
    removeBook(bookId: ID!): User
  }
`;

export default typeDefs;
