export interface post {
  id: number;
  text: string;
  timeStamp: number;
  likes: number[];
  author: user;
  comments: comment[];
}

export interface comment {
  id: number;
  text: string;
  author: number;
  timeStamp: number;
  likes: number[];
}

export interface user {
  id: number;
  name: string;
  userName: string;
  password?: string;
  email: string;
  avatar?: string;
}
