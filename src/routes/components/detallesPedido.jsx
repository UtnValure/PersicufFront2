import { useLocation } from 'react-router-dom';
import { useState, useEffect, useContext } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import Alert from 'react-bootstrap/Alert';
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { getDomicilioIDUsuario, createDomicilio, deleteDomicilio } from "../../helpers/domicilioService";
import { createPedido, getUltimoPedidoUsuario, putPedido } from '../../helpers/pedidosService';
import { createPedidoPrenda } from '../../helpers/pedidoprendaService';
// import { createEnvio } from '../../helpers/envioAPI';
import { getDomicilioPorID } from '../../helpers/domicilioService';
import Cargando from './Cargando';
import '../../styles/detallesPedido.css'

const DetallesPedido = () => {
  const { userId } = useContext(AuthContext);
  const [domicilios, setDomicilios] = useState([]);
  const [selectedDomicilios, setSelectedDomicilios] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [nuevoDomicilio, setNuevoDomicilio] = useState({
    calle: "",
    numero: "",
    piso: "",
    depto: "",
    descripcion: "",
    userId,
    localidadID: 1,
  });
  const [tarjeta, setTarjeta] = useState({
    nombre: '',
    numero: '',
    expiracion: '',
    cvv: ''
  });
  const [tarjetaGuardada, setTarjetaGuardada] = useState(null);
  const [mostrarFormTarjeta, setMostrarFormTarjeta] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("success");

  const location = useLocation();
  const { prenda, cantidad, total, imagenDirrecion } = location.state || {};

  const mostrarAlerta = (message, variant) => {
    setAlertMessage(message);
    setAlertVariant(variant);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const { authorization } = useContext(AuthContext); // Obtén el token del contexto
  const navigate = useNavigate(); // Usa useNavigate para redirigir

  // Verifica el token cada vez que el componente se monta o se actualiza
  useEffect(() => {
    if (isTokenExpired(authorization)) {
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      localStorage.removeItem("user");
      localStorage.removeItem("authorization");
      navigate('/login'); // Redirige al usuario a la pantalla de inicio de sesión
    }
  }, [authorization, navigate]);

  useEffect(() => {
    if (!userId) return;

    const fetchDomicilios = async () => {
      try {
        setCargando(true);
        const userDomicilios = await getDomicilioIDUsuario(userId);
        setDomicilios(Array.isArray(userDomicilios) ? userDomicilios : [userDomicilios]);
      } catch (error) {
        console.error("Error al obtener domicilios: ", error);
      } finally {
        setCargando(false);
      }
    };

    fetchDomicilios();
  }, [userId, nuevoDomicilio]);

  const addNuevoDomicilio = async () => {
    if (!userId) {
      mostrarAlerta("Error: No se encontró el usuario.", "danger");
      return;
    }

    const domicilioData = {
      calle: nuevoDomicilio.calle,
      numero: nuevoDomicilio.numero,
      piso: nuevoDomicilio.piso || 0,
      depto: nuevoDomicilio.depto || "",
      descripcion: nuevoDomicilio.descripcion || "",
      usuarioID: userId,
      localidadID: 1
    };

    try {
      const response = await createDomicilio(domicilioData);
      setDomicilios([...domicilios, response]);
      setNuevoDomicilio({ calle: "", numero: "", piso: "", depto: "", descripcion: "", userId, localidadID: "" });
      setShowForm(false);
      mostrarAlerta("Domicilio creado exitosamente!", "success");
    } catch (error) {
      console.error("Error al crear domicilio: ", error);
      mostrarAlerta("Hubo un problema al crear el domicilio.", "danger");
    }
  };

  const removerDomicilio = async (id) => {
    try {
      await deleteDomicilio(id);
      setDomicilios(domicilios.filter((domicilio) => domicilio.id !== id));
      if (selectedDomicilios === id) {
        setSelectedDomicilios(null);
      }
      mostrarAlerta("Domicilio eliminado exitosamente!", "success");
    } catch (error) {
      console.error("Error al eliminar domicilio: ", error);
      mostrarAlerta("Hubo un problema al eliminar el domicilio.", "danger");
    }
  };

  const handleCreatePedido = async () => {
    if (!selectedDomicilios) {
      mostrarAlerta("Selecciona un domicilio para el pedido.", "danger");
      return;
    }

    if (!tarjetaGuardada) {
      mostrarAlerta("Debes guardar los datos de la tarjeta antes de crear el pedido.", "danger");
      return;
    }

    let pedidoData = {
      precioTotal: total,
      domicilioID: selectedDomicilios,
      usuarioID: userId,
    };

    try {
      await createPedido(pedidoData);
      mostrarAlerta("Pedido creado exitosamente!", "success");

      const pedidoID = await getUltimoPedidoUsuario(userId);

      const pedidoPrendaData = {
        cantidad: cantidad,
        prendaID: prenda.datos.id,
        pedidoID: pedidoID,
      };

      // await createPedidoPrenda(pedidoPrendaData);
      // const origen = {
      //   calle: "52",
      //   numero: 777,
      //   piso: null,
      //   depto: null,
      //   descripcion: "Fabrica Persicuf",
      //   localidadID: 5,
      // };

      // let destino = await getDomicilioPorID(selectedDomicilios);
      // const envioData = {
      //   descripcion: "Envío de prenda Persicuf Nro: " + pedidoID,
      //   hora: "17:30",
      //   pesoGramos: (cantidad * 130) + 100,
      //   reserva: true,
      //   origen,
      //   destino,
      //   cliente: "850cdde8-591e-413d-8e67-48c649a8650f",
      // };

      let nroSeguimiento = 0;

      pedidoData = {
        precioTotal: total,
        domicilioID: selectedDomicilios,
        usuarioID: userId,
        nroSeguimiento,
      };

      await putPedido(pedidoID, pedidoData);
      navigate('/mis-pedidos');
    } catch (error) {
      console.error("Error al crear pedido: ", error);
      mostrarAlerta("Hubo un problema al crear el pedido.", "danger");
    }
  };

  const guardarTarjeta = () => {
    if (!tarjeta.nombre || !tarjeta.numero || !tarjeta.expiracion || !tarjeta.cvv) {
      mostrarAlerta("Todos los campos de la tarjeta son obligatorios.", "danger");
      return;
    }

    if (tarjeta.numero.length !== 16) {
      mostrarAlerta("El número de tarjeta debe tener 16 dígitos.", "danger");
      return;
    }

    if (tarjeta.cvv.length !== 3) {
      mostrarAlerta("El CVV debe tener 3 dígitos.", "danger");
      return;
    }

    setTarjetaGuardada(tarjeta);
    setMostrarFormTarjeta(false);
    mostrarAlerta("Tarjeta guardada exitosamente!", "success");
  };

  const eliminarTarjeta = () => {
    setTarjetaGuardada(null);
    setMostrarFormTarjeta(true);
    setTarjeta({ nombre: '', numero: '', expiracion: '', cvv: '' });
    mostrarAlerta("Tarjeta eliminada exitosamente!", "success");
  };

  if (cargando) return <Cargando />;

  return (
    <div className="container mt-4">
      {showAlert && (
        <Alert variant={alertVariant} onClose={() => setShowAlert(false)} dismissible>
          {alertMessage}
        </Alert>
      )}

      <h2 className="mb-3 text-center">Detalles de tu Pedido</h2>
      <div className="row">
        <div className="col-md-6 mx-auto">
          <img src={imagenDirrecion} alt="Prenda" className="img-fluid rounded" />
          <p className="mt-3"><strong>Prenda:</strong> {prenda?.datos?.nombre}</p>
          <p><strong>Cantidad:</strong> {cantidad}</p>
          <p><strong>Precio total:</strong> ${total}</p>
        </div>
      </div>

      <h2 className="mb-3 mt-4 text-center">Selecciona el domicilio</h2>
      <div className="row">
        <div className="col-md-8 mx-auto">
          {domicilios.length > 0 && (
            <ul className="list-group">
              {domicilios.map((domicilio, index) => (
                <li
                  key={domicilio.id || index}
                  className={`list-group-item d-flex justify-content-between align-items-center ${selectedDomicilios === domicilio.id ? "active" : ""}`}
                  onClick={() => setSelectedDomicilios(domicilio.id)}
                  style={{ cursor: "pointer" }}
                >
                  <span>{`Calle ${domicilio.calle} ${domicilio.numero}`}</span>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removerDomicilio(domicilio.id);
                    }}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button className="btn btn-primary mt-3 w-100" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "Agregar Domicilio"}
          </button>

          {showForm && (
            <div className="mt-3 border p-3 rounded">
              <h5>Nuevo Domicilio</h5>
              <input
                type="text"
                className="form-control mt-2"
                placeholder="Calle"
                value={nuevoDomicilio.calle}
                onChange={(e) => setNuevoDomicilio({ ...nuevoDomicilio, calle: e.target.value })}
              />
              <input
                type="number"
                className="form-control mt-2"
                placeholder="Número"
                value={nuevoDomicilio.numero}
                onChange={(e) => setNuevoDomicilio({ ...nuevoDomicilio, numero: e.target.value })}
              />
              <input
                type="text"
                className="form-control mt-2"
                placeholder="Piso"
                value={nuevoDomicilio.piso}
                onChange={(e) => setNuevoDomicilio({ ...nuevoDomicilio, piso: e.target.value })}
              />
              <input
                type="text"
                className="form-control mt-2"
                placeholder="Departamento"
                value={nuevoDomicilio.depto}
                onChange={(e) => setNuevoDomicilio({ ...nuevoDomicilio, depto: e.target.value })}
              />
              <input
                type="text"
                className="form-control mt-2"
                placeholder="Descripción"
                value={nuevoDomicilio.descripcion}
                onChange={(e) => setNuevoDomicilio({ ...nuevoDomicilio, descripcion: e.target.value })}
              />
              <button className="btn btn-success mt-2 w-100" onClick={addNuevoDomicilio}>
                Guardar Domicilio
              </button>
            </div>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-4 text-center">Método de Pago</h2>
      <div className="row">
        <div className="col-md-8 mx-auto">
          {mostrarFormTarjeta && (
            <div className="mt-3 border p-3 rounded">
              <h5>Datos de Tarjeta</h5>
              <input
                type="text"
                className="form-control mt-2"
                placeholder="Nombre en la tarjeta"
                value={tarjeta.nombre}
                onChange={(e) => setTarjeta({ ...tarjeta, nombre: e.target.value })}
              />
              <input
                type="text"
                className="form-control mt-2"
                placeholder="Número de tarjeta"
                value={tarjeta.numero}
                maxLength="16"
                onChange={(e) => setTarjeta({ ...tarjeta, numero: e.target.value.replace(/\D/g, '') })}
              />
              <input
                type="text"
                className="form-control mt-2"
                placeholder="Fecha de expiración (MM/YY)"
                value={tarjeta.expiracion}
                maxLength="5"
                onChange={(e) => setTarjeta({ ...tarjeta, expiracion: e.target.value })}
              />
              <input
                type="text"
                className="form-control mt-2"
                placeholder="CVV"
                value={tarjeta.cvv}
                maxLength="3"
                onChange={(e) => setTarjeta({ ...tarjeta, cvv: e.target.value.replace(/\D/g, '') })}
              />
              <button className="btn btn-success mt-2 w-100" onClick={guardarTarjeta}>
                Guardar Tarjeta
              </button>
            </div>
          )}

          {tarjetaGuardada && (
            <div className="mt-3 border p-3 rounded">
              <h5>Tarjeta Guardada</h5>
              <p><strong>Nombre:</strong> {tarjetaGuardada.nombre}</p>
              <p><strong>Número:</strong> **** **** **** {tarjetaGuardada.numero.slice(-4)}</p>
              <p><strong>Expiración:</strong> {tarjetaGuardada.expiracion}</p>
              <button className="btn btn-danger mt-2 w-100" onClick={eliminarTarjeta}>
                Eliminar Tarjeta
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-md-8 mx-auto">
          <button className="btn btn-success mt-4 w-100" onClick={handleCreatePedido}>
            Crear Pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetallesPedido;