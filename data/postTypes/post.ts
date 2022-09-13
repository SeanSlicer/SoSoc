interface post {
  id: number;
  text: string;
  timeStamp: number;
  likes: number[];
  author: number;
  comments: comment[];
}

interface comment {
  id: number;
  text: string;
  author: number;
  timeStamp: number;
  likes: number[];
}
