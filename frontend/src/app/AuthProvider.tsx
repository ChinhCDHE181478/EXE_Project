"use client";
import { getRefreshToken } from "@/lib/actions/getRefreshToken";
import { storeToken } from "@/lib/actions/storeToken";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
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
  const router = useRouter();

  const checkAuthStatus = useCallback(async () => {
    const { refreshToken } = await getRefreshToken();
    if (refreshToken === undefined) {
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
  }, [setIsAuthenticated]);

  useEffect(() => {
    setIsLoading(true);
    checkAuthStatus().then(() => setIsLoading(false));
  }, [checkAuthStatus]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const login = async (data: any) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}` + "/auth/login",
        {
          username: data.username,
          password: data.password,
          rememberMe: data.rememberMe,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      await storeToken(response.data, data.rememberMe);
      setIsAuthenticated(true);
      return response.data;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const logout = async () => {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-cache",
    });
    if (!res.ok) {
      setIsAuthenticated(false);
      router.push("/");
    }
    setIsAuthenticated(false);
    router.replace("/");
  };

  const value = { isAuthenticated, isLoading, logout, login };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
