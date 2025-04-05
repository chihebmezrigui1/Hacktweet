import { useState ,useEffect} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { IoTrash } from "react-icons/io5";
import { FaBookmark, FaRetweet, FaUser } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";
import { FaComment } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa";
import { fetchWithAuth } from "../../fetchWithAuth";
import { io } from "socket.io-client";
import { API_URL } from "../../API";

const NotificationPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);

  // Socket connection for real-time updates
  useEffect(() => {
    const socket = io(API_URL);

    // Listen for notifications-cleared event
    socket.on('notifications-cleared', () => {
      queryClient.invalidateQueries(['notifications']);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const res = await fetchWithAuth(`/api/notifications`, {credentials: 'include'});
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
  });

  // Mutation for deleting ALL notifications
  const { mutate: deleteAllNotifications, isPending: isDeletingAll } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetchWithAuth('/api/notifications', {
          method: "DELETE",
          credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success("All notifications deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutation for deleting a single notification
  const { mutate: deleteNotification, isPending: isDeleting } = useMutation({
    mutationFn: async (notificationId) => {
      try {
        const res = await fetchWithAuth(`/api/notifications/${notificationId}`, {
          method: "DELETE",
          credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success("Notification deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Handler for deleting a single notification
  const handleDeleteNotification = (notificationId, e) => {
    e.stopPropagation();
    setSelectedNotificationId(notificationId);
    document.getElementById('delete_notification_modal').showModal();
  };

  // Confirm deletion of a single notification
  const confirmDeleteNotification = () => {
    if (selectedNotificationId) {
      deleteNotification(selectedNotificationId);
    }
  };

  // Helper functions for notification rendering
  const getNotificationMessage = (notification) => {
    switch(notification.type) {
      case "follow": return "followed you";
      case "like": return "liked your post";
      case "comment": return "commented on your post";
      case "bookmarked": return "bookmarked your post";
      case "repost": return "reposted your post";
      default: return "interacted with you";
    }
  };

  const NotificationIcon = ({ type }) => {
    switch(type) {
      case "follow": return <FaUser className='w-7 h-7 text-primary' />;
      case "like": return <FaHeart className='w-7 h-7 text-pink-500' />;
      case "comment": return <FaComment className='w-7 h-7 text-green-500' />;
      case "bookmarked": return <FaBookmark className='w-7 h-7 text-blue-500' />;
      case "repost": return <FaRetweet className='w-7 h-7 text-green-500' />;
      default: return null;
    }
  };

  return (
    <div className="bg-[#1c222a] flex-[4_4_0] border-l border-r border-gray-700 min-h-screen">
      <div className="flex items-center justify-between p-4 border-b border-gray-700 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-400 hover:text-white"
          >
            <FaArrowLeft />
          </button>
          <p className='font-bold text-white'>Notifications</p>
        </div>
        
        {/* Delete All Notifications Button */}
        {notifications?.length > 0 && (
          <button 
            onClick={() => {
              document.getElementById('delete_all_notifications_modal').showModal();
            }}
            className="text-red-500 hover:text-red-700 flex items-center gap-2"
          >
            {/* <IoTrash className="w-5 h-5" /> */}
            <span className="hidden md:inline text-white">Clear Notifications</span>
          </button>
        )}
      </div>

      {isLoading && (
        <div className='flex justify-center h-full items-center'>
          <LoadingSpinner size='lg' />
        </div>
      )}

      {notifications?.length === 0 && (
        <div className='text-center p-4 font-bold text-white'>No notifications 🤔</div>
      )}

      {notifications?.map((notification) => (
        <div
          key={notification._id}
          className={`border-b border-gray-700 ${!notification.read ? 'bg-gray-800' : ''}`}
        >
          <div className='flex items-center gap-3 p-4'>
            <Link to={`/profile/${notification.from.username}`}>
              <div className='avatar'>
                <div className='w-10 h-10 rounded-full'>
                  <img 
                    src={notification.from.profileImg || "/avatar-placeholder.png"} 
                    alt={notification.from.username} 
                  />
                </div>
              </div>
            </Link>
            
            <div className='flex-1'>
              <div className='flex items-center justify-between'>
                <div>
                  <span className='font-bold text-blue-400'>
                    @{notification.from.username}
                  </span>
                  <span className='ml-2 text-white'>
                    {getNotificationMessage(notification)}
                  </span>
                </div>
                <NotificationIcon type={notification.type} />
              </div>

              {(["like", "comment", "bookmarked", "repost"].includes(notification.type)) && notification.post && (
                <Link 
                  to={`/post/${notification.post._id || notification.post}`} 
                  className='text-sm text-blue-400 hover:underline mt-1 block'
                >
                  View post
                </Link>
              )}
            </div>

            <div className='ml-2'>
              <button
                onClick={(e) => handleDeleteNotification(notification._id, e)}
                className="text-red-500 hover:text-gray-700"
              >
                <FaTrashAlt className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Delete Single Notification Modal */}
      <dialog id="delete_notification_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Delete Notification</h3>
          <p className="py-4">Are you sure you want to delete this notification?</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-outline mr-2">Cancel</button>
              <button 
                onClick={confirmDeleteNotification}
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

      {/* Delete All Notifications Modal */}
      <dialog id="delete_all_notifications_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-white">Delete All Notifications</h3>
          <p className="py-4 text-gray-300">Are you sure you want to delete all notifications?</p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-outline mr-2">Cancel</button>
              <button 
                onClick={() => deleteAllNotifications()}
                className="btn btn-warning"
              >
                {isDeletingAll ? <LoadingSpinner size="sm" /> : "Delete All"}
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default NotificationPage;