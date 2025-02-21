export async function isTokenExpired(token) {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decodifica el payload del token
      const expirationTime = payload.exp * 1000; // Convierte a milisegundos
      return Date.now() > expirationTime; // Verifica si ha expirado
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return true; // Si hay un error, considera el token como expirado
    }
  };