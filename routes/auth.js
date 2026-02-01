const generateRefreshToken = () => {
    // Refresh Token is just a unique ID, long-lived
    return uuidv4(); // Use UUID for unique, non-guessable refresh tokens
};