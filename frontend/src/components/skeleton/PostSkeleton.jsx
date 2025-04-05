const PostSkeleton = () => {
	return (
		<div className=' flex flex-col gap-4 w-full p-4 '>
			<div className=' bg-gray-500  flex gap-4 items-center'>
				<div className='bg-gray-500 skeleton w-10 h-10 rounded-full shrink-0'></div>
				<div className='bg-gray-500 flex flex-col gap-2'>
				<div className=' bg-gray-500 skeleton h-2 w-12 rounded-full'></div>
					<div className='bg-gray-500 skeleton h-2 w-24 rounded-full'></div>
				</div>
			</div>
			<div className=' bg-gray-500 skeleton h-40 w-full'></div>
		</div>
	);
};
export default PostSkeleton;
