import jwt from "jsonwebtoken";

// This middleware checks if the user is logged in
// It reads the token from the Authorization header
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "No token provided" });
  }

  // The header looks like "Bearer <token>"
  const token = header.split(" ")[1];

  try {
    // Verify the token and attach the user info to req
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "nagarpalika_secret_key");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// This middleware checks if the user has the correct role
// Example: roleMiddleware("admin") only allows admins
export function roleMiddleware(role) {
  return function (req, res, next) {
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}
