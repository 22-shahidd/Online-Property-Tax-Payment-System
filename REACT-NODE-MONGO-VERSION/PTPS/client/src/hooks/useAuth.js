import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

// Custom hook - any component can call useAuth() to get the current user
export function useAuth() {
  return useContext(AuthContext);
}
