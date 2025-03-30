// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// export const protectRoute = async (req, res, next) => {
//   try {
//     const token = req.cookies.jwt; 
    
//     if (!token) {
//       return res.status(401).json({ error: "Unauthorized - No Token Provided" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     if (!decoded) {
//       return res.status(401).json({ error: "Unauthorized - Invalid Token" });
//     }

//     const user = await User.findById(decoded.userId);
    
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     console.log("Error in protectRoute middleware:", error.message);
//     res.status(401).json({ error: "Unauthorized - Invalid Token" });
//   }
// };
export const protectRoute = async (req, res, next) => {
  try {
    // Vérification de la présence du token dans les cookies
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No Token Provided" });
    }

    // Vérification de la validité du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Si le token est valide, nous extrayons le userId
    const userId = decoded.userId;

    // Vérification si l'utilisateur associé au token existe dans la base de données
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Attacher l'utilisateur à la requête
    req.user = user;

    // Passer à la suite de la requête
    next();

  } catch (error) {
    // Si une erreur survient, afficher le message d'erreur
    console.error("Error in protectRoute middleware:", error.message);

    // Si une erreur est liée au token, renvoyer une erreur 401 pour accès non autorisé
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Unauthorized - Invalid or Expired Token" });
    }

    // Pour toutes autres erreurs, envoyer une erreur 500
    return res.status(500).json({ error: "Internal Server Error" });
  }
};