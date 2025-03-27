import React from "react";
import PostLike from "./postLike";
import CommentPreview from "./commentPreview";
import { type Comment, type Post as PrismaPost } from "@prisma/client";

type PostProps = {
  post: PrismaPost & { comments: Comment[] };
};

const Post: React.FC<PostProps> = ({ post }) => {
  return (
    <div>
      <PostLike />
      {post.comments[0] && <CommentPreview comment={post.comments[0]} />}
    </div>
  );
};

export default Post;
