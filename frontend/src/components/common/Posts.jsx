import Post from "./Post";
import PostSkeleton from "../skeleton/PostSkeleton"
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { API_URL } from "../../API";

const Posts = ({ feedType, username, userId, posts: directPosts }) => {
    // If direct posts are provided, we don't need to fetch
    const shouldFetch = !directPosts;
    
    const getPostEndpoint = () => {
        switch (feedType) {
            case "forYou":
                return `${API_URL}/api/posts/all`;
            case "following":
                return `${API_URL}/api/posts/following`;
            case "posts":
                return `${API_URL}/api/posts/user/${username}`;
            case "likes":
                return `${API_URL}/api/posts/likes/${userId}`;
            case "bookmarks":
                return `${API_URL}/api/posts/bookmarks`;
            case "reposts":
                return `${API_URL}/api/posts/reposts/${userId}`;
            default:
                return `${API_URL}/api/posts/all`;
        }
    };

    const POST_ENDPOINT = getPostEndpoint();

    const {
        data: fetchedPosts,
        isLoading,
        refetch,
        isRefetching,
        error
    } = useQuery({
        queryKey: feedType === "bookmarks" 
            ? ["bookmarkedPosts"] 
            : feedType === "reposts" 
                ? ["repostedPosts"] 
                : feedType === "likes"
                    ? ["likedPosts"]
                    : feedType === "posts"
                        ? ["userPosts"]
                        : feedType === "following"
                            ? ["followingPosts"]
                            : ["posts"],
        queryFn: async () => {
            try {
                console.log(`Fetching from: ${POST_ENDPOINT}`);
                const res = await fetch(POST_ENDPOINT, {
                    credentials: 'include' // Make sure to include credentials
                });
                
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Server responded with status: ${res.status}`);
                }
                
                const data = await res.json();
                console.log(`Data received from ${POST_ENDPOINT}:`, data);
                return data;
            } catch (error) {
                console.error(`Error fetching from ${POST_ENDPOINT}:`, error);
                throw new Error(error.message || "Something went wrong");
            }
        },
        enabled: shouldFetch
    });
    
    // Handle both data formats - direct array or {posts: [...]}
    const postsToDisplay = directPosts || 
        (fetchedPosts?.posts ? fetchedPosts.posts : fetchedPosts);
    
    useEffect(() => {
        if (error) {
            console.error("Query error:", error);
        }
    }, [error]);

    useEffect(() => {
        if (shouldFetch) {
            refetch();
        }
    }, [feedType, refetch, username, shouldFetch]);

    return (
        <>
            {(!directPosts && (isLoading || isRefetching)) && (
                <div className='flex flex-col justify-center'>
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                </div>
            )}
            {error && (
                <div className="flex flex-col items-center justify-center p-10 text-red-500">
                    <p className="text-xl mb-2">Error loading posts</p>
                    <p className="text-sm">{error.message}</p>
                </div>
            )}
            {!isLoading && !isRefetching && !error && postsToDisplay?.length === 0 && (
                <p className='text-center my-4'>
                    {feedType === "bookmarks" 
                        ? "No bookmarked posts yet. Save posts to read later!" 
                        : feedType === "repost"
                            ? "No reposted posts yet. Repost content to share with your followers!"
                            : feedType === "likes"
                                ? "No liked posts yet. Heart posts you enjoy!"
                                : feedType === "following"
                                    ? "You're not following anyone yet, or the people you follow haven't posted."
                                    : "No posts in this tab. Switch 👻"}
                </p>
            )}
            {!isLoading && !isRefetching && !error && postsToDisplay && (
                <div>
                    {Array.isArray(postsToDisplay) ? (
                        postsToDisplay.map((post) => (
                            <Post key={post._id} post={post} />
                        ))
                    ) : (
                        <p className="text-center text-red-500">Invalid data format received</p>
                    )}
                </div>
            )}
        </>
    );
};

export default Posts;