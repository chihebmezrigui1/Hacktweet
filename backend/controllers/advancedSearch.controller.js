import Post from "../models/Post.js";


export const searchByKeyword = async (req, res) => {
    try {
        const { keyword } = req.query;

        // Vérifier si le mot-clé est fourni
        if (!keyword) {
            return res.status(400).json({ error: "Keyword parameter is required" });
        }

        // Rechercher les posts contenant le mot-clé dans le texte
        const posts = await Post.find({
            text: { $regex: keyword, $options: 'i' } // Recherche insensible à la casse
        })
        .populate({
            path: "user",
            select: "-password",
        })
        .populate({
            path: "comments.user",
            select: "-password",
        });

        // Retourner les résultats
        res.status(200).json({ posts });
    } catch (error) {
        console.log("Error in searchByKeyword controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const advancedSearch = async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            sortBy = "createdAt", 
            sortOrder = -1 
        } = req.query;

        let postQuery = {};

        // Filtrage par plage de dates
        if (startDate || endDate) {
            postQuery.createdAt = {};
            if (startDate) postQuery.createdAt.$gte = new Date(startDate);
            if (endDate) postQuery.createdAt.$lte = new Date(endDate);
        }

        // Vérification que sortBy et sortOrder sont valides
        const validSortBy = ["createdAt", "updatedAt"]; // Ajoutez d'autres champs valides si nécessaire
        if (!validSortBy.includes(sortBy)) {
            return res.status(400).json({ error: "Invalid sortBy field" });
        }

        // Vérifier que sortOrder est un nombre valide (-1 ou 1)
        if (![1, -1].includes(Number(sortOrder))) {
            return res.status(400).json({ error: "Invalid sortOrder value" });
        }

        // Affichage des paramètres pour déboguer
        console.log(`Sorting by: ${sortBy}, Order: ${sortOrder}`);

        // Recherche des posts avec critères (uniquement filtrage par date)
        let posts = await Post.find(postQuery)
            .sort({ [sortBy]: Number(sortOrder) })  // Assurez-vous que sortOrder est un nombre
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });

        // Retour des résultats
        res.status(200).json({
            posts
        });
    } catch (error) {
        console.log("Error in advancedSearch controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};




// Helper function to find trending hashtags related to search
const findTrendingHashtags = async () => {
    try {
        // Get recent posts with hashtags
        const recentPosts = await Post.find({ 
            text: { $regex: '#', $options: 'i' } 
        }).sort({ createdAt: -1 }).limit(100);
        
        // Extract all hashtags
        const allHashtags = [];
        const hashtagRegex = /#[\p{L}0-9_]+/gu;
        
        recentPosts.forEach(post => {
            if (post.text) {
                const matches = post.text.match(hashtagRegex);
                if (matches) {
                    allHashtags.push(...matches);
                }
            }
        });
        
        // Count occurrences
        const hashtagCount = {};
        allHashtags.forEach(tag => {
            hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
        });
        
        // Sort by count
        const sortedHashtags = Object.entries(hashtagCount)
            .sort((a, b) => b[1] - a[1])
            .map(entry => ({ hashtag: entry[0], count: entry[1] }))
            .slice(0, 10);
        
        return sortedHashtags;
    } catch (error) {
        console.log("Error finding trending hashtags: ", error);
        return [];
    }
};


export const getPopularHashtags = async (req, res) => {
    try {
        const trendingHashtags = await findTrendingHashtags();
        res.status(200).json(trendingHashtags);
    } catch (error) {
        console.log("Error in getPopularHashtags controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};




// Search specifically for hashtags
export const searchHashtags = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: "Query parameter is required" });
        }
        
        // Get recent posts with hashtags
        const recentPosts = await Post.find({ 
            text: { $regex: '#', $options: 'i' } 
        }).sort({ createdAt: -1 }).limit(200);
        
        // Extract all hashtags
        const allHashtags = [];
        const hashtagRegex = /#[\p{L}0-9_]+/gu;
        
        recentPosts.forEach(post => {
            if (post.text) {
                const matches = post.text.match(hashtagRegex);
                if (matches) {
                    allHashtags.push(...matches);
                }
            }
        });
        
        // Get unique hashtags
        const uniqueHashtags = [...new Set(allHashtags)];
        
        // Filter hashtags that match the query
        const matchingHashtags = uniqueHashtags.filter(
            tag => tag.toLowerCase().includes(query.toLowerCase())
        );
        
        // Get count for each matching hashtag
        const hashtagsWithCount = matchingHashtags.map(tag => {
            const count = allHashtags.filter(t => t === tag).length;
            return { hashtag: tag, count };
        });
        
        // Sort by count
        const sortedHashtags = hashtagsWithCount.sort((a, b) => b.count - a.count);
        
        res.status(200).json(sortedHashtags);
    } catch (error) {
        console.log("Error in searchHashtags controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};