import axios from "axios";
import {getHeaders} from "./headerService"

// GET
export async function getZapatos() {
    try {
        const response = await axios.get("https://persicuf.up.railway.app/api/Zapato/obtenerZapatos");
        return response.data; // Devuelve solo el cuerpo de la respuesta
    } catch (error) {
        console.error(error.response);
        throw new Error(error.response?.data?.mensaje || "Error al obtener los zapatos");
    }
}

// buscar
export async function buscarZapatos(busqueda) {
    try {
        const response = await axios.get(`https://persicuf.up.railway.app/api/Zapato/buscarZapatos?busqueda=${busqueda}`);
        return response.data; 
    } catch (error) {
        console.error(error.response);
        throw new Error(error.response?.data?.mensaje || "Error al realizar la busqueda");
    }
}

// POST
export async function createZapato(nuevoZapato) {
    try {
        const response = await axios.post("https://persicuf.up.railway.app/api/Zapato/crearZapato", nuevoZapato, {
            headers: getHeaders(),
        });

        return response;
    } catch (error) {
        console.log("Este es el error: ", error.response.data.mensaje)
        throw new Error(error.response.data.mensaje);
    }
};

//DELETE
export async function deleteZapato(ZapatoId) {
    try {
        const response = await axios.delete(`https://persicuf.up.railway.app/api/Zapato/eliminarZapato?ID=${ZapatoId}`, {
            headers: getHeaders(),
        });

        return response;
    } catch (error) {
        throw new Error(error.response.data.mensaje);
    }
}

export async function getZapatoPorID(ID) {
    try {
        const response = await getZapatos();
        console.log('Datos de Zapatos:', response.datos);
        const Zapatos = response.datos;
        const Zapato = Zapatos.find(t => t.id === Number(ID));
        if (Zapato) {
            return Zapato;
        } else {
            throw new Error(`No se encontró el Zapato con el ID: ${ID}`);
        }
    } catch (error) {
        console.error("Error al obtener el Zapato:", error.message);
        throw error;
    }
}

export async function getZapatoPorIDUsuario(ID) {
    try {
        const response = await getZapatos();
        console.log('Datos de Zapatos:', response.datos);
        const Zapatos = response.datos;
        const Zapato = Zapatos.filter(t => t.usuarioID === Number(ID));
        if (Zapato) {
            return Zapato;
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error al obtener el Zapato:", error.message);
        throw error;
    }
}