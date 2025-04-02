import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { API_URL } from "../API";
import { fetchWithAuth } from "../fetchWithAuth";

const useFollow = () => {
	const queryClient = useQueryClient();
	const [loadingUser, setLoadingUser] = useState(null); // 🔥 Suivi de l'utilisateur en cours

	const { mutateAsync: follow } = useMutation({
		mutationFn: async (userId) => {
			try {
				setLoadingUser(userId); // Définir l'utilisateur en cours de suivi
				const res = await fetchWithAuth(`/api/users/follow/${userId}`, {
					method: "POST",
					credentials: "include"
				});

				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong!");
				}
			} catch (error) {
				throw new Error(error.message);
			} finally {
				setLoadingUser(null); // Réinitialiser après la requête
			}
		},
		onSuccess: () => {
			Promise.all([
				queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] }),
				queryClient.invalidateQueries({ queryKey: ["authUser"] }),
			]);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	return { follow, loadingUser };
};

export default useFollow;
