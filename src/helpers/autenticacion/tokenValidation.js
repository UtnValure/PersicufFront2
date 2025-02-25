export async function isTokenExpired(token) {
  try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);

      if (!payload.exp) {
          console.error("El token no tiene un campo 'exp'.");
          return true;
      }

      const now = Math.floor(Date.now() / 1000);
      let isValido = now >= payload.exp;
      console.log("Tiempo actual:", now);
      console.log("Expiración del token:", payload.exp);
      console.log("¿Está vencido?", isValido); // Nueva línea de depuración

      return isValido;
  } catch (error) {
      console.error("Error al decodificar el JWT:", error);
      return true;
  }
}