import { Link } from "react-router-dom";
import { useState } from "react";

import XSvg from "../../../components/svgs/X";
import logo from '../../../components/svgs/logo.webp'
import { MdOutlineMail } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { MdPassword } from "react-icons/md";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { API_URL } from "../../../API"
import { fetchWithAuth } from "../../../fetchWithAuth";
import {useNavigate } from "react-router-dom";


const SignUpPage = () => {
	const [formData, setFormData] = useState({
		email: "",
		username: "",
		fullName: "",
		password: "",
	});

	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { mutate, isError, isPending, error } = useMutation({
		mutationFn: async ({ email, username, fullName, password }) => {
		try {
			const res = await fetchWithAuth(`/api/auth/signup`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: 'include',
			body: JSON.stringify({ email, username, fullName, password }),
			});
		
			console.log("Response :",res)
			// Check if response is empty
			const text = await res.text();
			if (!text) {
			throw new Error("Server returned an empty response");
			}
		
			// Try to parse as JSON
			let data;
			try {
			data = JSON.parse(text);
			} catch (e) {
			throw new Error(`Invalid JSON response: ${text}`);
			}
		
			if (!res.ok) throw new Error(data.error || "Failed to create account");
			console.log(data);
			return data;
		} catch (error) {
			console.error(error);
			throw error;
		}
		},
		onSuccess: () => {
			toast.success("Account created successfully");
			
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
			
			// Redirection vers la page de connexion
			// Détection des appareils mobiles
			if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
			  // Redirection "forte" pour les appareils mobiles
			  setTimeout(() => {
				window.location.href = window.location.origin + "/login";
			  }, 1500); // Délai pour que le toast soit visible
			} else {
			  // Utiliser navigate pour les navigateurs desktop
			  navigate("/login");
			}
		  }
	});

	const handleSubmit = (e) => {
		e.preventDefault(); // page won't reload
		mutate(formData);
	};

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	return (
		<div className='bg-[#1c222a] max-w-screen-xl mx-auto flex h-screen px-10'>
			<div className='flex-1 hidden lg:flex items-center  justify-center'>
            <img src={logo} width={300}/>
			</div>
			<div className=' bg-[#1c222a] flex-1 flex flex-col justify-center items-center'>
				<form className='lg:w-2/3  mx-auto md:mx-20 flex gap-4 flex-col' onSubmit={handleSubmit}>
					{/* <XSvg className='w-24 lg:hidden fill-white' /> */}
					<h1 className='text-4xl font-extrabold text-white'>Join Hacktweet.</h1>
					<label className='input input-bordered rounded flex items-center gap-2'>
						<MdOutlineMail />
						<input
							type='email'
							className='grow'
							placeholder='Email'
							name='email'
							onChange={handleInputChange}
							value={formData.email}
						/>
					</label>
					<div className='flex gap-4 flex-wrap'>
						<label className='input input-bordered rounded flex items-center gap-2 flex-1'>
							<FaUser />
							<input
								type='text'
								className='grow '
								placeholder='Username'
								name='username'
								onChange={handleInputChange}
								value={formData.username}
							/>
						</label>
						<label className='input input-bordered rounded flex items-center gap-2 flex-1'>
							<MdDriveFileRenameOutline />
							<input
								type='text'
								className='grow'
								placeholder='Full Name'
								name='fullName'
								onChange={handleInputChange}
								value={formData.fullName}
							/>
						</label>
					</div>
					<label className='input input-bordered rounded flex items-center gap-2'>
						<MdPassword />
						<input
							type='password'
							className='grow'
							placeholder='Password'
							name='password'
							onChange={handleInputChange}
							value={formData.password}
						/>
					</label>
					<button className='btn rounded-full btn-primary text-white' style={{ backgroundColor: '#3bb0d3' }}>
						{isPending ? "Loading..." : "Sign up"}
					</button>
					{isError && <p className='text-red-500'>{error.message}</p>}
				</form>
				<div className='flex flex-col lg:w-2/3 gap-2 mt-4'>
					<p className='text-white text-lg'>Already have an account?</p>
					<Link to='/login'>
						<button className='btn rounded-full btn-primary text-white btn-outline w-full'
                        style={{ borderColor: '#3bb0d3', borderWidth: '2px' }} >Sign in</button>
					</Link>
				</div>
			</div>
		</div>
	);
};
export default SignUpPage;
