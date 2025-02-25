export async function isTokenExpired(token) {
  if (!token) return true;

  try {
      const parts = token.split('.');
      if (parts.length !== 3) {
          throw new Error("El token no tiene el formato correcto");
      }

      // Decodifica el payload del token
      const payload = JSON.parse(atob(parts[1]));

      // Verifica si el payload tiene un campo 'exp'
      if (!payload.exp) {
          throw new Error("El token no tiene un campo de expiración (exp)");
      }

      // Convierte el tiempo de expiración a milisegundos
      const expirationTime = payload.exp * 1000;

      // Verifica si ha expirado
      return Date.now() > expirationTime;
  } catch (error) {
      console.error("Error al decodificar el token:", error);
      return true; // Si hay un error, considera el token como expirado
  }
};
