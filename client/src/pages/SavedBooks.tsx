import { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useMutation, useQuery } from '@apollo/client';

import Auth from '../utils/auth';
import { REMOVE_BOOK } from '../utils/mutations';
import { GET_ME } from '../utils/queries';
import { getSavedBookIds } from '../utils/localStorage';

import type { User } from '../models/User';
import type { Book } from '../models/Book';

const SavedBooks = () => {
  const token = Auth.getToken();

  // Fetch user data with GET_ME query
  const {
    data,
    loading,
    error,
    refetch,
  } = useQuery<{ me: User }>(GET_ME, {
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
  });

  // Mutation to remove a saved book
  const [removeBook] = useMutation(REMOVE_BOOK, {
    update(cache, { data: { removeBook } }) {
      cache.modify({
        fields: {
          me(existingUserData = { savedBooks: [] }) {
            const updatedBooks = existingUserData.savedBooks.filter(
              (book: { bookId: string }) =>
                book.bookId !== removeBook.savedBooks[0].bookId
            );
            return { ...existingUserData, savedBooks: updatedBooks };
          },
        },
      });
    },
    onError(error) {
      console.error('Error removing book:', error);
    },
  });

  const [userData, setUserData] = useState<User>({
    username: '',
    email: '',
    password: '',
    savedBooks: [],
  });

  const [, setSavedBookIds] = useState<string[]>(getSavedBookIds());

  useEffect(() => {
    if (data?.me) {
      setUserData(data.me);
    }
  }, [data]);

  const handleRemoveBook = async (bookId: string) => {
    try {
      await removeBook({ variables: { bookId } });
      await refetch(); // Ensure user data is reloaded
      setSavedBookIds((prev) => prev.filter((id) => id !== bookId));
    } catch (error) {
      console.error('Error removing book:', error);
    }
  };

  if (loading || !userData.username) {
    return <h2>LOADING...</h2>;
  }

  if (error) {
    console.error('Error fetching user data:', error);
    return <h2>Error loading user data</h2>;
  }

  return (
    <>
      <div className='text-light bg-dark p-5'>
        <Container>
          <h1>Viewing {userData.username}'s saved books!</h1>
        </Container>
      </div>

      <Container>
        <h2 className='pt-5'>
          {userData.savedBooks.length
            ? `You have ${userData.savedBooks.length} saved ${
                userData.savedBooks.length === 1 ? 'book' : 'books'
              }:`
            : 'You have no saved books!'}
        </h2>

        <Row>
          {userData.savedBooks.map((book: Book) => (
            <Col md='4' key={book.bookId}>
              <Card border='dark'>
                {book.image && (
                  <Card.Img
                    src={book.image}
                    alt={`The cover for ${book.title}`}
                    variant='top'
                  />
                )}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className='small'>Authors: {book.authors.join(', ')}</p>
                  <Card.Text>{book.description}</Card.Text>
                  <Button
                    className='btn-block btn-danger'
                    onClick={() => handleRemoveBook(book.bookId)}
                  >
                    Delete this Book!
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;
