// import { useState, useEffect, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { toast } from "react-hot-toast";
// import LoadingSpinner from "../../components/common/LoadingSpinner";
// import { FaArrowLeft } from "react-icons/fa";
// import { IoSend } from "react-icons/io5";
// import { useSocket } from "../../context/SocketContext";
// import { fetchWithAuth } from "../../fetchWithAuth";

// const MessagesPage = () => {
//   const { id: chatUserId } = useParams();
//   const [message, setMessage] = useState("");
//   const messagesEndRef = useRef(null);
//   const queryClient = useQueryClient();
//   const navigate = useNavigate();
//   const { socket, onlineUsers } = useSocket();
  
//   // Get authenticated user from global cache
//   const authUser = queryClient.getQueryData(["authUser"]);

//   // Fetch all users for messaging
//   const { data: users = [], isLoading: loadingUsers } = useQuery({
//     queryKey: ["allUsers"],
//     queryFn: async () => {
//       try {
//         // Use the endpoint for getting all users for sidebar
//         const res = await fetchWithAuth(`/api/users/getOnlineUsers`, {
//           credentials: 'include'
//         });
//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Something went wrong");
//         return data;
//       } catch (error) {
//         // Fallback to suggested users if getOnlineUsers fails
//         try {
//           const res = await fetchWithAuth(`/api/users/suggested`, {
//             credentials: 'include'
//           });
//           const data = await res.json();
//           if (!res.ok) throw new Error(data.error || "Something went wrong");
//           return data;
//         } catch (fallbackError) {
//           console.error("Error fetching users:", fallbackError);
//           return [];
//         }
//       }
//     }
//   });

//   // Fetch messages for current chat
//   const { data: messages = [], isLoading: loadingMessages } = useQuery({
//     queryKey: ["messages", chatUserId],
//     queryFn: async () => {
//       if (!chatUserId) return [];
//       try {
//         const res = await fetchWithAuth(`/api/messages/${chatUserId}`, {
//           credentials: 'include'
//         });
//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Something went wrong");
//         return data;
//       } catch (error) {
//         console.error("Error fetching messages:", error);
//         return [];
//       }
//     },
//     enabled: !!chatUserId,
//   });

//   // Fetch chat user details
//   const { data: chatUser } = useQuery({
//     queryKey: ["user", chatUserId],
//     queryFn: async () => {
//       if (!chatUserId) return null;
//       try {
//         // First try with profile endpoint
//         const res = await fetchWithAuth(`/api/users/profile/${chatUserId}`, {
//           credentials: 'include'
//         });
//         const data = await res.json();
//         if (!res.ok) {
//           // If profile endpoint fails, try with the regular endpoint
//           const fallbackRes = await fetchWithAuth(`/api/users/${chatUserId}`, {
//             credentials: 'include'
//           });
//           const fallbackData = await fallbackRes.json();
//           if (!fallbackRes.ok) throw new Error(fallbackData.error || "Something went wrong");
//           return fallbackData;
//         }
//         return data;
//       } catch (error) {
//         console.error("Error fetching user:", error);
//         return null;
//       }
//     },
//     enabled: !!chatUserId,
//   });

//   // Send message mutation
//   const { mutate: sendMessageMutation, isPending: isSending } = useMutation({
//     mutationFn: async ({ receiverId, message }) => {
//       try {
//         const res = await fetchWithAuth(`/api/messages/send/${receiverId}`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ message }),
//           credentials: 'include'
//         });
//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Something went wrong");
//         return data;
//       } catch (error) {
//         console.error("Error sending message:", error);
//         throw error;
//       }
//     },
//     onSuccess: (data) => {
//       setMessage("");
      
//       // If we have socket, emit the message
//       if (socket) {
//         socket.emit('sendMessage', {
//           receiverId: chatUserId,
//           message: data.message,
//           senderUsername: authUser?.username,
//           senderProfileImg: authUser?.profileImg,
//           _id: data._id
//         });
//       }
      
//       // Optimistically update the messages
//       queryClient.setQueryData(["messages", chatUserId], (oldData = []) => {
//         return [...oldData, data];
//       });
      
//       // Scroll to bottom
//       scrollToBottom();
//     },
//     onError: (error) => {
//       toast.error(error.message || "Failed to send message");
//     }
//   });

//   // Mark messages as read
//   const markMessagesAsRead = async (userId) => {
//     if (!userId) return;
    
//     try {
//       await fetchWithAuth(`/api/messages/${userId}/read`, {
//         method: "PUT",
//         credentials: 'include'
//       });
//       // Invalidate unread count
//       queryClient.invalidateQueries({ queryKey: ["unreadMessageCount"] });
//     } catch (error) {
//       console.error("Error marking messages as read:", error);
//     }
//   };

