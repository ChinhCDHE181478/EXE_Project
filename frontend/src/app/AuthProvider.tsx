"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { getSession, UserSession } from "@/lib/actions/getSession";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserSession | null;
  logout: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  login: (data: any) => Promise<void>;
}

interface IAuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider: React.FC<IAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserSession | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check auth status using getSession (handles refresh and extraction)
  const checkAuthStatus = useCallback(async () => {
    // We can just call getSession to get the current state
    // This server action verifies token/refresh token and returns user if valid
    const session = await getSession();

    if (session) {
      setIsAuthenticated(true);
      // Update user only if it changed or wasn't set (basic deep check optional, here simply set)
      if (!user || user.email !== session.email) {
        setUser(session);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [user]);

  // Initial mount: check auth and fetch user
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const session = await getSession();

      if (session) {
        setIsAuthenticated(true);
        setUser(session);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // On pathname change: re-verify auth
  useEffect(() => {
    checkAuthStatus();
  }, [pathname, checkAuthStatus]);

  // Listen for logout events
  useEffect(() => {
    const handleLogout = () => {
      setIsAuthenticated(false);
      setUser(null);
    };

    window.addEventListener("logout", handleLogout);
    return () => {
      window.removeEventListener("logout", handleLogout);
    };
  }, []);

  // login: chỉ cần set state, logic gọi API đã nằm ở page Login
  const login = async (data: any) => {
    // Page Login đã xử lý xong và gọi router.push
    // Ở đây ta chỉ cần update state nếu cần (dù Page Login navigate sẽ trigger mount lại hoặc event)
    setIsAuthenticated(true);
    // Optionally fetch user data immediately after login if data (UserSession) not provided
    // but usually next navigation triggers initAuth again or we can set it here if we have it
    const session = await getSession();
    if (session) setUser(session);
  };

  // logout: gọi API logout và dispatch event
  const logout = async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch (e) {
      console.error("Logout error:", e);
    }

    setIsAuthenticated(false);
    setUser(null);
    window.dispatchEvent(new Event("logout"));
    window.location.href = "/";
  };

  const value = { isAuthenticated, isLoading, user, logout, login };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
