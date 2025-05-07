import User from '../models/User.js';
import { signToken, AuthenticationError } from '../services/auth.js';

interface AddUserArgs {
  username: string;
  email: string;
  password: string;
}

interface LoginUserArgs {
  email: string;
  password: string;
}

interface BookInput {
  bookId: string;
  title: string;
  authors: string[];
  description: string;
  image: string;
  link: string;
}

const resolvers: {
  Query: Record<string, Function>;
  Mutation: Record<string, Function>;
} = {
  Query: {
    me: async (_parent: any, _args: any, context: { user: { _id: any } }) => {
      console.log('Context.user in me query:', context.user);
      if (context.user) {
        const user = await User.findById(context.user._id).populate('savedBooks');
        console.log('Fetched user:', user);
        return user;
      }
      throw new AuthenticationError('Not authenticated');
    },
  },

  Mutation: {
    addUser: async (_parent: any, args: AddUserArgs) => {
      const { username, email, password } = args;
      const user = await User.create({ username, email, password });
      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },

    login: async (_parent: any, { email, password }: LoginUserArgs) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError('Incorrect email or password.');
      }

      const isValidPassword = await user.isCorrectPassword(password);
      if (!isValidPassword) {
        throw new AuthenticationError('Incorrect email or password.');
      }

      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },

    saveBook: async (
      _parent: any,
      { book }: { book: BookInput },
      context: { user: { _id: any } }
    ) => {
      if (!context.user) {
        throw new AuthenticationError('User must be logged in');
      }

      const updatedUser = await User.findByIdAndUpdate(
        context.user._id,
        { $addToSet: { savedBooks: book } },
        { new: true, runValidators: true }
      ).populate('savedBooks');

      return updatedUser;
    },

    removeBook: async (
      _parent: any,
      { bookId }: { bookId: string },
      context: { user: { _id: any } }
    ) => {
      if (!context.user) {
        throw new AuthenticationError('User must be logged in to remove a book.');
      }

      const user = await User.findByIdAndUpdate(
        context.user._id,
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      ).populate('savedBooks');

      if (!user) {
        throw new Error('User not found after removing book');
      }

      return user;
    },
  },
};

export default resolvers;
