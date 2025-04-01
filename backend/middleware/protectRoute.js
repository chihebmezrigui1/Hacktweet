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
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Essayer d'obtenir le token depuis les cookies d'abord
    let token = req.cookies.jwt;
    
    // Si aucun token dans les cookies, vérifier les headers d'autorisation
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Si toujours pas de token, renvoyer une erreur d'autorisation
    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No Token Provided" });
    }

    // Vérification de la validité du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Si le token est invalide ou ne peut pas être décodé
    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }

    // Vérification si l'utilisateur associé au token existe dans la base de données
    const user = await User.findById(decoded.userId);

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
    
    // Si une erreur est capturée, renvoyer une erreur 401 pour accès non autorisé
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Unauthorized - Invalid or Expired Token" });
    } else {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