//   // Handle new chat selection
//   const handleChatSelect = (userId) => {
//     navigate(`/messages/${userId}`);
//   };

//   // Handle send message
//   const handleSendMessage = (e) => {
//     e.preventDefault();
//     if (!message.trim() || !chatUserId) return;
    
//     sendMessageMutation({
//       receiverId: chatUserId,
//       message: message.trim()
//     });
//   };

//   // Socket listener for new messages
//   useEffect(() => {
//     if (!socket) return;

//     const handleNewMessage = (newMessage) => {
//       console.log("Received new message via socket:", newMessage);
      
//       // If we're in the chat with the sender, update the messages
//       if (chatUserId === newMessage.senderId) {
//         queryClient.setQueryData(["messages", chatUserId], (oldData = []) => {
//           // Check if message already exists to avoid duplicates
//           const messageExists = oldData.some(msg => msg._id === newMessage._id);
//           if (messageExists) return oldData;
//           return [...oldData, newMessage];
//         });
        
//         // Mark as read immediately since we're viewing it
//         markMessagesAsRead(newMessage.senderId);
        
//         // Scroll to bottom
//         scrollToBottom();
//       } else {
//         // Update unread count for other chats
//         queryClient.invalidateQueries({ queryKey: ["unreadMessageCount"] });
//       }
//     };

//     socket.on("newMessage", handleNewMessage);

//     // Listen for online users updates
//     socket.on("getOnlineUsers", (onlineUsersList) => {
//       console.log("Online users updated via socket:", onlineUsersList);
      
//       // Force refetch users to get updated online statuses
//       if (onlineUsersList && onlineUsersList.length > 0) {
//         queryClient.invalidateQueries({ queryKey: ["allUsers"] });
//       }
//     });

//     return () => {
//       socket.off("newMessage", handleNewMessage);
//       socket.off("getOnlineUsers");
//     };
//   }, [socket, chatUserId, queryClient]);

//   // Scroll to bottom of messages
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   // Scroll to bottom when messages change
//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // When a chat is opened, mark messages as read
//   useEffect(() => {
//     if (chatUserId) {
//       markMessagesAsRead(chatUserId);
//     }
//   }, [chatUserId]);

//   // Format date for message timestamps
//   const formatMessageTime = (timestamp) => {
//     const date = new Date(timestamp);
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   // Check if a user is online
//   const isUserOnline = (userId) => {
//     if (!onlineUsers || !Array.isArray(onlineUsers) || !userId) return false;
//     return onlineUsers.includes(userId.toString());
//   };

//   // Sort users with online users first
//   const sortedUsers = [...(users || [])].filter(user => user._id !== authUser?._id).sort((a, b) => {
//     const aIsOnline = isUserOnline(a._id);
//     const bIsOnline = isUserOnline(b._id);
//     if (aIsOnline && !bIsOnline) return -1;
//     if (!aIsOnline && bIsOnline) return 1;
//     return 0;
//   });

//   // Count online users
//   const onlineUsersCount = onlineUsers && Array.isArray(onlineUsers) ? 
//     sortedUsers.filter(user => isUserOnline(user._id)).length : 0;

//   // Debug log - remove in production
//   console.log("Current online users from context:", onlineUsers);
//   console.log("Users who are shown as online:", sortedUsers.filter(user => isUserOnline(user._id)).map(u => u.username));

//   return (
//     <div className="flex-[4_4_0] border-l border-r border-gray-700 min-h-screen flex">
//       {/* Left sidebar - Users */}
//       <div className="w-1/3 border-r border-gray-700 flex flex-col">
//         <div className="p-4 border-b border-gray-700">
//           <h2 className="font-bold text-lg">Messages</h2>
//           <p className="text-xs text-gray-400">
//             {onlineUsers && Array.isArray(onlineUsers) ? 
//               `${onlineUsersCount} utilisateurs en ligne` : 'Chargement...'}
//           </p>
//         </div>

//         {/* Sorted user list (online first) */}
//         <div className="flex-1 overflow-y-auto">
//           {loadingUsers ? (
//             <div className="flex justify-center items-center h-20">
//               <LoadingSpinner size="md" />
//             </div>
//           ) : (
//             <div>
//               <h3 className="px-4 py-2 text-sm font-semibold text-gray-400">
//                 Utilisateurs ({sortedUsers.length}) <span className="text-green-500">{onlineUsersCount} en ligne</span>
//               </h3>
              
