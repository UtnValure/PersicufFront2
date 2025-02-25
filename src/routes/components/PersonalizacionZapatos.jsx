import React, { useState, useEffect, useContext, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Alert from 'react-bootstrap/Alert';
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { isTokenExpired } from '../../helpers/autenticacion/tokenValidation';
import ProductViewer from './persozapato/ProductViewer';
import ColorSelector from './personalizar/ColorSelector';
import ProductOptions from './persozapato/ProductOptions';
import { createZapato } from '../../helpers/zapatosService';
import { getColores } from '../../helpers/coloresService';
import { getTalleNumericoID } from '../../helpers/TNService';
import { getMaterialID, getMateriales } from '../../helpers/materialService';
import { getRubros } from '../../helpers/rubroService';
import { createImagen, getimgID } from '../../helpers/imagenService';
import axios from "axios";
import domToImage from 'dom-to-image';
// import { createPost } from '../../helpers/reviewService';
import '../../styles/Personalizacion.css';

const usePersonalizacionZapatos = () => {
  const [selectedColor, setSelectedColor] = useState({ codigoHexa: 'FFFFFF' });
  const [selectedSize, setSelectedSize] = useState('');
  const [shoeName, setShoeName] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [colors, setColors] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [price, setPrice] = useState(0);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hasMetalTip, setHasMetalTip] = useState(false);

  let authorization = localStorage.getItem("authorization"); // Obtén el token del contexto
  const navigate = useNavigate(); // Usa useNavigate para redirigir
  

  // Verifica el token cada vez que el componente se monta o se actualiza
  useEffect(() => {
    console.log(authorization);
  
    const verifyToken = async () => { // 🔹 Hacer que sea async
      if (!authorization || (await isTokenExpired(authorization))) { // 🔹 Esperar el resultado
        // Limpia el localStorage si el token no es válido o ha expirado
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        localStorage.removeItem("user");
        localStorage.removeItem("authorization");
  
        // Redirige al usuario a la pantalla de inicio de sesión
        navigate('/login');
      }
    };
  
    verifyToken(); // Ejecuta la verificación del token
  }, [authorization, navigate]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const colores = await getColores();
        setColors(colores);

        const materialData = await getMateriales();
        if (materialData?.datos) setMaterialTypes(materialData.datos);

        const categories = await getRubros();
        if (categories?.datos) setCategoryTypes(categories.datos);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
      }
    };

    fetchAllData();
  }, []);

  const updatePrice = () => {
    let basePrice = 0;

    const material = materialTypes.find(item => item.descripcion === selectedMaterial);
    if (material) basePrice += material.precio;

    if (hasMetalTip) basePrice += 6000;

    setPrice(basePrice);
  };

  useEffect(() => {
    updatePrice();
  }, [hasMetalTip, selectedMaterial]);

  const getColorID = () => {
    const color = colors.find(c => c.codigoHexa.toUpperCase() === selectedColor.codigoHexa.toUpperCase());
    return color ? color.id : null;
  };

  const getCategoryID = () => {
    const category = categoryTypes.find(c => c.descripcion === selectedCategory);
    return category ? category.id : null;
  };

  return {
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    shoeName,
    setShoeName,
    selectedMaterial,
    setSelectedMaterial,
    getColorID,
    categoryTypes,
    setCategoryTypes,
    price,
    selectedCategory,
    setSelectedCategory,
    getCategoryID,
    hasMetalTip,
    setHasMetalTip,
  };
};

