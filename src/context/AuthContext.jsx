import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isTokenExpired } from '../utils/auth'; // Importa la función isTokenExpired

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [auth, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Verifica si el token ha expirado cada vez que el componente se monta o cuando el token cambia
  useEffect(() => {
    const storedAuthorization = localStorage.getItem("authorization");

    if (storedAuthorization) {
      const checkToken = async () => {
        const expired = await isTokenExpired(storedAuthorization);
        if (expired) {
          console.log("Token expirado, cerrando sesión...");
          setAuthenticated(null); // Limpia el estado de autenticación
          setUser(null);
          setUserId(null);
          setRole(null);
          localStorage.removeItem("authorization"); // Elimina el token del localStorage
          localStorage.removeItem("user");
          localStorage.removeItem("userId");
          localStorage.removeItem("userRole");
          navigate('/login'); // Redirige al usuario a la pantalla de inicio de sesión
        } else {
          setAuthenticated(storedAuthorization); // Actualiza el estado con el token válido
        }
      };

      checkToken();
    }
    setLoading(false);
  }, [navigate]);

  const iniciarSesion = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const userInfo = await login(userData);

      localStorage.setItem("user", JSON.stringify(userInfo.userData));
      localStorage.setItem("userId", userInfo.userData.id);
      localStorage.setItem("userRole", userInfo.userData.rol);
      localStorage.setItem("authorization", userInfo.userData.token);

      setUser(userInfo.userData);
      setUserId(parseInt(userInfo.userData.id));
      setRole(userInfo.userData.rol);
      setAuthenticated(userInfo.userData.token); // Actualiza el estado auth
      return true;
    } catch (error) {
      console.error('Error en el login:', error);
      setError('Usuario o contraseña incorrectos');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cerrarSesion = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
      setUserId(null);
      setRole(null);
      setAuthenticated(null); // Limpia el estado auth
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      localStorage.removeItem("user");
      localStorage.removeItem("authorization");
    } catch (error) {
      console.error('Error en el logout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userId, role, auth, loading, iniciarSesion, cerrarSesion, error }}>
      {children}
    </AuthContext.Provider>
  );
};