//               {sortedUsers.map((user) => (
//                 <div
//                   key={user._id}
//                   onClick={() => handleChatSelect(user._id)}
//                   className={`flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer ${
//                     chatUserId === user._id ? "bg-gray-800" : ""
//                   } ${isUserOnline(user._id) ? "border-l-2 border-green-500" : ""}`}
//                 >
//                   <div className="relative">
//                     <div className="avatar">
//                       <div className="w-10 h-10 rounded-full">
//                         <img
//                           src={user.profileImg || "/avatar-placeholder.png"}
//                           alt={user.username}
//                         />
//                       </div>
//                     </div>
//                     {isUserOnline(user._id) && (
//                       <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></span>
//                     )}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center">
//                       <span className="font-semibold text-white truncate">@{user.username}</span>
//                       {isUserOnline(user._id) && (
//                         <span className="ml-2 text-xs text-green-500">Online</span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Right side - Chat Area */}
//       <div className="w-2/3 flex flex-col">
//         {chatUserId ? (
//           <>
//             {/* Chat Header */}
//             <div className="flex items-center p-4 border-b border-gray-700">
//               <button
//                 onClick={() => navigate("/messages")}
//                 className="text-gray-400 hover:text-white mr-3 md:hidden"
//               >
//                 <FaArrowLeft />
//               </button>

//               {chatUser ? (
//                 <div className="flex items-center">
//                   <div className="relative mr-3">
//                     <div className="avatar">
//                       <div className="w-10 h-10 rounded-full">
//                         <img
//                           src={chatUser.profileImg || "/avatar-placeholder.png"}
//                           alt={chatUser.username}
//                         />
//                       </div>
//                     </div>
//                     {isUserOnline(chatUser._id) && (
//                       <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></span>
//                     )}
//                   </div>
//                   <div>
//                     <h3 className="font-bold">@{chatUser.username}</h3>
//                     <p className="text-xs text-gray-400">
//                       {isUserOnline(chatUser._id) ? "Online" : "Offline"}
//                     </p>
//                   </div>
//                 </div>
//               ) : loadingMessages ? (
//                 <LoadingSpinner size="sm" />
//               ) : (
//                 <p className="font-bold">Select a conversation</p>
//               )}
//             </div>

//             {/* Messages */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-4">
//               {loadingMessages ? (
//                 <div className="flex justify-center items-center h-full">
//                   <LoadingSpinner size="lg" />
//                 </div>
//               ) : messages && messages.length > 0 ? (
//                 messages.map((msg) => {
//                   const isOwnMessage = msg.senderId === authUser?._id;
                  
//                   return (
//                     <div
//                       key={msg._id}
//                       className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
//                     >
//                       <div
//                         className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
//                           isOwnMessage
//                             ? "bg-blue-600 text-white rounded-br-none"
//                             : "bg-gray-800 text-white rounded-bl-none"
//                         }`}
//                       >
//                         <p>{msg.message}</p>
//                         <p className="text-xs text-gray-300 mt-1 text-right">
//                           {formatMessageTime(msg.createdAt)}
//                         </p>
//                       </div>
//                     </div>
//                   );
//                 })
//               ) : (
//                 <div className="flex justify-center items-center h-full text-gray-500">
//                   {chatUser ? `Start a conversation with @${chatUser?.username}` : "Select a user to start chatting"}
//                 </div>
//               )}
//               <div ref={messagesEndRef} />
//             </div>

//             {/* Message Input */}
//             <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
//               <div className="flex">
//                 <input
//                   type="text"
//                   value={message}
//                   onChange={(e) => setMessage(e.target.value)}
//                   placeholder="Type a message..."
//                   className="flex-1 bg-gray-800 rounded-l-full px-4 py-2 focus:outline-none text-white"
//                 />
//                 <button
//                   type="submit"
//                   disabled={!message.trim() || isSending}
//                   className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-r-full px-4 py-2 flex items-center justify-center disabled:opacity-50"
//                 >
//                   {isSending ? (
//                     <LoadingSpinner size="sm" />
//                   ) : (
//                     <IoSend />
//                   )}
//                 </button>
//               </div>
//             </form>
//           </>
//         ) : (
//           // No active chat
//           <div className="flex-1 flex items-center justify-center text-gray-500">
//             <div className="text-center">
//               <h3 className="text-xl font-bold mb-2">Welcome to Messages</h3>
//               <p>Select a user to start chatting</p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MessagesPage;
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { FaArrowLeft } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { useSocket } from "../../context/SocketContext";
import { fetchWithAuth } from "../../fetchWithAuth";

