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

const Post = ({ post , isBookmarkView = false}) => {
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
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isWebcamActive, setIsWebcamActive] = useState(false);
	const [detectedEmotion, setDetectedEmotion] = useState(post.detectedEmotion || null);
	const videoRef = useRef(null);
	const canvasRef = useRef(null);


	const handleDeletePost = () => {
		document.getElementById(`delete_modal_${post._id}`).showModal();
	};

	const confirmDeletePost = () => {
		deletePost();
	};

	const cancelDeletePost = () => {
		setIsDeleteModalOpen(false);
	};

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
			switch (error.name) {
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


	const captureEmotion = async () => {
		try {
			// Réinitialiser les infos de débogage
			setDebugInfo("1. Début de la capture d'émotion...");

			if (!videoRef.current || !canvasRef.current) {
				setDebugInfo(prev => prev + "\n❌ Erreur: Webcam ou canvas non disponible");
				toast.error("Webcam ou canvas non disponible");
				return;
			}

			const video = videoRef.current;
			let canvas = canvasRef.current;
			let context = canvas.getContext('2d');

			setDebugInfo(prev => prev + `\n2. État vidéo: ${video.readyState}`);

			// Wait for video to be ready
			if (video.readyState !== video.HAVE_ENOUGH_DATA) {
				setDebugInfo(prev => prev + "\n⏳ Vidéo pas encore prête, attente...");
				// Wait and try again
				await new Promise(resolve => setTimeout(resolve, 1000));

				if (video.readyState !== video.HAVE_ENOUGH_DATA) {
					setDebugInfo(prev => prev + "\n❌ Erreur: La vidéo n'est toujours pas prête");
					toast.error("La vidéo n'est pas prête, veuillez réessayer");
					return;
				}
			}

			// Set canvas dimensions to match video
			canvas.width = video.videoWidth || 640;
			canvas.height = video.videoHeight || 480;

			setDebugInfo(prev => prev + `\n3. Dimensions vidéo: ${canvas.width}x${canvas.height}`);

			// Clear canvas and draw video frame
			context.clearRect(0, 0, canvas.width, canvas.height);
			context.drawImage(video, 0, 0, canvas.width, canvas.height);

			setDebugInfo(prev => prev + "\n4. Capture sur canvas réussie");

			// Redimensionner si l'image est trop grande
			const MAX_SIZE = 480; // Dimensions maximales
			if (canvas.width > MAX_SIZE || canvas.height > MAX_SIZE) {
				setDebugInfo(prev => prev + "\n➡️ Redimensionnement de l'image pour optimisation");

				// Créer un canvas temporaire pour le redimensionnement
				const tempCanvas = document.createElement('canvas');
				const tempCtx = tempCanvas.getContext('2d');

				// Calculer les nouvelles dimensions en conservant le ratio
				const ratio = Math.min(MAX_SIZE / canvas.width, MAX_SIZE / canvas.height);
				tempCanvas.width = Math.floor(canvas.width * ratio);
				tempCanvas.height = Math.floor(canvas.height * ratio);

				// Dessiner l'image redimensionnée
				tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height,
					0, 0, tempCanvas.width, tempCanvas.height);

				// Remplacer le canvas original par le redimensionné
				canvas = tempCanvas;
				context = tempCtx;

				setDebugInfo(prev => prev + `\n➡️ Nouvelles dimensions: ${tempCanvas.width}x${tempCanvas.height}`);
			}

			// Convert canvas to blob with reduced quality
			canvas.toBlob(async (blob) => {
				if (!blob) {
					setDebugInfo(prev => prev + "\n❌ Erreur: Échec de la conversion en blob");
					toast.error("Échec de la capture d'image");
					return;
				}

				setDebugInfo(prev => prev + `\n5. Blob créé: ${blob.size} octets`);

				// Stop webcam after successful detection
				stopWebcam();

				// Check blob size to ensure it's not empty
				if (blob.size < 1000) {
					setDebugInfo(prev => prev + "\n❌ Erreur: Image trop petite");
					toast.error("Image capturée trop petite, veuillez réessayer");
					return;
				}

				// Activez le spinner ici
				setIsDetectingEmotion(true);

				// Create form data
				const formData = new FormData();
				formData.append('image', blob, 'captured_emotion.jpg');
				formData.append('postId', post._id);
				formData.append('timestamp', Date.now());

				setDebugInfo(prev => prev + "\n6. FormData créé, envoi au backend...");

				// Utiliser AbortController pour gérer les timeouts
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes de timeout

				try {
					// Essayer d'abord avec fetch standard
					setDebugInfo(prev => prev + `\n7. Envoi à ${API_URL}/api/detection/detect-emotion`);

					const token = localStorage.getItem('jwtToken');
					const response = await fetch(`${API_URL}/api/detection/detect-emotion`, {
						method: 'POST',
						body: formData,
						headers: {
							'Authorization': localStorage.getItem('jwtToken') ? `Bearer ${localStorage.getItem('jwtToken')}` : ''
						},
						credentials: 'include',
						signal: controller.signal
					});

					clearTimeout(timeoutId);

					setDebugInfo(prev => prev + `\n8. Réponse reçue: statut ${response.status}`);

					if (!response.ok) {
						const errorText = await response.text();
						setDebugInfo(prev => prev + `\n❌ Erreur serveur ${response.status}: ${errorText.substring(0, 100)}`);
						throw new Error(`Server responded with ${response.status}: ${errorText}`);
					}

					// Process response
					const data = await response.json();
					setDebugInfo(prev => prev + `\n9. Données JSON reçues: ${JSON.stringify(data).substring(0, 100)}...`);

					if (data.success) {
						setDetectedEmotion(data.emotion_fr);
						setDebugInfo(prev => prev + `\n✅ Succès! Émotion détectée: ${data.emotion_fr}`);
						toast.success(`Émotion détectée : ${data.emotion_fr}`);
					} else {
						setDebugInfo(prev => prev + `\n❌ Échec de détection: ${data.message || "raison inconnue"}`);
						toast.error("Détection d'émotion impossible");
					}

				} catch (error) {
					clearTimeout(timeoutId);

					if (error.name === 'AbortError') {
						setDebugInfo(prev => prev + "\n❌ Erreur: La requête a pris trop de temps (timeout)");
						toast.error("La détection a pris trop de temps");
					} else {
						setDebugInfo(prev => prev + `\n❌ Exception: ${error.message}`);

						// Si la première méthode échoue, essayer avec l'API XMLHttpRequest comme fallback
						setDebugInfo(prev => prev + "\n↪️ Tentative avec XMLHttpRequest...");

						try {
							const xhrPromise = new Promise((resolve, reject) => {
								const xhr = new XMLHttpRequest();

								xhr.onload = function () {
									if (xhr.status >= 200 && xhr.status < 300) {
										try {
											const data = JSON.parse(xhr.responseText);
											resolve(data);
										} catch (e) {
											reject(new Error("Erreur de parsing JSON"));
										}
									} else {
										reject(new Error(`Erreur XHR: ${xhr.status}`));
									}
								};

								xhr.onerror = function () {
									reject(new Error("Erreur réseau XHR"));
								};

								xhr.ontimeout = function () {
									reject(new Error("Timeout XHR"));
								};

								xhr.open('POST', `${API_URL}/api/detection/detect-emotion`, true);

								// Ajouter le token Authorization si disponible
								if (localStorage.getItem('jwtToken')) {
									xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('jwtToken')}`);
								}

								xhr.withCredentials = true;
								xhr.timeout = 30000;

								xhr.send(formData);
							});

							const xhrData = await xhrPromise;
							setDebugInfo(prev => prev + "\n✅ XHR réussi!");

							if (xhrData.success) {
								setDetectedEmotion(xhrData.emotion_fr);
								setDebugInfo(prev => prev + `\n✅ Émotion détectée via XHR: ${xhrData.emotion_fr}`);
								toast.success(`Émotion détectée : ${xhrData.emotion_fr}`);
							} else {
								setDebugInfo(prev => prev + `\n❌ Échec de détection via XHR: ${xhrData.message || "raison inconnue"}`);
								toast.error("Détection d'émotion impossible");
							}

						} catch (xhrError) {
							setDebugInfo(prev => prev + `\n❌ Erreur XHR: ${xhrError.message}`);
							toast.error("Erreur lors de la détection d'émotion");
						}
					}
				} finally {
					// Désactivez le spinner une fois terminé
					setIsDetectingEmotion(false);
				}
			}, 'image/jpeg', 0.7); // Qualité réduite à 70%

		} catch (error) {
			setDebugInfo(prev => prev + `\n❌ Erreur générale: ${error.message}`);
			toast.error("Erreur lors de la capture");
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
		onMutate: async () => {
		  // Optimistically update UI
		  const queryKeys = [
			["posts"],
			["userPosts"],
			["likedPosts"],
			["feedPosts"],
			["followingPosts"],
			["bookmarkedPosts"],
			["repostedPosts"]
		  ];
		  
		  // Pour chaque cache, supprimer le post
		  queryKeys.forEach(key => {
			queryClient.setQueryData(key, (oldData) => {
			  if (!oldData) return oldData;
			  
			  // Si c'est un tableau direct de posts
			  if (Array.isArray(oldData)) {
				return oldData.filter(p => p._id !== post._id);
			  }
			  
			  // Si c'est un objet avec propriété "posts"
			  if (oldData.posts && Array.isArray(oldData.posts)) {
				return {
				  ...oldData,
				  posts: oldData.posts.filter(p => p._id !== post._id)
				};
			  }
			  
			  return oldData;
			});
		  });
		},
		onSuccess: () => {
		  toast.success("Post deleted successfully");
		  queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (error) => {
		  toast.error(error.message);
		  // Réinvalidez les requêtes pour rétablir l'état correct en cas d'erreur
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
			// Vérifier si le like a été retiré (comparaison entre l'ancien état et le nouveau)
			const isLikeRemoved = isLiked && !updatedLikes.includes(authUser._id);

			// Si on est dans likedPosts et qu'on vient de retirer le like, on supprime le post
			if (isLikeRemoved) {
				queryClient.setQueryData(["likedPosts"], (oldData) => {
					if (!oldData) return oldData;

					// Si c'est un tableau direct de posts
					if (Array.isArray(oldData)) {
						return oldData.filter(p => p._id !== post._id);
					}

					// Si c'est un objet avec propriété "posts"
					if (oldData.posts && Array.isArray(oldData.posts)) {
						return {
							...oldData,
							posts: oldData.posts.filter(p => p._id !== post._id)
						};
					}

					return oldData;
				});
			}

			// Pour tous les autres caches, mise à jour normale
			const queryKeys = [
				["posts"],
				["userPosts"],
				["feedPosts"],
				["followingPosts"],
				["bookmarkedPosts"],
				["repostedPosts"] // Important: maintenir à jour même dans repostedPosts!
			];

			queryKeys.forEach(key => {
				queryClient.setQueryData(key, (oldData) => {
					if (!oldData) return oldData;

					// Si c'est un tableau direct de posts
					if (Array.isArray(oldData)) {
						return oldData.map((p) => {
							if (p._id === post._id) {
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
								if (p._id === post._id) {
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
		// Pour bookmarkPost, modifiez la fonction onSuccess de manière similaire
		onSuccess: (updatedBookmarks) => {
			// Vérifier si le bookmark a été retiré
			const isBookmarkRemoved = isBookmarked && !updatedBookmarks.includes(authUser._id);

			// Si on est dans bookmarkedPosts et qu'on vient de retirer le bookmark, on supprime le post
			if (isBookmarkRemoved) {
				queryClient.setQueryData(["bookmarkedPosts"], (oldData) => {
					if (!oldData) return oldData;

					// Si c'est un tableau direct de posts
					if (Array.isArray(oldData)) {
						return oldData.filter(p => p._id !== post._id);
					}

					// Si c'est un objet avec propriété "posts"
					if (oldData.posts && Array.isArray(oldData.posts)) {
						return {
							...oldData,
							posts: oldData.posts.filter(p => p._id !== post._id)
						};
					}

					return oldData;
				});
			}

			// Pour tous les autres caches, mise à jour normale
			const queryKeys = [
				["posts"],
				["userPosts"],
				["feedPosts"],
				["followingPosts"],
				["likedPosts"],
				["repostedPosts"]
			];

			queryKeys.forEach(key => {
				queryClient.setQueryData(key, (oldData) => {
					if (!oldData) return oldData;

					// Si c'est un tableau direct de posts
					if (Array.isArray(oldData)) {
						return oldData.map((p) => {
							if (p._id === post._id) {
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
								if (p._id === post._id) {
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
			// Vérifier si le repost a été retiré
			const isRepostRemoved = isReposted && !updatedReposts.includes(authUser._id);

			// Si on est dans repostedPosts et qu'on vient de retirer le repost, on supprime le post
			if (isRepostRemoved) {
				queryClient.setQueryData(["repostedPosts"], (oldData) => {
					if (!oldData) return oldData;

					// Si c'est un tableau direct de posts
					if (Array.isArray(oldData)) {
						return oldData.filter(p => p._id !== post._id);
					}

					// Si c'est un objet avec propriété "posts"
					if (oldData.posts && Array.isArray(oldData.posts)) {
						return {
							...oldData,
							posts: oldData.posts.filter(p => p._id !== post._id)
						};
					}

					return oldData;
				});
			}

			// Pour tous les autres caches, mise à jour normale
			const queryKeys = [
				["posts"],
				["userPosts"],
				["feedPosts"],
				["followingPosts"],
				["bookmarkedPosts"],
				["likedPosts"] // Important: maintenir à jour même dans likedPosts!
			];

			queryKeys.forEach(key => {
				queryClient.setQueryData(key, (oldData) => {
					if (!oldData) return oldData;

					// Si c'est un tableau direct de posts
					if (Array.isArray(oldData)) {
						return oldData.map((p) => {
							if (p._id === post._id) {
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
								if (p._id === post._id) {
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
		onSuccess: (updatedPost) => {
			// Pour tous les caches, mise à jour avec le post incluant le nouveau commentaire
			const queryKeys = [
				["posts"],
				["userPosts"],
				["feedPosts"],
				["followingPosts"],
				["bookmarkedPosts"],
				["likedPosts"],
				["repostedPosts"]
			];

			queryKeys.forEach(key => {
				queryClient.setQueryData(key, (oldData) => {
					if (!oldData) return oldData;

					// Si c'est un tableau direct de posts
					if (Array.isArray(oldData)) {
						return oldData.map((p) => {
							if (p._id === post._id) {
								// Si updatedPost est l'ensemble du post mis à jour, utilisez-le
								if (updatedPost && updatedPost._id) {
									return updatedPost;
								}
								// Sinon, ajoutez simplement le commentaire à la liste des commentaires existants
								return {
									...p,
									comments: [...p.comments, {
										_id: Date.now().toString(), // ID temporaire
										text: comment,
										user: authUser,
										createdAt: new Date().toISOString()
									}]
								};
							}
							return p;
						});
					}

					// Si c'est un objet avec propriété "posts"
					if (oldData.posts && Array.isArray(oldData.posts)) {
						return {
							...oldData,
							posts: oldData.posts.map((p) => {
								if (p._id === post._id) {
									// Si updatedPost est l'ensemble du post mis à jour, utilisez-le
									if (updatedPost && updatedPost._id) {
										return updatedPost;
									}
									// Sinon, ajoutez simplement le commentaire à la liste des commentaires existants
									return {
										...p,
										comments: [...p.comments, {
											_id: Date.now().toString(), // ID temporaire
											text: comment,
											user: authUser,
											createdAt: new Date().toISOString()
										}]
									};
								}
								return p;
							})
						};
					}

					return oldData;
				});
			});
			queryKeys.forEach(key => {
				queryClient.invalidateQueries({ queryKey: key });
			});
			toast.success("Comment posted successfully");
			setComment("");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// const handleDeletePost = () => {
	// 	deletePost();
	// };

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
<div className={`flex gap-2 items-start p-4 ${isBookmarkView ? 'border-none' : 'border-b border-gray-700'}`}>
{/* DaisyUI Delete Confirmation Modal */}
				<dialog id={`delete_modal_${post._id}`} className="modal">
					<div className="modal-box bg-[#1c222a]">
						<h3 className="font-bold text-lg text-white">Delete Post</h3>
						<p className="py-4 text-white">Are you sure you want to delete this post? This action cannot be undone.</p>
						<div className="modal-action">
							<form method="dialog">
								<button className="btn btn-outline mr-2 text-white">Cancel</button>
								<button
									onClick={confirmDeletePost}
									className="btn btn-warning"
								>
									{isDeleting ? <LoadingSpinner size="sm" /> : "Delete"}
								</button>
							</form>
						</div>
					</div>
					<form method="dialog" className="modal-backdrop">
						<button>close</button>
					</form>
				</dialog>
				<div className='avatar'>
					<Link to={`/profile/${postOwner.username}`} className='w-8 rounded-full overflow-hidden'>
						<img src={postOwner.profileImg || "/avatar-placeholder.png"} />
					</Link>
				</div>
				<div className='flex flex-col flex-1'>
					<div className='flex gap-2 items-center'>
						<Link to={`/profile/${postOwner.username}`} className='font-bold text-gray-200'>
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
									<FaTrash className='text-gray-200 cursor-pointer hover:text-red-500 ' onClick={handleDeletePost} />
								)}

								{isDeleting && <LoadingSpinner size='sm' />}
							</span>
						)}
					</div>
					<div className='flex flex-col gap-3 overflow-hidden'>
						<span className="text-white">{post.text}</span>
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
								<div className=' bg-[#1c222a] modal-box rounded border border-gray-600'>
									<h3 className='font-bold text-lg mb-4 text-gray-200'>COMMENTS</h3>
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
														<span className='font-bold text-white'>{comment.user.fullName}</span>
														<span className='text-gray-300 text-sm'>
															@{comment.user.username}
														</span>
													</div>
													<div className='text-sm text-white'>{comment.text}</div>
												</div>
											</div>
										))}
									</div>
									<form
										className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2'
										onSubmit={handlePostComment}
									>
										<textarea
											className='bg-[#1c222a] text-gray-200 textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800'
											placeholder='Add a comment...'
											value={comment}
											onChange={(e) => setComment(e.target.value)}
										/>
										<button className='btn btn-primary rounded-full btn-sm text-white px-4' style={{ backgroundColor: '#05afdf', borderColor: '#05afdf' }}>
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
									className={`text-sm group-hover:text-green-500 ${isReposted ? "text-green-500" : "text-slate-500"
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
									className={`text-sm  group-hover:text-yellow-500 ${isLiked ? "text-yellow-500" : "text-slate-500"
										}`}
								>
									{post.likes.length}
								</span>
							</div>
							<div className='flex gap-1 items-center'>
								{/* {!isWebcamActive ? (
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
								)} */}

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

					{/* {!isWebcamActive ? (
    <Camera 
    onClick={startWebcam}
    className="w-5 h-5 text-slate-500 hover:text-blue-500 cursor-pointer" 
  />
  ) : (
    <div className="flex flex-col items-center">
      <div className="flex space-x-2">
        <button 
          onClick={captureEmotion}
          className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition flex items-center"
        >
          <Smile className="mr-2" /> Capturer
        </button>
        <button 
          onClick={stopWebcam}
          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
        >
          Annuler
        </button>
      </div>
    </div>
  )} */}

					{/* Emotion display */}
					{/* Emotion display avec émojis */}
					{/* {isDetectingEmotion ? (
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
)} */}

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
				)}
			</div>
		</>
	);
};
export default Post;