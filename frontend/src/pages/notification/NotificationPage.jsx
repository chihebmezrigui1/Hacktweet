import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { IoSettingsOutline } from "react-icons/io5";
import { FaBookmark, FaRetweet, FaUser } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";
import { FaComment } from "react-icons/fa";
import { BsBookmark } from "react-icons/bs"; // Import bookmark icon
import { FaTrashAlt } from "react-icons/fa"; // Trash icon for delete
import { useEffect } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../../API";

const NotificationPage = () => {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications`,{credentials: 'include'});
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
  });

  // Mutation for deleting a single notification
  const { mutate: deleteNotification } = useMutation({
	mutationFn: async (notificationId) => {
	  try {
		const res = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
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
  

  // Helper function to get notification message based on type
  const getNotificationMessage = (notification) => {
    switch(notification.type) {
      case "follow":
        return "followed you";
      case "like":
        return "liked your post";
      case "comment":
        return "commented on your post";
      case "bookmarked":
        return "bookmarked your post";
      case "repost":
        return "reposted your post";
      default:
        return "interacted with you";
    }
  };

  // Helper function to get notification icon
  const NotificationIcon = ({ type }) => {
    switch(type) {
      case "follow":
        return <FaUser className='w-7 h-7 text-primary' />;
      case "like":
        return <FaHeart className='w-7 h-7 text-pink-500' />;
      case "comment":
        return <FaComment className='w-7 h-7 text-green-500' />;
      case "bookmarked":
        return <FaBookmark className='w-7 h-7 text-blue-500' />;
      case "repost":
        return <FaRetweet className='w-7 h-7 text-green-500' />;
      default:
        return null;
    }
  };

  // Function to mark notification as read when clicked
  const markAsRead = (notificationId) => {
    fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
      method: "PUT",
      credentials: 'include'
    })
    .then((res) => {
      if (res.ok) {
        toast.success("Notification marked as read");
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } else {
        toast.error("Failed to mark notification as read");
      }
    })
    .catch(() => {
      toast.error("Error occurred while marking as read");
    });
  };

  useEffect(() => {
    const socket = io(); // Assuming you have socket.io client initialized

    // Listen for the 'notification-deleted' event
    socket.on('notification-deleted', (notificationId) => {
        // Remove the notification from the local state (e.g., from notifications list)
        setNotifications(prevNotifications =>
            prevNotifications.filter(notification => notification._id !== notificationId)
        );
    });

    return () => {
        socket.off('notification-deleted'); // Cleanup on component unmount
    };
}, []);

  return (
    <div className='flex-[4_4_0] border-l border-r border-gray-700 min-h-screen'>
      <div className='flex justify-between items-center p-4 border-b border-gray-700'>
        <p className='font-bold'>Notifications</p>
        <div className='dropdown '>
          <div tabIndex={0} role='button' className='m-1'>
            <IoSettingsOutline className='w-4' />
          </div>
          <ul
            tabIndex={0}
            className='dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52'
          >
            <li>
              <a onClick={() => { /* handle delete all notifications */ }}>Delete all notifications</a>
            </li>
          </ul>
        </div>
      </div>

      {isLoading && (
        <div className='flex justify-center h-full items-center'>
          <LoadingSpinner size='lg' />
        </div>
      )}

      {notifications?.length === 0 && <div className='text-center p-4 font-bold'>No notifications 🤔</div>}

      {notifications?.map((notification) => (
        <div
          className={`border-b border-gray-700 ${!notification.read ? 'bg-gray-800' : ''}`}
          key={notification._id}
          onClick={() => markAsRead(notification._id)} // Mark as read on click
        >
          <div className='flex items-center gap-3 p-4'>
            {/* User avatar */}
            <Link to={`/profile/${notification.from.username}`}>
              <div className='avatar'>
                <div className='w-10 h-10 rounded-full'>
                  <img src={notification.from.profileImg || "/avatar-placeholder.png"} alt={notification.from.username} />
                </div>
              </div>
            </Link>
            
            {/* Notification content */}
            <div className='flex-1'>
              <div className='flex items-center justify-between'>
                <div>
                  <span className={`font-bold text-blue-400 ${!notification.read ? 'font-bold' : 'font-normal'}`}>
                    @{notification.from.username}
                  </span>
                  <span style={{marginLeft:5}} className={`${!notification.read ? 'font-bold' : 'font-normal'}`}>
                    {getNotificationMessage(notification)}
                  </span>
                </div>
                <NotificationIcon type={notification.type} />
              </div>

              {/* Link to post if applicable */}
              {(notification.type === "like" || notification.type === "comment" || notification.type === "bookmarked" || notification.type === "repost") && notification.post && (
                <Link 
                  to={`/post/${notification.post._id || notification.post}`} 
                  className='text-sm text-blue-400 hover:underline mt-1 block'
                >
                  View post
                </Link>
              )}
            </div>

            {/* Delete button for individual notification */}
            <div className='ml-2'>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent notification click event
                  deleteNotification(notification._id);
                }}
                className="text-red-500 hover:text-gray-700"
              >
                <FaTrashAlt className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationPage;
