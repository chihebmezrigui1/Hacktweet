import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const signup = async (req, res) => {
	try {
	  console.log("Signup request received:", req.body);
	  const { fullName, username, email, password } = req.body;
  
	  // Validation checks...
	  
	  console.log("Creating new user");
	  const salt = await bcrypt.genSalt(10);
	  const hashedPassword = await bcrypt.hash(password, salt);
  
	  const newUser = new User({
		fullName,
		username,
		email,
		password: hashedPassword,
	  });
  
	  console.log("Saving user to database");
	  const savedUser = await newUser.save();
	  console.log("User saved with ID:", savedUser._id);
	  
	  console.log("Generating token");
	  const token = generateTokenAndSetCookie(savedUser._id, res);
	  console.log("Token generated:", token ? "Success" : "Failed");
  
	  console.log("Sending response");
	  return res.status(201).json({
		_id: savedUser._id,
		fullName: savedUser.fullName,
		username: savedUser.username,
		email: savedUser.email,
		followers: savedUser.followers,
		following: savedUser.following,
		profileImg: savedUser.profileImg,
		coverImg: savedUser.coverImg,
	  });
	} catch (error) {
	  console.error("Error in signup controller:", error);
	  return res.status(500).json({ 
		error: "Internal Server Error", 
		details: error.message 
	  });
	}
  };
  export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if (!user || !isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



export const logout = async (req, res) => {
	try {
		res.cookie("jwt", "", { 
			expires: new Date(0),
			maxAge: 0, 
			httpOnly: true,  // Assure-toi que ce cookie ne peut pas être accessible depuis le JavaScript côté client
			secure: process.env.NODE_ENV === 'production', // `secure: true` uniquement en production
			sameSite: 'Strict' // ou 'Lax' selon les besoins
		  });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
export const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		res.status(200).json(user);
	} catch (error) {
		console.log("Error in getMe controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
