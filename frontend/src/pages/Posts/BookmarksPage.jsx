import React from 'react';
import Posts from '../../components/common/Posts';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from "react-icons/fa";

const BookmarksPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-[4_4_0] border-l border-r border-gray-700 min-h-screen">
      <div className="flex items-center p-4 border-b border-gray-700 gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="text-gray-400 hover:text-white"
        >
          <FaArrowLeft />
        </button>
        <h1 className="font-bold text-lg">Saved Posts</h1>
      </div>
      <div>
        <Posts feedType="bookmarks" />
      </div>
    </div>
  );
};

export default BookmarksPage;