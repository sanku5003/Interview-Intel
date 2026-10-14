import { useContext, useEffect } from "react";
import { AuthContext } from "../Auth.context";
import { login, register, logout, getMe } from "../Services/Auth.api";

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { user, setUser, loading, setLoading } = context;

  // const handleLogin = async ({ email, password }) => {
  //   setLoading(true);
  //   try {
  //     const data = await login({ email, password });
  //     setUser(data.user);
  //     setLoading(false);
  //   } catch (err) {
  //     console.log(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleLogin = async ({ email, password }) => {
    setLoading(true);

    try {
      const data = await login({ email, password });

      if (data?.user) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, message: "Login failed" };
    } catch (err) {
      console.log(err);
      const message = err.response?.data?.message || err.message || "Invalid email or password";
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ email, username, contact, password }) => {
    setLoading(true);

    try {
      const data = await register({ email, username, contact, password });

      if (data?.newUser) {
        setUser(data.newUser);
        return { success: true };
      }

      return { success: false, message: data?.message || "Registration failed" };
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || err.message || "Registration failed";
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const data = await logout();
    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    const getAndSetUser = async () => {
      try {
        const data = await getMe();

        console.log("getMe response:", data);
        if (data) {
          setUser(data.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getAndSetUser();
  }, []);

  return { user, loading, handleRegister, handleLogin, handleLogout };
};
