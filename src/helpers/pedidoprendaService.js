import axios from "axios";
import {getHeaders} from "./headerService"

// GET
export async function getPedidosPrenda() {
    try {
        const response = await axios.get("https://persicufback-production.up.railway.app/api/PedidoPrenda/obtenerPedidosPrenda", {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error(error.response);
        throw new Error(error.response?.data?.mensaje || "Error al obtener los pedidos");
    }
}

// POST
export async function createPedidoPrenda(nuevoPedidoPrenda) {
    try {
        const response = await axios.post("https://persicufback-production.up.railway.app/api/PedidoPrenda/crearPedidoPrenda", nuevoPedidoPrenda, {
            headers: getHeaders(),
        });

        return response;
    } catch (error) {
        console.log("Este es el error: ", error.response.data.mensaje)
        throw new Error(error.response.data.mensaje);
    }
};

//DELETE
export async function deletePedidoPrenda(PedidoId) {
    try {
        const response = await axios.delete(`https://persicufback-production.up.railway.app/api/PedidoPrenda/eliminarPedidoPrenda?ID=${PedidoId}`, {
            headers: getHeaders(),
        });

        return response;
    } catch (error) {
        throw new Error(error.response.data.mensaje);
    }
}