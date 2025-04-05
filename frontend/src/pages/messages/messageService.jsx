// src/services/messageService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Get messages between current user and another user
export const getMessages = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/api/messages/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

// Send a message to another user
export const sendMessage = async (receiverId, message) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/messages/send/${receiverId}`,
      { message },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};