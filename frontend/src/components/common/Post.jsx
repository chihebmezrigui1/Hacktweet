import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRetweet } from "react-icons/fa"; // For filled repost icon
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Camera, Smile } from "lucide-react";

import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";
import { API_URL } from "../../API";
import { fetchWithAuth } from "../../fetchWithAuth";

const Post = ({ post }) => {
	const [comment, setComment] = useState("");
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const queryClient = useQueryClient();
	const postOwner = post.user;
	const isLiked = post.likes.includes(authUser._id);
	const isBookmarked = post.bookmarks?.includes(authUser._id);
	const isReposted = post.reposts?.includes(authUser._id);
	const [isDetectingEmotion, setIsDetectingEmotion] = useState(false);
	const [debugInfo, setDebugInfo] = useState("");

	const isMyPost = authUser._id === post.user._id;

	const formattedDate = formatPostDate(post.createdAt);

	const [isWebcamActive, setIsWebcamActive] = useState(false);
	const [detectedEmotion, setDetectedEmotion] = useState(post.detectedEmotion || null);
	const videoRef = useRef(null);
	const canvasRef = useRef(null);


// Start webcam function
// Start webcam function
const startWebcam = async () => {
	try {
	  console.log("Starting webcam, video ref exists:", !!videoRef.current);
	  
	  // Check if media devices are supported
	  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		toast.error("Votre navigateur ne supporte pas l'accès à la webcam");
		return;
	  }
  
	  // IMPORTANT: Make sure video element exists
	  if (!videoRef.current) {
		console.error("Video reference is null");
		toast.error("Référence vidéo non initialisée");
		return;
	  }
  
	  const constraints = {
		video: { 
		  width: { ideal: 640 },
		  height: { ideal: 480 },
		  facingMode: "user"
		}
	  };
  
	  // Request webcam access
	  const stream = await navigator.mediaDevices.getUserMedia(constraints);
	  
	  // Set stream to video element
	  videoRef.current.srcObject = stream;
	  
	  // Wait for video to be ready
	  videoRef.current.onloadedmetadata = () => {
		videoRef.current.play()
		  .then(() => {
			console.log("Video is now playing");
			setIsWebcamActive(true);
		  })
		  .catch(err => {
			console.error("Error playing video:", err);
			toast.error("Erreur lors du démarrage de la vidéo");
		  });
	  };
	} catch (error) {
	  console.error("Erreur d'accès à la webcam:", error);
	  
	  // Custom error messages
	  switch(error.name) {
		case 'NotAllowedError':
		  toast.error("Accès à la webcam refusé. Vérifiez vos paramètres.");
		  break;
		case 'NotFoundError':
		  toast.error("Aucune webcam n'a été trouvée.");
		  break;
		case 'NotReadableError':
		  toast.error("La webcam est déjà utilisée par une autre application.");
		  break;
		default:
		  toast.error(`Impossible d'accéder à la webcam: ${error.message}`);
	  }
	}
  };
  

