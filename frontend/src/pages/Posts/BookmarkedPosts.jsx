import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Post from "./Post";
import PostSkeleton from "../skeleton/PostSkeleton";
import { API_URL } from "../../API";
import { fetchWithAuth } from "../../fetchWithAuth";

const BookmarkedPosts = () => {
  const {
    data: bookmarkedPosts,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["bookmarkedPosts"],
    queryFn: async () => {
      try {
        const res = await fetchWithAuth(`/api/posts/bookmarks`,{credentials: 'include'});
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }

        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <>
      {(isLoading || isRefetching) && (
        <div className="flex flex-col justify-center">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}
      {!isLoading && !isRefetching && bookmarkedPosts?.length === 0 && (
        <div className="text-center my-8 flex flex-col items-center">
          <p className="text-xl mb-2">No bookmarked posts yet</p>
          <p className="text-gray-500">
            Bookmark posts that you want to revisit later
          </p>
        </div>
      )}
      {!isLoading && !isRefetching && bookmarkedPosts && (
        <div className="w-full max-w-4xl mx-auto">
          {bookmarkedPosts.map((post) => (
            <Post key={post._id} post={post} isBookmarkView={true} />
          ))}
        </div>
      )}
    </>
  );
};

export default BookmarkedPosts;
