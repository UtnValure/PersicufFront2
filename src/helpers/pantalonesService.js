import axios from "axios";
import {getHeaders} from "./headerService"

// GET
export async function getPantalones() {
    try {
        const response = await axios.get("https://persicuf.up.railway.app/api/Pantalon/obtenerPantalones");
        return response.data; 
    } catch (error) {
        console.error(error.response);
        throw new Error(error.response?.data?.mensaje || "Error al obtener los pantalones");
    }
}

// buscar
export async function buscarPantalones(busqueda) {
    try {
        const response = await axios.get(`https://persicuf.up.railway.app/api/Pantalon/buscarPantalones?busqueda=${busqueda}`);
        return response.data; 
    } catch (error) {
        console.error(error.response);
        throw new Error(error.response?.data?.mensaje || "Error al realizar la busqueda");
    }
}

// POST
export async function createPantalon(nuevoPantalon) {
    try {
        const response = await axios.post("https://persicuf.up.railway.app/api/Pantalon/crearPantalon", nuevoPantalon, {
            headers: getHeaders(),
        });

        return response;
    } catch (error) {
        console.log("Este es el error: ", error.response.data.mensaje)
        throw new Error(error.response.data.mensaje);
    }
};

//DELETE
export async function deletePantalon(PantalonId) {
    try {
        const response = await axios.delete(`https://persicuf.up.railway.app/api/Pantalon/eliminarPantalon?ID=${PantalonId}`, {
            headers: getHeaders(),
        });

        return response;
    } catch (error) {
        throw new Error(error.response.data.mensaje);
    }
}

export async function getPantalonPorID(ID) {
    try {
        const response = await getPantalones();
        console.log('Datos de pantalones:', response.datos);
        const pantalones = response.datos;
        const pantalon = pantalones.find(t => t.id === Number(ID));
        if (pantalon) {
            return pantalon;
        } else {
            throw new Error(`No se encontró el pantalon con el ID: ${ID}`);
        }
    } catch (error) {
        console.error("Error al obtener el pantalon:", error.message);
        throw error;
    }
}

export async function getPantalonPorIDUsuario(ID) {
    try {
        const response = await getPantalones();
        console.log('Datos de pantalones:', response.datos);
        const pantalones = response.datos;
        const pantalon = pantalones.filter(t => t.usuarioID === Number(ID));
        if (pantalon) {
            return pantalon;
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error al obtener el pantalon:", error.message);
        throw error;
    }
}