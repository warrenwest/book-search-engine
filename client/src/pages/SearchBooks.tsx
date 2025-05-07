import { useState, useEffect, FormEvent } from 'react';
import {
  Container,
  Col,
  Form,
  Button,
  Card,
  Row,
} from 'react-bootstrap';

import { useMutation } from '@apollo/client';

import Auth from '../utils/auth';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';
import { SAVE_BOOK } from '../utils/mutations';

import type { Book, BookInput } from '../models/Book';
import type { GoogleBooksAPIResponse } from '../models/GoogleAPIBook';

const SearchBooks = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchedBooks, setSearchedBooks] = useState<Book[]>([]);
  const [savedBookIds, setSavedBookIds] = useState<string[]>(getSavedBookIds());

  const [saveBook] = useMutation(SAVE_BOOK);

  useEffect(() => {
    return () => saveBookIds(savedBookIds);
  }, [savedBookIds]);

  const fetchBooksFromGoogle = async (query: string) => {
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
      const data: GoogleBooksAPIResponse = await response.json();
  
      const books: Book[] = data.items?.map((item) => {
        const volumeInfo = item.volumeInfo || {};
  
        // We ensure the book object matches the BookInput structure
        const book: BookInput = {
          bookId: item.id, // Required
          title: volumeInfo.title || 'No title available', // Required
          authors: volumeInfo.authors || ['No author to display'], // Required
          description: volumeInfo.description || 'No description available', // Required
          image: volumeInfo.imageLinks?.thumbnail || '', // Optional
          link: volumeInfo.infoLink || '#', // Optional
        };
  
        return book;
      }) || [];
  
      setSearchedBooks(books); // Update the local state
    } catch (error) {
      console.error('Error fetching from Google Books API:', error);
    }
  };
  

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchInput.trim()) return;
    await fetchBooksFromGoogle(searchInput);
    setSearchInput('');
  };

  const handleSaveBook = async (book: BookInput) => {
    console.log('Sending book to saveBook mutation:', book); // Debugging the shape of the book
  
    // Check if the book object has all required fields
    if (!book.bookId || !book.title || !book.authors || !book.description) {
      console.error('Book is missing required fields', book);
      return; // Prevent sending invalid data
    }
  
    try {
      // Send the correctly structured book object to the mutation
      const { data } = await saveBook({
        variables: { book },
      });
  
      console.log('Saved book:', data);
      setSavedBookIds((prev) => [...prev, book.bookId]);
    } catch (err) {
      console.error('Error saving book:', err);
  
      if (err instanceof Error && 'networkError' in err) {
        console.error('Network error details:', (err as any).networkError);
      }
  
      if (err && typeof err === 'object' && 'graphQLErrors' in err) {
        const graphQLErrors = (err as { graphQLErrors: any[] }).graphQLErrors;
        console.error('GraphQL error details:', graphQLErrors);
        graphQLErrors.forEach((error) => {
          console.error('GraphQL Error Message:', error.message);
          console.error('GraphQL Error Locations:', error.locations);
          console.error('GraphQL Error Path:', error.path);
        });
      }
    }
  };
  
  

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name="searchInput"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type="text"
                  size="lg"
                  placeholder="Search for a book"
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type="submit" variant="success" size="lg">
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        <h2 className="pt-5">
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book) => (
            <Col md="4" key={book.bookId}>
              <Card border="dark">
                {book.image && (
                  <Card.Img
                    src={book.image}
                    alt={`The cover for ${book.title}`}
                    variant="top"
                  />
                )}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className="small">Authors: {book.authors.join(', ')}</p>
                  <Card.Text>{book.description}</Card.Text>
                  {Auth.loggedIn() && (
                    <Button
                      disabled={savedBookIds.includes(book.bookId)}
                      className="btn-block btn-info"
                      onClick={() => handleSaveBook(book)}
                    >
                      {savedBookIds.includes(book.bookId)
                        ? 'This book has already been saved!'
                        : 'Save this Book!'}
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SearchBooks;