// Modifiez votre fonction captureEmotion pour gérer le spinner
const captureEmotion = async () => {
	try {
	  // Réinitialiser le débogage et activer le spinner
	  setDebugInfo("1. Début de la capture d'émotion...");
	  setIsDetectingEmotion(true);
	  
	  // Vérifications préalables
	  if (!videoRef.current || !canvasRef.current) {
		throw new Error("Webcam ou canvas non disponible");
	  }
	  
	  const video = videoRef.current;
	  const canvas = canvasRef.current;
	  const context = canvas.getContext('2d');
	  
	  // S'assurer que la vidéo est prête
	  if (video.readyState !== video.HAVE_ENOUGH_DATA) {
		throw new Error("La vidéo n'est pas prête");
	  }
	  
	  // Dimensionner le canvas
	  canvas.width = video.videoWidth || 640;
	  canvas.height = video.videoHeight || 480;
	  
	  // Capturer l'image
	  context.clearRect(0, 0, canvas.width, canvas.height);
	  context.drawImage(video, 0, 0, canvas.width, canvas.height);
	  
	  // Convertir en blob
	  canvas.toBlob(async (blob) => {
		if (!blob) {
		  throw new Error("Échec de création du blob");
		}
		
		// Arrêter la webcam
		stopWebcam();
		
		// Vérifier la taille du blob
		if (blob.size < 1000) {
		  throw new Error("Image capturée trop petite");
		}
		
		// Préparer les données de formulaire
		const formData = new FormData();
		formData.append('image', blob, 'captured_emotion.jpg');
		formData.append('postId', post._id);
		formData.append('timestamp', Date.now());
		
		try {
		  // Utiliser fetchWithAuth pour la requête
		  const response = await fetchWithAuth('/api/detection/detect-emotion', {
			method: 'POST',
			body: formData,
			// Supprimer Content-Type pour que le navigateur le définisse automatiquement
			headers: {
			  // Supprimer l'en-tête Content-Type pour les FormData
			  'Content-Type': undefined
			}
		  });
		  
		  // Vérifier la réponse
		  if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Erreur serveur : ${response.status} - ${errorText}`);
		  }
		  
		  // Traiter la réponse
		  const data = await response.json();
		  
		  if (data.success) {
			setDetectedEmotion(data.emotion_fr);
			toast.success(`Émotion détectée : ${data.emotion_fr}`);
			
			// Option : mettre à jour le post avec l'émotion détectée
			queryClient.setQueryData(["posts"], (oldData) => {
			  return oldData?.map((p) => {
				if (p._id === post._id) {
				  return { ...p, detectedEmotion: data.emotion_fr };
				}
				return p;
			  });
			});
		  } else {
			throw new Error(data.message || "La détection d'émotion a échoué");
		  }
		} catch (error) {
		  console.error("Erreur de détection d'émotion :", error);
		  toast.error(error.message || "Échec de la détection d'émotion");
		}
	  }, 'image/jpeg', 0.7); // Compression de l'image
	} catch (error) {
	  console.error("Erreur lors de la capture d'émotion :", error);
	  toast.error(error.message || "Erreur lors de la capture d'émotion");
	} finally {
	  // Toujours désactiver le spinner
	  setIsDetectingEmotion(false);
	}
  };
  
  // Stop webcam function
  const stopWebcam = () => {
	if (videoRef.current && videoRef.current.srcObject) {
	  const stream = videoRef.current.srcObject;
	  const tracks = stream.getTracks();
	  tracks.forEach(track => track.stop());
	  videoRef.current.srcObject = null;
	  setIsWebcamActive(false);
	}
  };

	const { mutate: deletePost, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetchWithAuth(`/api/posts/${post._id}`, {
					method: "DELETE",
					credentials: 'include'
				});
				const data = await res.json();

				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: () => {
			toast.success("Post deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});

	const { mutate: likePost, isPending: isLiking } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetchWithAuth(`/api/posts/like/${post._id}`, {
					method: "POST",
					credentials: 'include'
				});
				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: (updatedLikes) => {
			// this is not the best UX, bc it will refetch all posts
			// queryClient.invalidateQueries({ queryKey: ["posts"] });
	
			// instead, update the cache directly for that post
			queryClient.setQueryData(["posts"], (oldData) => {
				return oldData.map((p) => {
					if (p._id === post._id) {
						return { ...p, likes: updatedLikes };
					}
					return p;
				});
			});
			
			// Ajoutez cette ligne pour invalider la requête des likes
			queryClient.invalidateQueries({ queryKey: ["likedPosts"] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const { mutate: bookmarkPost, isPending: isBookmarking } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetchWithAuth(`/api/posts/bookmark/${post._id}`, {
					method: "POST",
					credentials: 'include'
				});
				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: (updatedBookmarks) => {
			// Update the cache directly for that post
			queryClient.setQueryData(["posts"], (oldData) => {
				return oldData?.map((p) => {
					if (p._id === post._id) {
						return { ...p, bookmarks: updatedBookmarks };
					}
					return p;
				});
			});
			
			// Also invalidate any bookmarked posts queries if they exist
			queryClient.invalidateQueries({ queryKey: ["bookmarkedPosts"] });
			
			toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const { mutate: repostPost, isPending: isReposting } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetchWithAuth(`/api/posts/repost/${post._id}`, {
					method: "POST",
					credentials: 'include'
				});
				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: (updatedReposts) => {
			// Update the cache directly for that post
			queryClient.setQueryData(["posts"], (oldData) => {
				return oldData?.map((p) => {
					if (p._id === post._id) {
						return { ...p, reposts: updatedReposts };
					}
					return p;
				});
			});
			
			queryClient.invalidateQueries({ queryKey: ["userPosts"] });
			queryClient.invalidateQueries({ queryKey: ["feedPosts"] });
			
			queryClient.invalidateQueries({ queryKey: ["repostedPosts"] });
			
			toast.success(isReposted ? "Removed repost" : "Reposted successfully");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const { mutate: commentPost, isPending: isCommenting } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetchWithAuth(`/api/posts/comment/${post._id}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ text: comment }),
					credentials: "include"
				});
				const data = await res.json();

				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: () => {
			toast.success("Comment posted successfully");
			setComment("");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleDeletePost = () => {
		deletePost();
	};

	const handlePostComment = (e) => {
		e.preventDefault();
		if (isCommenting) return;
		commentPost();
	};

	const handleLikePost = () => {
		if (isLiking) return;
		likePost();
	};
	
	const handleBookmarkPost = () => {
		if (isBookmarking) return;
		bookmarkPost();
	};
  
	const handleRepostPost = () => {
		if (isReposting) return;
		repostPost();
	};

	return (
		<>
			<div className='flex gap-2 items-start p-4 border-b border-gray-700'>
				<div className='avatar'>
					<Link to={`/profile/${postOwner.username}`} className='w-8 rounded-full overflow-hidden'>
						<img src={postOwner.profileImg || "/avatar-placeholder.png"} />
					</Link>
				</div>
				<div className='flex flex-col flex-1'>
					<div className='flex gap-2 items-center'>
						<Link to={`/profile/${postOwner.username}`} className='font-bold'>
							{postOwner.fullName}
						</Link>
						<span className='text-gray-700 flex gap-1 text-sm'>
							<Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
							<span>·</span>
							<span>{formattedDate}</span>
						</span>
						{isMyPost && (
							<span className='flex justify-end flex-1'>
								{!isDeleting && (
									<FaTrash className='cursor-pointer hover:text-red-500' onClick={handleDeletePost} />
								)}

								{isDeleting && <LoadingSpinner size='sm' />}
							</span>
						)}
					</div>
					<div className='flex flex-col gap-3 overflow-hidden'>
						<span>{post.text}</span>
						{post.img && (
							<img
								src={post.img}
								className='h-80 object-contain rounded-lg border border-gray-700'
								alt=''
							/>
						)}
					</div>
					<div className='flex justify-between mt-3'>
						<div className='flex gap-4 items-center w-2/3 justify-between'>
							<div
								className='flex gap-1 items-center cursor-pointer group'
								onClick={() => document.getElementById("comments_modal" + post._id).showModal()}
							>
								<FaRegComment className='w-4 h-4  text-slate-500 group-hover:text-sky-400' />
								<span className='text-sm text-slate-500 group-hover:text-sky-400'>
									{post.comments.length}
								</span>
							</div>
							{/* We're using Modal Component from DaisyUI */}
							<dialog id={`comments_modal${post._id}`} className='modal border-none outline-none'>
								<div className='modal-box rounded border border-gray-600'>
									<h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
									<div className='flex flex-col gap-3 max-h-60 overflow-auto'>
										{post.comments.length === 0 && (
											<p className='text-sm text-slate-500'>
												No comments yet 🤔 Be the first one 😉
											</p>
										)}
										{post.comments.map((comment) => (
											<div key={comment._id} className='flex gap-2 items-start'>
												<div className='avatar'>
													<div className='w-8 rounded-full'>
														<img
															src={comment.user.profileImg || "/avatar-placeholder.png"}
														/>
													</div>
												</div>
												<div className='flex flex-col'>
													<div className='flex items-center gap-1'>
														<span className='font-bold'>{comment.user.fullName}</span>
														<span className='text-gray-700 text-sm'>
															@{comment.user.username}
														</span>
													</div>
													<div className='text-sm'>{comment.text}</div>
												</div>
											</div>
										))}
									</div>
									<form
										className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2'
										onSubmit={handlePostComment}
									>
										<textarea
											className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800'
											placeholder='Add a comment...'
											value={comment}
											onChange={(e) => setComment(e.target.value)}
										/>
										<button className='btn btn-primary rounded-full btn-sm text-white px-4' style={{backgroundColor:'#05afdf',borderColor:'#05afdf'}}>
											{isCommenting ? <LoadingSpinner size='md' /> : "Post"}
										</button>
									</form>
								</div>
								<form method='dialog' className='modal-backdrop'>
									<button className='outline-none'>close</button>
								</form>
							</dialog>
							<div className='flex gap-1 items-center group cursor-pointer' onClick={handleRepostPost}>
								{isReposting && <LoadingSpinner size='sm' />}
								{!isReposted && !isReposting && (
									<BiRepost className='w-6 h-6 text-slate-500 group-hover:text-green-500' />
								)}
								{isReposted && !isReposting && (
									<FaRetweet className='w-5 h-5 text-green-500' />
								)}
								<span 
									className={`text-sm group-hover:text-green-500 ${
										isReposted ? "text-green-500" : "text-slate-500"
									}`}
								>
									{post.reposts?.length || 0}
								</span>
							</div>
							<div className='flex gap-1 items-center group cursor-pointer' onClick={handleLikePost}>
								{isLiking && <LoadingSpinner size='sm' />}
								{!isLiked && !isLiking && (
									<FaRegHeart className='w-4 h-4 cursor-pointer text-slate-500 group-hover:text-yellow-500' />
								)}
								{isLiked && !isLiking && (
									<FaRegHeart className='w-4 h-4 cursor-pointer text-yellow-500 ' />
								)}

								<span
									className={`text-sm  group-hover:text-yellow-500 ${
										isLiked ? "text-yellow-500" : "text-slate-500"
									}`}
								>
									{post.likes.length}
								</span>
							</div>
							<div className='flex gap-1 items-center'>
      {!isWebcamActive ? (
        <Camera 
          onClick={startWebcam}
          className='w-4 h-4 text-slate-500 hover:text-blue-500 cursor-pointer' 
        />
      ) : (
        <>
          <Smile 
            onClick={captureEmotion}
            className='w-4 h-4 text-green-500 cursor-pointer' 
          />
          <span 
            onClick={stopWebcam}
            className='ml-1 text-xs text-red-500 cursor-pointer'
          >
            ✕
          </span>
        </>
      )}
	   {isDetectingEmotion ? (
  <div className="mt-2 p-2 rounded-lg inline-flex items-center">
    <LoadingSpinner size="sm" />
    <span className="ml-2 text-sm">Analyse en cours...</span>
  </div>
) : (
	detectedEmotion && (
		<div className="mt-2 p-2 rounded-lg inline-flex items-center">
		  {detectedEmotion === "Colère" && (
			<span className="text-xl" title="Colère">😡</span>
		  )}
		  {detectedEmotion === "Joie" && (
			<span className="text-xl" title="Joie">😄</span>
		  )}
		  {detectedEmotion === "Tristesse" && (
			<span className="text-xl" title="Tristesse">😢</span>
		  )}
		  {detectedEmotion === "Surprise" && (
			<span className="text-xl" title="Surprise">😲</span>
		  )}
		  {detectedEmotion === "Peur" && (
			<span className="text-xl" title="Peur">😨</span>
		  )}
		  {detectedEmotion === "Dégoût" && (
			<span className="text-xl" title="Dégoût">🤢</span>
		  )}
		  {detectedEmotion === "Neutre" && (
			<span className="text-xl" title="Neutre">😐</span>
		  )}
		  {!["Colère", "Joie", "Tristesse", "Surprise", "Peur", "Dégoût", "Neutre"].includes(detectedEmotion) && (
			<span className="text-xl" title={detectedEmotion}>❓</span>
		  )}
		</div>
	  )
)}
      
      {/* Emoji for detected emotion */}
     
    </div>
						</div>
						<div className='flex w-1/3 justify-end gap-2 items-center'>
							<div className='group cursor-pointer' onClick={handleBookmarkPost}>
								{isBookmarking && <LoadingSpinner size='sm' />}
								{!isBookmarked && !isBookmarking && (
									<FaRegBookmark className='w-4 h-4 text-slate-500 group-hover:text-yellow-500' />
								)}
								{isBookmarked && !isBookmarking && (
									<FaBookmark className='w-4 h-4 text-yellow-500' />
								)}
							</div>
						</div>
					</div>
				</div>
				{/* Emotion Detection Section */}
				<div className="mt-2">
  {/* Always render the video element, but hide it when not active */}
  <video 
    ref={videoRef} 
    autoPlay 
    playsInline
    muted
    className={isWebcamActive ? "w-48 h-36 rounded-lg mb-2" : "hidden"}
    style={{ transform: 'scaleX(-1)' }}
  />
  
  {/* Canvas for capture - always hidden */}
  <canvas 
    ref={canvasRef} 
    width={640} 
    height={480} 
    style={{ display: 'none' }} 
  />

</div>
{debugInfo && (
  <div className="fixed bottom-0 left-0 right-0 p-3 bg-black text-white text-xs z-50 max-h-64 overflow-auto">
    <div className="flex justify-between items-center mb-1">
      <h3 className="font-bold">Débogage Détection Émotion</h3>
      <button 
        onClick={() => setDebugInfo("")}
        className="text-xs px-2 py-1 bg-gray-700 rounded"
      >
        Effacer
      </button>
    </div>
    <pre className="whitespace-pre-wrap">{debugInfo}</pre>
  </div>
)}	</div>
		</>
	);
};
export default Post;