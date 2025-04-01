import { useEffect, useState } from "react";
import Posts from "../../components/common/Posts";
import CreatePost from "./CreatePost";
import WebcamEmotionDetector from "../../components/WebcamEmotionDetector";
import { API_URL } from "../../API";
import { fetchWithAuth } from "../../fetchWithAuth";

const HomePage = () => {
	const [feedType, setFeedType] = useState("forYou");
	const [searchKeyword, setSearchKeyword] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [hashtags, setHashtags] = useState([]);
	const [selectedHashtag, setSelectedHashtag] = useState(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [selectedRange, setSelectedRange] = useState(null);
	const [activeSearch, setActiveSearch] = useState({
		keywords: "",
		startDate: "",
		endDate: "",
		isDateRangeActive: false
	});
	const [hasActiveSearch, setHasActiveSearch] = useState(false);

	const handleAdvancedSearch = async () => {
		setIsSearching(true);
	
		try {
			let queryParams = [];
	
			if (searchKeyword.trim()) {
				queryParams.push(`keyword=${encodeURIComponent(searchKeyword.trim())}`);
			}
	
			if (startDate) queryParams.push(`startDate=${startDate}`);
			if (endDate) queryParams.push(`endDate=${endDate}`);
	
			queryParams.push(`sortBy=createdAt`);
			queryParams.push(`sortOrder=-1`);
	
			const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
			
			const url = `/api/posts/search${queryString}`;
			const response = await fetchWithAuth(url, {
				credentials: 'include' // Include cookies
			});
	
			if (!response.ok) {
				throw new Error(`Server responded with status: ${response.status}`);
			}
			
			const data = await response.json();
			setSearchResults(data.posts);
			
			setHasActiveSearch(true);
			
			setActiveSearch({
				keywords: searchKeyword.trim(),
				startDate: startDate,
				endDate: endDate,
				isDateRangeActive: !!(startDate && endDate)
			});
		} catch (error) {
			console.error("Error during search:", error);
		} finally {
			setIsSearching(false);
		}
	};
	

	const applyDateRange = () => {
		if (startDate && endDate) {
			setSelectedRange(`${startDate} to ${endDate}`);
			setIsModalVisible(false); // Close the modal
			handleAdvancedSearch(); // Trigger search with the date range
		}
	};



	const fetchHashtags = async () => {
		try {
			const response = await fetchWithAuth(
				`/api/posts/search/hashtags/popular`,{
					credentials: 'include'
				}
			);
			const data = await response.json();
			if (response.ok) {
				setHashtags(data);
				console.log("result hashtags", data);
			} else {
				console.error(
					"Erreur lors de la récupération des hashtags:",
					data.error
				);
			}
		} catch (error) {
			console.error("Erreur lors de la récupération des hashtags:", error.message);
		}
	};

	useEffect(() => {
		fetchHashtags();
	}, []);

	// Fonction de gestion de la recherche par mot-clé
	const handleSearch = async () => {
		if (!searchKeyword.trim()) {
			setSearchResults([]);
			setHasActiveSearch(false);
			return;
		}
	
		setIsSearching(true);
	
		try {
			const queryParams = [`keyword=${encodeURIComponent(searchKeyword.trim())}`];
			
			if (activeSearch.isDateRangeActive) {
				if (startDate) queryParams.push(`startDate=${startDate}`);
				if (endDate) queryParams.push(`endDate=${endDate}`);
			}
			
			const queryString = queryParams.join('&');
			
			// Get the authentication token from localStorage
			const token = localStorage.getItem('jwt');
			
			// Include the token in the request headers
			const response = await fetchWithAuth(`/api/posts/search-by-keyword?${queryString}`, {
				credentials: 'include' 
			});
			
			if (!response.ok) {
				throw new Error(`Server responded with status: ${response.status}`);
			}
			
			const data = await response.json();
			setSearchResults(data.posts);
			setHasActiveSearch(true);
			
			setActiveSearch({
				keywords: searchKeyword.trim(),
				startDate: startDate,
				endDate: endDate,
				isDateRangeActive: !!(startDate && endDate)
			});
		} catch (error) {
			console.error("Error during search:", error);
		} finally {
			setIsSearching(false);
		}
	};

	const showModal = () => {
		setIsModalVisible(true);
	};

	const handleCancel = () => {
		setIsModalVisible(false);
	};

	const resetAllSearch = () => {
		setSearchResults([]);
		setSearchKeyword("");
		setStartDate("");
		setEndDate("");
		setSelectedRange(null);
		setActiveSearch({
			keywords: "",
			startDate: "",
			endDate: "",
			isDateRangeActive: false
		});
		setHasActiveSearch(false);
		setSelectedHashtag(null);
	};

	return (
		<>
			<div className="flex-[4_4_0] mr-auto border-r border-gray-700 min-w-screen">
				{/* Header */}
					{/* Webcam Emotion Detector */}
					{/* <WebcamEmotionDetector /> */}
				<div className="flex w-full border-b border-gray-700">
					<div
						className="flex justify-center flex-1 p-3 transition duration-300 cursor-pointer relative"
						onClick={() => {
							setFeedType("forYou");
							resetAllSearch();
						}} 
					>
						Feeds
						{feedType === "forYou" && (
							<div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" style={{ backgroundColor: '#05afdf', borderColor: '#05afdf'}}></div>
						)}
					</div>
					{/* <div
						className="flex justify-center flex-1 p-3 transition duration-300 cursor-pointer relative"
						onClick={() => {
							setFeedType("following");
							resetAllSearch();
						}}
					>
						Following
						{feedType === "following" && (
							<div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" style={{ backgroundColor: '#05afdf', borderColor: '#05afdf'}}></div>
						)}
					</div> */}
				</div>

				{/* SEARCH BAR */}
				<div className="flex items-center p-4 border-b border-gray-700">
					<input
						type="text"
						placeholder="Search posts..."
						className="flex-1 p-2 bg-transparent border border-gray-700 rounded-l-lg focus:outline-none focus:border-primary"
						value={searchKeyword}
						onChange={(e) => setSearchKeyword(e.target.value)}
						onKeyPress={(e) => {
							if (e.key === "Enter") handleSearch();
						}}
					/>
					<button
						className="p-2 bg-primary text-white rounded-r-lg hover:bg-primary-dark transition duration-300"
						style={{ backgroundColor: '#05afdf', borderColor: '#05afdf'}}
						onClick={handleSearch}
						disabled={isSearching}
					>
						{isSearching ? "Searching..." : "Search"}
					</button>
				</div>

				{/* Advanced Search button */}
				<div className="p-1 ml-4 flex items-center">
					<button
						onClick={showModal}
						className="text-sm text-blue-500 hover:text-blue-700 transition duration-300"
					>
						Advanced Search
					</button>
					
					{hasActiveSearch && (
						<button
							onClick={resetAllSearch}
							className="text-sm text-red-500 hover:text-red-700 transition duration-300 ml-4"
						>
							Clear All Filters
						</button>
					)}
				</div>

				{/* MODAL */}
				{isModalVisible && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
							<h3 className="text-lg font-semibold mb-4 text-white">Advanced Search</h3>
							<div className="flex flex-col mb-4">
								<label className="text-sm mb-2 text-gray-300">Start Date</label>
								<input
									type="date"
									className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
								/>
							</div>
							<div className="flex flex-col mb-4">
								<label className="text-sm mb-2 text-gray-300">End Date</label>
								<input
									type="date"
									className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									min={startDate} // Prevent selecting end date before start date
								/>
							</div>
							<div className="flex justify-between">
								<button
									onClick={handleCancel}
									className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition duration-300"
								>
									Cancel
								</button>
								<button
									onClick={applyDateRange}
									className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition duration-300"
									disabled={!startDate || !endDate}
								>
									Apply
								</button>
							</div>
						</div>
					</div>
				)}
				
				{/* Date Range Display */}
				{selectedRange && (
					<div className="flex items-center ml-5 mt-2 mb-2 bg-gray-700 inline-block px-3 py-1 rounded-full">
						<span className="mr-2 text-sm">Date Range: {selectedRange}</span>
					</div>
				)}
				{/* Display search or result status */}
				{hasActiveSearch && (
					<div className="ml-5 mt-4 mb-2 text-gray-400 text-sm">
						{searchResults.length === 0 ? (
							<span className="text-yellow-500">No results found</span>
						) : (
							<span>{searchResults.length} results found</span>
						)}
						{activeSearch.keywords && <span> for "{activeSearch.keywords}"</span>}
						{activeSearch.isDateRangeActive && <span> in advanced search</span>}
						
					</div>
				)}
				{/* Hashtags populaires */}
				<div className="mt-5">
	<h3 className="text-gray-300 text-sm mb-2 ml-5">Hashtags populaires :</h3>
	<div className="flex flex-wrap gap-2">
		{hashtags.length > 0 ? (
			hashtags.map((tag, index) => {
				const cleanHashtag = tag.hashtag.replace(/^#/, "");

				return (
					<span
						key={index}
						className={`ml-1 px-2 py-1 rounded-lg cursor-pointer transition duration-300 
							${selectedHashtag === cleanHashtag
								? "bg-blue-500 text-white"
								: "bg-gray-700 text-white hover:bg-primary"
							}`}
						onClick={() => {
							setSearchKeyword(cleanHashtag); // Set the search keyword to the clicked hashtag
							setSelectedHashtag(cleanHashtag); // Highlight the selected hashtag
							
							// Auto-search when clicking on a hashtag
							handleSearch();
						}}
					>
						{tag.hashtag} ({tag.count})
					</span>
				);
			})
		) : (
			<p className="text-gray-500 ml-5">Aucun hashtag populaire</p>
		)}
	</div>
</div>


				

				{/* CREATE POST INPUT */}
				<CreatePost />

				{/* POSTS */}
				{hasActiveSearch ? (
					searchResults.length > 0 ? (
						<Posts posts={searchResults} />
					) : (
						<div className="flex flex-col items-center justify-center p-10 text-gray-500">
							<p className="text-xl mb-2">No posts found</p>
							<p className="text-sm">Try adjusting your search</p>
						</div>
					)
				) : (
					<Posts feedType={feedType} />
				)}
			</div>
		</>
	);
};

export default HomePage;