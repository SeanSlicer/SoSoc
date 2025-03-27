import React, { useState } from "react";

const PostLike: React.FC = () => {
  const [like, setLike] = useState(0);
  const [dislike, setDislike] = useState(0);

  const handleLike = () => {
    setLike(like + 1);
  };

  const handleDislike = () => {
    setDislike(dislike + 1);
  };

  return (
    <div className="flex w-48 justify-between">
      <button
        onClick={handleLike}
        className="w-1/2 bg-green-500 px-4 py-2 text-white"
      >
        Like {like}
      </button>
      <button
        onClick={handleDislike}
        className="w-1/2 bg-red-500 px-4 py-2 text-white"
      >
        Dislike {dislike}
      </button>
    </div>
  );
};

export default PostLike;