function PersonalizacionZapatos() {
  const {
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    shoeName,
    setShoeName,
    selectedMaterial,
    setSelectedMaterial,
    getColorID,
    categoryTypes,
    setCategoryTypes,
    price,
    selectedCategory,
    setSelectedCategory,
    getCategoryID,
    hasMetalTip,
    setHasMetalTip,
  } = usePersonalizacionZapatos();

  const { userId } = useContext(AuthContext);
  const navigate = useNavigate();
  const viewerRef = useRef(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("success");

  const mostrarAlerta = (message, variant) => {
    setAlertMessage(message);
    setAlertVariant(variant);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleSaveShoe = async () => {
    if (!shoeName) {
      mostrarAlerta('Por favor, escribe un nombre para tus zapatos antes de guardar.', 'danger');
      return;
    }

    const colorID = getColorID();
    if (!colorID) {
      mostrarAlerta('El color seleccionado no es válido.', 'danger');
      return;
    }

    const categoryID = getCategoryID();
    if (!categoryID) {
      mostrarAlerta('Por favor, selecciona un rubro.', 'danger');
      return;
    }

    if (!userId) {
      mostrarAlerta('No se pudo identificar al usuario. Inténtalo nuevamente.', 'danger');
      return;
    }

    try {
      let renderURL = null;
      let imagen = null;
      const FILESTACK_API_KEY = 'AjII17vhrTW6nlVmqqZ8sz';

      if (viewerRef.current) {
        const renderBlob = await domToImage.toBlob(viewerRef.current);
        const renderFile = new File([renderBlob], 'render.png', { type: 'image/png' });
        const formData = new FormData();
        formData.append('fileUpload', renderFile);

        const response = await axios.post(
          `https://www.filestackapi.com/api/store/S3?key=${FILESTACK_API_KEY}`,
          formData
        );

        renderURL = response.data.url;
        const imgData2 = { path: renderURL };
        await createImagen(imgData2);
        imagen = await getimgID(renderURL);
      }

      // const post = {
      //   title: shoeName,
      //   content: "Unos zapatos personalizados en Persicuf!",
      // };

      // console.log("Post a enviar:", post);
      // const postD = await createPost(post);

      const shoeData = {
        precio: price,
        rubroID: categoryID,
        colorID,
        imagenID: imagen,
        materialID: await getMaterialID(selectedMaterial),
        usuarioID: userId,
        nombre: shoeName,
        puntaMetal: hasMetalTip,
        talleNumericoID: await getTalleNumericoID(selectedSize),
        postID: 0,
      };

      await createZapato(shoeData);
      mostrarAlerta(`Tus zapatos "${shoeName}" han sido guardados exitosamente.`, 'success');
      navigate('/');
    } catch (error) {
      console.error('Error al guardar la prenda:', error);
      mostrarAlerta('No se pudo guardar la prenda. Inténtalo nuevamente.', 'danger');
    }
  };

  return (
    <div className="container mt-5">
      {showAlert && (
        <Alert variant={alertVariant} onClose={() => setShowAlert(false)} dismissible>
          {alertMessage}
        </Alert>
      )}

      <h1 className="mb-4">Personaliza tus zapatos</h1>
      <div className="row">
        <div className="col-md-6">
          <ProductViewer
            ref={viewerRef}
            color={selectedColor.codigoHexa}
            selectedCategory={selectedCategory}
            className="product-viewer"
          />
          <div className="mt-3 text-start">
            <h4>Precio: ${price}</h4>
          </div>
        </div>
        <div className="col-md-6 text-start">
          <ColorSelector onColorSelect={setSelectedColor} className="color-selector" />
          <div className="mb-3">
            <label htmlFor="shoeName" className="form-label">Nombre de los zapatos:</label>
            <input
              type="text"
              id="shoeName"
              className="form-control"
              value={shoeName}
              onChange={(e) => setShoeName(e.target.value)}
              placeholder="Ingresa un nombre para tus zapatos"
            />
          </div>
          <ProductOptions
            onSizeChange={setSelectedSize}
            onCategoryChange={setSelectedCategory}
            onMaterialChange={setSelectedMaterial}
            onMetalTipChange={setHasMetalTip}
            selectedSize={selectedSize}
            selectedCategory={selectedCategory}
            selectedMaterial={selectedMaterial}
            hasMetalTip={hasMetalTip}
          />
          <button
            className="btn btn-primary mt-3"
            onClick={handleSaveShoe}
          >
            Guardar prenda
          </button>
        </div>
      </div>
    </div>
  );
}

export default PersonalizacionZapatos;