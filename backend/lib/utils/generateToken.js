import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
	  expiresIn: "15d",
	});
  
	res.cookie("jwt", token, {
	  httpOnly: true, // inaccessible to client-side JS
	  maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
	  sameSite: "strict", // protection against CSRF
	  // secure: process.env.NODE_ENV === "production", // only send over HTTPS in production
	});
  
	return token;
  };