const MessagesPage = () => {
  const { id: chatUserId } = useParams();
  const [message, setMessage] = useState("");
  const [showOnline, setShowOnline] = useState(true);
  const [showOffline, setShowOffline] = useState(false);
  const [messageLimit, setMessageLimit] = useState(10);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { socket, onlineUsers } = useSocket();

  const authUser = queryClient.getQueryData(["authUser"]);

  // Fetch following users
  const { data: followingUsers = [], isLoading: loadingFollowing } = useQuery({
    queryKey: ["followingUsers"],
    queryFn: async () => {
      try {
        const res = await fetchWithAuth(`/api/users/following/${authUser.username}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        return data;
      } catch (error) {
        console.error("Error fetching following users:", error);
        return [];
      }
    },
    enabled: !!authUser?.username,
  });

  // Fetch messages for current chat
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", chatUserId],
    queryFn: async () => {
      if (!chatUserId) return [];
      try {
        const res = await fetchWithAuth(`/api/messages/${chatUserId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        return data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
      }
    },
    enabled: !!chatUserId,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 1000,
  });

  // Calculate displayed messages with pagination
  const displayedMessages = messages.slice(-messageLimit);

  // Find user directly in following users list
  const chatUser = chatUserId
    ? followingUsers.find(user => user._id === chatUserId)
    : null;

  const loadingChatUser = loadingFollowing;

  // Send message mutation
  const { mutate: sendMessageMutation, isPending: isSending } = useMutation({
    mutationFn: async ({ receiverId, message }) => {
      try {
        const res = await fetchWithAuth(`/api/messages/send/${receiverId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        return data;
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setMessage("");
      queryClient.setQueryData(["messages", chatUserId], (oldData = []) => {
        return oldData.some(msg => msg._id === data._id) ? oldData : [...oldData, data];
      });
      queryClient.invalidateQueries(["messages", chatUserId]);
      setTimeout(scrollToBottom, 100);
    },
    onError: (error) => toast.error(error.message || "Failed to send message"),
  });

  // Mark messages as read
  const markMessagesAsRead = async (userId) => {
    if (!userId) return;
    try {
      await fetchWithAuth(`/api/messages/${userId}/read`, {
        method: "PUT",
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: ["unreadMessageCount"] });
    } catch {}
  };

  const handleChatSelect = (userId) => navigate(`/messages/${userId}`);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !chatUserId) return;
    sendMessageMutation({ receiverId: chatUserId, message: message.trim() });
  };

  // Load more messages
  const loadMoreMessages = () => {
    setMessageLimit(prev => prev + 10);
  };

  // Socket listener for new messages
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (newMessage) => {
      if (chatUserId === newMessage.senderId) {
        queryClient.setQueryData(["messages", chatUserId], (oldData = []) => {
          return oldData.some(msg => msg._id === newMessage._id) ? oldData : [...oldData, newMessage];
        });
        queryClient.invalidateQueries(["messages", chatUserId]);
        markMessagesAsRead(newMessage.senderId);
        setTimeout(scrollToBottom, 100);
      } else {
        queryClient.invalidateQueries({ queryKey: ["unreadMessageCount"] });
      }
    };
    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, chatUserId, queryClient]);

  useEffect(() => { if (chatUserId) markMessagesAsRead(chatUserId); }, [chatUserId]);
  
  const scrollToBottom = () => { 
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" }); 
    }
  };
  
  useEffect(() => { 
    if (messages.length > 0) {
      scrollToBottom(); 
      // Reset message limit to 10 when conversation changes
      setMessageLimit(10);
    } 
  }, [messages, chatUserId]);

  const formatMessageTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const isUserOnline = (userId) => Array.isArray(onlineUsers) && onlineUsers.includes(userId?.toString());
  
  const sortedUsers = [...(followingUsers || [])].sort((a, b) => isUserOnline(b._id) - isUserOnline(a._id));
  
  const onlineUsersCount = sortedUsers.filter(user => isUserOnline(user._id)).length;

  return (
    <div className="bg-[#1c222a] flex-[4_4_0] border-l border-r border-gray-700 min-h-screen flex">
    {/* Sidebar */}
  <div className="w-1/3 border-r border-gray-700 flex flex-col h-screen max-h-screen overflow-hidden">
    <div className="p-4 border-b border-gray-700">
      <h2 className="font-bold text-lg text-white">Messages</h2>
      <p className="text-xs text-gray-400">
        {onlineUsers ? `${onlineUsersCount} following online` : "Loading..."}
      </p>
    </div>

    {/* Custom Accordion */}
    <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
      {/* Online */}
      <div>
        <button 
          onClick={() => setShowOnline(!showOnline)} 
          className="w-full px-4 py-2 text-left text-sm font-semibold text-green-400 hover:bg-gray-800"
        >
          Online Followers ({onlineUsersCount})
        </button>
        {showOnline && (
          <div className="space-y-1 px-2 pb-2 max-h-[40vh] overflow-y-auto">
            {sortedUsers.filter(u => isUserOnline(u._id)).map(user => (
              <div 
                key={user._id} 
                onClick={() => handleChatSelect(user._id)}
                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer 
                  ${chatUserId === user._id ? "bg-gray-800" : ""} 
                  border-l-2 border-green-500`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img 
                      src={user.profileImg || "/avatar-placeholder.png"} 
                      alt={user.username} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-white truncate block">@{user.username}</span>
                </div>
              </div>
            ))}
            {sortedUsers.filter(u => isUserOnline(u._id)).length === 0 && (
              <div className="text-gray-400 text-sm p-3">
                No followers online at the moment
              </div>
            )}
          </div>
        )}
      </div>

      {/* Offline */}
      <div>
        <button 
          onClick={() => setShowOffline(!showOffline)} 
          className="w-full px-4 py-2 text-left text-sm font-semibold text-gray-400 hover:bg-gray-800"
        >
          Offline Followers ({sortedUsers.length - onlineUsersCount})
        </button>
        {showOffline && (
          <div className="space-y-1 px-2 pb-2 max-h-[74vh] overflow-y-auto">
            {sortedUsers.filter(u => !isUserOnline(u._id)).map(user => (
              <div 
                key={user._id} 
                onClick={() => handleChatSelect(user._id)}
                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer 
                  ${chatUserId === user._id ? "bg-gray-800" : ""}`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img 
                      src={user.profileImg || "/avatar-placeholder.png"} 
                      alt={user.username} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-white truncate block">@{user.username}</span>
                </div>
              </div>
            ))}
            {sortedUsers.filter(u => !isUserOnline(u._id)).length === 0 && (
              <div className="text-gray-400 text-sm p-3">
                All your followers are online!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>

      {/* Chat area */}
      {/* Chat area */}
  <div className="w-2/3 flex flex-col h-[100vh] max-h-screen"> {/* Added height constraint */}
    {chatUserId ? (
      <>
        <div className="flex items-center p-4 border-b border-gray-700">
          <button onClick={() => navigate("/messages")} className="text-gray-400 hover:text-white mr-3 md:hidden">
            <FaArrowLeft />
          </button>
          {loadingChatUser ? (
            <LoadingSpinner size="sm" />
          ) : chatUser ? (
            <div className="flex items-center">
              <div className="relative mr-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img 
                    src={chatUser.profileImg || "/avatar-placeholder.png"} 
                    alt={chatUser.username} 
                    className="w-full h-full object-cover"
                  />
                </div>
                {isUserOnline(chatUser._id) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-white">@{chatUser.username}</h3>
                <p className="text-xs text-gray-400">{isUserOnline(chatUser._id) ? "Online" : "Offline"}</p>
              </div>
            </div>
          ) : (
            <h2 className="font-bold text-lg text-white">User not found</h2>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4"> {/* Kept as is for scroll */}
          {messages.length > displayedMessages.length && (
            <div className="text-center">
              <button 
                onClick={loadMoreMessages}
                className="text-sm text-gray-400 hover:text-white mb-2"
              >
                Load more messages ({messages.length - displayedMessages.length} remaining)
              </button>
            </div>
          )}

          {loadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner size="lg" />
            </div>
          ) : displayedMessages.length > 0 ? (
            displayedMessages.map(msg => {
              const isOwn = msg.senderId === authUser?._id;
              return (
                <div key={msg._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${isOwn ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-800 text-white rounded-bl-none"}`}>
                    <p>{msg.message}</p>
                    <p className="text-xs text-gray-300 mt-1 text-right">{formatMessageTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            })
          ) : chatUser ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Start a conversation with @{chatUser.username}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              User not found
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
          <div className="flex">
            <input 
              type="text" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Type a message..."
              className="flex-1 bg-gray-800 rounded-l-full px-4 py-2 focus:outline-none text-white" 
            />
            <button 
              type="submit" 
              disabled={!message.trim() || isSending || !chatUser}
              className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-r-full px-4 py-2 disabled:opacity-50"
            >
              {isSending ? <LoadingSpinner size="sm" /> : <IoSend />}
            </button>
          </div>
        </form>
      </>
    ) : (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a user to start chatting
      </div>
    )}
  </div>
    </div>
  );
};

export default MessagesPage;