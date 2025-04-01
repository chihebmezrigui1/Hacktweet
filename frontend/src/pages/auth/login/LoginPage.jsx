import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import XSvg from "../../../components/svgs/X";
import logo from '../../../components/svgs/logo.webp'
import { MdOutlineMail } from "react-icons/md";
import { MdPassword } from "react-icons/md";

import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LoginPage = () => {
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});
	// État pour le débogage
	const [debugInfo, setDebugInfo] = useState("");
	
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const {
		mutate: loginMutation,
		isPending,
		isError,
		error,
	} = useMutation({
		mutationFn: async ({ username, password }) => {
			// Afficher les informations de débogage en temps réel
			setDebugInfo("1. Début de la connexion...");
			
			try {
				setDebugInfo(prev => prev + "\n2. Envoi de la requête à " + `${API_URL}/api/auth/login`);
				
				const res = await fetch(`${API_URL}/api/auth/login`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ username, password }),
					credentials: 'include'
				});

				setDebugInfo(prev => prev + `\n3. Statut de la réponse: ${res.status}`);
				
				const data = await res.json();
				setDebugInfo(prev => prev + `\n4. Données reçues: ${JSON.stringify(data).substring(0, 150)}...`);
				
				if (!res.ok) {
					setDebugInfo(prev => prev + `\n5. Erreur détectée: ${data.error || "Unknown error"}`);
					throw new Error(data.error || "Something went wrong");
				}
				
				// Stocker les données utilisateur dans localStorage comme solution de secours
				setDebugInfo(prev => prev + "\n6. Stockage des infos utilisateur dans localStorage");
				localStorage.setItem('userInfo', JSON.stringify(data));
				
				return data;
			} catch (error) {
				setDebugInfo(prev => prev + `\n! Exception: ${error.message}`);
				throw error;
			}
		},
		onSuccess: (data) => {
			setDebugInfo(prev => prev + "\n7. Connexion réussie!");
			// Invalidation des requêtes
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
			
			setDebugInfo(prev => prev + "\n8. Redirection dans 1 seconde...");
			
			// Approche alternative pour la redirection (fonctionne mieux sur mobile)
			setTimeout(() => {
				try {
					// Redirection directe via window.location pour éviter les problèmes React Router sur mobile
					window.location.href = "/";
					setDebugInfo(prev => prev + "\n9. Redirection effectuée via window.location");
				} catch (e) {
					setDebugInfo(prev => prev + `\n! Erreur de redirection: ${e.message}`);
				}
			}, 1000);
		},
		onError: (err) => {
			setDebugInfo(prev => prev + `\n! Erreur finale: ${err.message}`);
		}
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		setDebugInfo(""); // Réinitialiser les infos de débogage
		
		if (!formData.username || !formData.password) {
			setDebugInfo("Erreur: Nom d'utilisateur et mot de passe requis");
			return;
		}
		
		loginMutation(formData);
	};

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	return (
		<div className='max-w-screen-xl mx-auto flex h-screen'>
			<div className='flex-1 hidden lg:flex items-center justify-center'>
				<img src={logo} width={300} alt="Logo" />
			</div>
			<div className='flex-1 flex flex-col justify-center items-center'>
				<form className='flex gap-4 flex-col' onSubmit={handleSubmit}>
					<h1 className='text-4xl font-extrabold text-white'>{"Let's"} go.</h1>
					<label className='input input-bordered rounded flex items-center gap-2'>
						<MdOutlineMail />
						<input
							type='text'
							className='grow'
							placeholder='username'
							name='username'
							onChange={handleInputChange}
							value={formData.username}
							autoComplete="off"
						/>
					</label>

					<label className='input input-bordered rounded flex items-center gap-2'>
						<MdPassword />
						<input
							type='password'
							className='grow'
							placeholder='Password'
							name='password'
							onChange={handleInputChange}
							value={formData.password}
							autoComplete="off"
						/>
					</label>
					<button
						type="submit" 
						className='btn rounded-full btn-primary text-white'
						style={{ backgroundColor: '#3bb0d3', borderColor: '#3bb0d3' }}
					>
						{isPending ? "Loading..." : "Login"}
					</button>
					{isError && <p className='text-red-500'>{error.message}</p>}
				</form>
				<div className='flex flex-col gap-2 mt-4'>
					<p className='text-white text-lg'>{"Don't"} have an account?</p>
					<Link to='/signup'>
						<button className='btn rounded-full btn-primary text-white btn-outline w-full hover:border-[#3bb0d3]'
							style={{ borderColor: '#3bb0d3' }} >Sign up</button>
					</Link>
				</div>
				
				{/* Zone de débogage */}
				{debugInfo && (
					<div className="fixed bottom-0 left-0 right-0 p-3 bg-black text-white text-xs z-50 max-h-64 overflow-auto">
						<div className="flex justify-between items-center mb-1">
							<h3 className="font-bold">Débogage Mobile</h3>
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
		</div>
	);
};

export default LoginPage;