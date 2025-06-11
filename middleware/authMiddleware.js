const { auth } = require('../config/firebase');

exports.authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token) {
        return res.status(401).json({error: 'Token was not authorized'});
    }
    
    try {
    const decodedToken = await auth.verifyIdToken(token); 
    req.user = decodedToken;
    } catch(err) {
        console.error('Token was invalid or has expired! Error: ', err);
        let errorMessage = 'Token has expired or was invalid';
        return res.status(403).json({error: errorMessage});     
    }
    
    next();
} 