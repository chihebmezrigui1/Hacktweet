import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { FaRegComment, FaRegHeart, FaTrash, FaArrowLeft, FaRetweet, FaBookmark } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegBookmark } from "react-icons/fa6";

import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatPostDate } from "../utils/date";
import { API_URL } from "../API";
import { fetchWithAuth } from "../fetchWithAuth";

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeletePost = () => {
    document.getElementById('delete_confirm_modal').showModal();
  };
  
  const confirmDeletePost = () => {
    deletePost();
    document.getElementById('delete_confirm_modal').close();
  };
  
  const cancelDeletePost = () => {
    setIsDeleteModalOpen(false);
  };

  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  const { 
    data: post, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      try {
        const res = await fetchWithAuth(`/api/posts/${id}`, {credentials: 'include'});
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch post");
        }
        
        return data;
      } catch (error) {
        throw new Error(error.message || "Error fetching post");
      }
    }
  });

  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetchWithAuth(`/api/posts/${id}`, {
          method: "DELETE",
          credentials: 'include'
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const { mutate: likePost, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetchWithAuth(`/api/posts/like/${id}`, {
          method: "POST",
          credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (updatedLikes) => {
      // Mettre à jour le post actuel
      queryClient.setQueryData(["post", id], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, likes: updatedLikes };
      });
      
      // Aussi mettre à jour les autres caches liés aux posts
      const queryKeys = [
        ["posts"],
        ["userPosts"],
        ["likedPosts"],
        ["feedPosts"],
        ["followingPosts"],
        ["bookmarkedPosts"],
        ["repostedPosts"]
      ];
      
      queryKeys.forEach(key => {
        queryClient.setQueryData(key, (oldData) => {
          if (!oldData) return oldData;
          
          // Si c'est un tableau direct de posts
          if (Array.isArray(oldData)) {
            return oldData.map((p) => {
              if (p._id === id) {
                return { ...p, likes: updatedLikes };
              }
              return p;
            });
          }
          
          // Si c'est un objet avec propriété "posts"
          if (oldData.posts && Array.isArray(oldData.posts)) {
            return {
              ...oldData,
              posts: oldData.posts.map((p) => {
                if (p._id === id) {
                  return { ...p, likes: updatedLikes };
                }
                return p;
              })
            };
          }
          
          return oldData;
        });
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: repostPost, isPending: isReposting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetchWithAuth(`/api/posts/repost/${id}`, {
          method: "POST",
          credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (updatedReposts) => {
      // Mettre à jour le post actuel
      queryClient.setQueryData(["post", id], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, reposts: updatedReposts };
      });
      
      // Mettre à jour les autres caches liés aux posts
      const queryKeys = [
        ["posts"],
        ["userPosts"],
        ["likedPosts"],
        ["feedPosts"],
        ["followingPosts"],
        ["bookmarkedPosts"],
        ["repostedPosts"]
      ];
      
      queryKeys.forEach(key => {
        queryClient.setQueryData(key, (oldData) => {
          if (!oldData) return oldData;
          
          // Si c'est un tableau direct de posts
          if (Array.isArray(oldData)) {
            return oldData.map((p) => {
              if (p._id === id) {
                return { ...p, reposts: updatedReposts };
              }
              return p;
            });
          }
          
          // Si c'est un objet avec propriété "posts"
          if (oldData.posts && Array.isArray(oldData.posts)) {
            return {
              ...oldData,
              posts: oldData.posts.map((p) => {
                if (p._id === id) {
                  return { ...p, reposts: updatedReposts };
                }
                return p;
              })
            };
          }
          
          return oldData;
        });
      });
      
      toast.success(isReposted ? "Removed repost" : "Reposted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: bookmarkPost, isPending: isBookmarking } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetchWithAuth(`/api/posts/bookmark/${id}`, {
          method: "POST",
          credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (updatedBookmarks) => {
      // Mettre à jour le post actuel
      queryClient.setQueryData(["post", id], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, bookmarks: updatedBookmarks };
      });
      
      // Mettre à jour les autres caches liés aux posts
      const queryKeys = [
        ["posts"],
        ["userPosts"],
        ["likedPosts"],
        ["feedPosts"],
        ["followingPosts"],
        ["bookmarkedPosts"],
        ["repostedPosts"]
      ];
      
      queryKeys.forEach(key => {
        queryClient.setQueryData(key, (oldData) => {
          if (!oldData) return oldData;
          
          // Si c'est un tableau direct de posts
          if (Array.isArray(oldData)) {
            return oldData.map((p) => {
              if (p._id === id) {
                return { ...p, bookmarks: updatedBookmarks };
              }
              return p;
            });
          }
          
          // Si c'est un objet avec propriété "posts"
          if (oldData.posts && Array.isArray(oldData.posts)) {
            return {
              ...oldData,
              posts: oldData.posts.map((p) => {
                if (p._id === id) {
                  return { ...p, bookmarks: updatedBookmarks };
                }
                return p;
              })
            };
          }
          
          return oldData;
        });
      });
      
      toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: commentPost, isPending: isCommenting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetchWithAuth(`/api/posts/comment/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: comment }),
          credentials: 'include'
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (updatedData) => {
      // Invalider la requête actuelle pour forcer un rechargement avec les données complètes
      queryClient.invalidateQueries({ queryKey: ["post", id] });
      
      // Aussi invalider les autres requêtes liées aux posts pour garantir la cohérence
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      queryClient.invalidateQueries({ queryKey: ["likedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarkedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["repostedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["followingPosts"] });
      
      toast.success("Comment posted successfully");
      setComment("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // const handleDeletePost = () => {
  //   if (window.confirm("Are you sure you want to delete this post?")) {
  //     deletePost();
  //   }
  // };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (isCommenting || !comment.trim()) return;
    commentPost();
  };

  const handleLikePost = () => {
    if (isLiking) return;
    likePost();
  };
  
  const handleRepostPost = () => {
    if (isReposting) return;
    repostPost();
  };
  
  const handleBookmarkPost = () => {
    if (isBookmarking) return;
    bookmarkPost();
  };

  if (isLoading) {
    return (
      <div className="flex-[4_4_0] border-l border-r border-gray-700 min-h-screen flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-[4_4_0] border-l border-r border-gray-700 min-h-screen flex flex-col justify-center items-center p-4">
        <p className="text-red-500 font-bold text-xl">Error: {error.message || "Failed to load post"}</p>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-4 flex items-center gap-2 btn btn-outline"
        >
          <FaArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex-[4_4_0] border-l border-r border-gray-700 min-h-screen flex flex-col justify-center items-center p-4">
        <p className="font-bold text-xl">Post not found</p>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-4 flex items-center gap-2 btn btn-outline"
        >
          <FaArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  const isMyPost = authUser && authUser._id === post.user._id;
  const isLiked = authUser && post.likes.includes(authUser._id);
  const isBookmarked = authUser && post.bookmarks?.includes(authUser._id);
  const isReposted = authUser && post.reposts?.includes(authUser._id);
  const formattedDate = formatPostDate(post.createdAt);

  return (
    <div className="bg-[#1c222a] flex-[4_4_0] border-l border-r border-gray-700 min-h-screen">

      {/* Delete Confirmation Modal */}
  <dialog id="delete_confirm_modal" className="modal">
  <div className="modal-box bg-[#1c222a]">
    <h3 className="font-bold text-lg text-white">Delete Post</h3>
    <p className="py-4 text-white">Are you sure you want to delete this post? This action cannot be undone.</p>
    <div className="modal-action">
      <form method="dialog">
        <button className="btn mr-2 text-white ">Cancel</button>
        <button 
          onClick={confirmDeletePost}
          className="btn btn-warning"
        >
          {isDeleting ? <LoadingSpinner size="sm" /> : "Delete"}
        </button>
      </form>
    </div>
  </div>
</dialog>

      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-700 gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="text-gray-400 hover:text-white"
        >
          <FaArrowLeft />
        </button>
        <h1 className="font-bold text-lg text-gray-200">Post</h1>
      </div>

      {/* Post Content */}
      <div className="flex gap-2 items-start p-4 border-b border-gray-700">
        <div className="avatar">
          <Link to={`/profile/${post.user.username}`} className="w-12 h-12 rounded-full overflow-hidden">
            <img src={post.user.profileImg || "/avatar-placeholder.png"} alt={post.user.username} />
          </Link>
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex gap-2 items-center">
            <Link to={`/profile/${post.user.username}`} className="text-gray-200 font-bold">
              {post.user.fullName}
            </Link>
            <span className="text-gray-700 flex gap-1 text-sm">
              <Link to={`/profile/${post.user.username}`}>@{post.user.username}</Link>
              <span>·</span>
              <span>{formattedDate}</span>
            </span>
            {isMyPost && (
              <span className="flex justify-end flex-1">
                {!isDeleting && (
                  <FaTrash className="cursor-pointer hover:text-red-500" onClick={handleDeletePost} />
                )}
                {isDeleting && <LoadingSpinner size="sm" />}
              </span>
            )}
          </div>
          <div className="text-white flex flex-col gap-3 overflow-hidden mt-2">
            <span className="text-lg">{post.text}</span>
            {post.img && (
              <img
                src={post.img}
                className="max-h-96 object-contain rounded-lg border border-gray-700"
                alt="Post image"
              />
            )}
          </div>
          
          {/* Post Stats */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              <span className="font-bold text-white">{post.comments.length}</span> Comments
            </div>
            <div className="text-sm text-gray-400">
              <span className="font-bold text-white">{post.likes.length}</span> Likes
            </div>
            <div className="text-sm text-gray-400">
              <span className="font-bold text-white">{post.reposts?.length || 0}</span> Reposts
            </div>
            <div className="text-sm text-gray-400">
              <span className="font-bold text-white">{post.bookmarks?.length || 0}</span> Saves
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between mt-3 pt-3 border-t border-gray-700">
            <div className="flex gap-8 items-center">
              <div className="flex gap-1 items-center group cursor-pointer">
                <FaRegComment className="w-5 h-5 text-slate-500 group-hover:text-sky-400" />
              </div>
              <div className="flex gap-1 items-center group cursor-pointer" onClick={handleRepostPost}>
                {isReposting && <LoadingSpinner size="sm" />}
                {!isReposted && !isReposting && (
                  <BiRepost className="w-6 h-6 text-slate-500 group-hover:text-green-500" />
                )}
                {isReposted && !isReposting && (
                  <FaRetweet className="w-5 h-5 text-green-500" />
                )}
                <span 
                  className={`text-sm group-hover:text-green-500 ${
                    isReposted ? "text-green-500" : "text-slate-500"
                  }`}
                >
                  {post.reposts?.length || 0}
                </span>
              </div>
              <div className="flex gap-1 items-center group cursor-pointer" onClick={handleLikePost}>
                {isLiking && <LoadingSpinner size="sm" />}
                {!isLiked && !isLiking && (
                  <FaRegHeart className="w-5 h-5 cursor-pointer text-slate-500 group-hover:text-yellow-500" />
                )}
                {isLiked && !isLiking && (
                  <FaRegHeart className="w-5 h-5 cursor-pointer text-yellow-500" />
                )}
                <span
                  className={`text-sm group-hover:text-yellow-500 ${
                    isLiked ? "text-yellow-500" : "text-slate-500"
                  }`}
                >
                  {post.likes.length}
                </span>
              </div>
              <div className="group cursor-pointer" onClick={handleBookmarkPost}>
                {isBookmarking && <LoadingSpinner size="sm" />}
                {!isBookmarked && !isBookmarking && (
                  <FaRegBookmark className="w-5 h-5 text-slate-500 group-hover:text-yellow-500" />
                )}
                {isBookmarked && !isBookmarking && (
                  <FaBookmark className="w-5 h-5 text-yellow-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment Form */}
      <div className="p-4 border-b border-gray-700">
        <form className="flex gap-2" onSubmit={handlePostComment}>
          <div className="avatar">
            <div className="w-10 h-10 rounded-full">
              <img src={authUser?.profileImg || "/avatar-placeholder.png"} alt="Your avatar" />
            </div>
          </div>
          <div className="flex-1">
            <textarea
              className=" text-white w-full bg-transparent border border-gray-700 rounded-md p-2 min-h-20 focus:outline-none focus:border-blue-500"
              placeholder="Write your comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
            <div className="flex justify-end mt-2">
              <button 
                className="btn btn-warning btn-sm rounded-full px-4" 
                disabled={isCommenting || !comment.trim()}
              >
                {isCommenting ? <LoadingSpinner size="sm" /> : "Comment"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Comments Section */}
      <div className="p-4">
        <h2 className="font-bold text-lg mb-4 text-white">Comments</h2>
        {post.comments.length === 0 ? (
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        ) : (
          <div className="flex flex-col gap-4">
            {post.comments.map((comment) => (
              <div key={comment._id} className="flex gap-2 items-start border-b border-gray-800 pb-4">
                <div className="avatar">
                  <Link to={`/profile/${comment.user.username}`} className="w-10 h-10 rounded-full overflow-hidden">
                    <img src={comment.user.profileImg || "/avatar-placeholder.png"} alt={comment.user.username} />
                  </Link>
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex gap-2 items-center">
                    <Link to={`/profile/${comment.user.username}`} className="font-bold text-gray-200">
                      {comment.user.fullName}
                    </Link>
                    <span className="text-gray-700 text-sm ">
                      @{comment.user.username}
                    </span>
                    <span className="text-gray-700 text-sm ">·</span>
                    <span className="text-gray-700 text-sm">
                      {formatPostDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-700">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;