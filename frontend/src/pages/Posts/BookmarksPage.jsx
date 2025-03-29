import React from 'react';
import Posts from '../../components/common/Posts';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from "react-icons/fa";

const BookmarksPage = () => {

    const navigate = useNavigate();


  return (
    <div className="flex flex-col">
      <div className="flex items-center p-4 border-b border-gray-700 gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="text-gray-400 hover:text-white"
        >
          <FaArrowLeft />
        </button>
        <h1 className="font-bold text-lg">Saved Posts</h1>
      </div>
      <div className="px-3 pt-2">
        <Posts feedType="bookmarks" />
      </div>
    </div>
  );
};

export default BookmarksPage;