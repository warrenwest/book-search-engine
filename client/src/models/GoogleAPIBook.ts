export interface GoogleBookVolumeInfo {
  title?: string;
  authors?: string[];
  description?: string;
  imageLinks?: {
    thumbnail?: string;
  };
  infoLink?: string;
}

export interface GoogleBookItem {
  id: string;
  volumeInfo?: GoogleBookVolumeInfo;
}

export interface GoogleBooksAPIResponse {
  items?: GoogleBookItem[];
}
