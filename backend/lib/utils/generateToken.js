import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
	  expiresIn: "15d",
	});
  
	res.cookie("jwt", token, {
	  httpOnly: true, // inaccessible to client-side JS
	  maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
	  sameSite: "none", // Changez "strict" à "none" pour autoriser les cookies cross-domain
	  secure: true, // Doit être true quand sameSite est "none"
	  path: "/" // Assurez-vous que le cookie est disponible sur tous les chemins
	});
  
	return token;
  };