
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentAccount,
  loginAccount,
  logoutAccount,
  registerAccount,
} from "../../services/auth.service.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem("smartserve_token")) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentAccount();
      setUser(currentUser);
    } catch {
      logoutAccount();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials) => {
    const result = await loginAccount(credentials);
    setUser(result.user);
    return result.user;
  };

  const register = async (details) => {
    const result = await registerAccount(details);
    setUser(result.user);
    return result.user;
  };

  const logout = () => {
    logoutAccount();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}