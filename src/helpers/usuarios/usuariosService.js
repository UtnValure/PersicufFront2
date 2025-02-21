import axios from "axios";
import {getHeaders} from "../headerService"

// GET ID

export function getUsuarioID() {
    const fetchUsuarioID = async () => {
        try {
          const response = await getUsuarios(); 
          const usuario = response.data; 
          return usuario.id;
        } catch (error) {
          console.error("Error al obtener el usuario:", error.message);
          throw error;
        }
      };      
  }


// GET
export async function getUsuarios() {
    try {
        const response = await axios.get("https://persicuf.up.railway.app/api/Usuario/obtenerUsuarios");
        return response;
    } catch (error) {
        console.log(error.response);
        throw new Error(error.response.data.mensaje);
    }
}

// GETNOMBREUSUARIO
export async function buscarUsuario(usuarioId) {
    try {
        const response = await axios.get(`https://persicuf.up.railway.app/api/Usuario/BuscarUsuario?ID=${usuarioId}`);
        return response;
    } catch (error) {
        console.log(error.response);
        throw new Error(error.response.data.mensaje);
    }
}

// POST
export async function createUsuario(nuevoUsuario) {
    try {
        const response = await axios.post("https://persicuf.up.railway.app/api/Usuario/crearUsuario", nuevoUsuario, {
            headers: getHeaders(),
        });

        return response;
    } catch (error) {
        console.log("Este es el error: ", error.response.data.mensaje)
        throw new Error(error.response.data.mensaje);
    }
};

//DELETE
export async function deleteUsuario(usuarioId) {
    try {
        const response = await axios.delete(`https://persicuf.up.railway.app/api/Usuario/eliminarUsuario?ID=${usuarioId}`, {
            headers: getHeaders(),
        });

        return response;
    } catch (error) {
        throw new Error(error.response.data.mensaje);
    }
}

//EDIT
export async function updateUsuario(usuarioId, permisoID) {
    try {
        // Enviar usuarioId y permisoID como parámetros de consulta
        const response = await axios.patch(`https://persicuf.up.railway.app/api/Usuario/modificarPermisoUsuario?ID=${usuarioId}&permisoID=${permisoID}`, {
            headers: getHeaders(),
        });

        return response;
    } catch (error) {
        console.log("Error en el service", error.response);
        throw new Error(error.response.data.mensaje);
    }
}
