import React, { useState, useEffect, useContext, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Alert from 'react-bootstrap/Alert';
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { isTokenExpired } from '../../helpers/autenticacion/tokenValidation';
import ProductViewer from './persopantalon/ProductViewer';
import ColorSelector from './personalizar/ColorSelector';
import ProductOptions from './persopantalon/ProductOptions';
import ImageUploader from './persopantalon/ImageUploader';
import { createPantalon } from '../../helpers/pantalonesService';
import { getColores } from '../../helpers/coloresService';
import { getTalleAlfabeticoID } from '../../helpers/TAService';
import { getMaterialID, getMateriales } from '../../helpers/materialService';
import { createImagen, getimgID } from "../../helpers/imagenService";
import { getubicacionID } from '../../helpers/ubicacionesService';
import { getRubros } from '../../helpers/rubroService';
import axios from "axios";
import { getLargos, getLargoID } from '../../helpers/largoService';
import domToImage from 'dom-to-image-more';
// import { createPost } from '../../helpers/reviewService';
import '../../styles/Personalizacion.css';

const base64ToFile = (base64String, filename) => {
  let arr = base64String.split(",");
  let mime = arr[0].match(/:(.*?);/)[1];
  let bstr = atob(arr[1]);
  let n = bstr.length;
  let u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
};

const usePersonalizacionPantalones = () => {
  const [selectedColor, setSelectedColor] = useState({ codigoHexa: 'FFFFFF' });
  const [selectedSize, setSelectedSize] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePosition, setImagePosition] = useState('Bolsillo izquierdo');
  const [selectedLarge, setSelectedLarge] = useState('');
  const [pantsName, setPantsName] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [colors, setColors] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [price, setPrice] = useState(0);
  const [largeTypes, setLargeTypes] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

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

        const data = await getLargos();
        if (data?.datos) setLargeTypes(data.datos);

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

    const largo = largeTypes.find(item => item.descripcion === selectedLarge);
    if (largo) basePrice += largo.precio;

    const material = materialTypes.find(item => item.descripcion === selectedMaterial);
    if (material) basePrice += material.precio;

    if (uploadedImage) basePrice += 4000;

    setPrice(basePrice);
  };

  useEffect(() => {
    updatePrice();
  }, [selectedLarge, selectedMaterial, uploadedImage]);

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
    uploadedImage,
    setUploadedImage,
    imagePosition,
    setImagePosition,
    selectedLarge,
    setSelectedLarge,
    pantsName,
    setPantsName,
    selectedMaterial,
    setSelectedMaterial,
    getColorID,
    categoryTypes,
    setCategoryTypes,
    price,
    selectedCategory,
    setSelectedCategory,
    getCategoryID,
  };
};

function PersonalizacionPantalones() {
  const {
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    uploadedImage,
    setUploadedImage,
    imagePosition,
    setImagePosition,
    pantsName,
    setPantsName,
    selectedMaterial,
    setSelectedMaterial,
    getColorID,
    selectedLarge,
    setSelectedLarge,
    categoryTypes,
    setCategoryTypes,
    price,
    selectedCategory,
    setSelectedCategory,
    getCategoryID,
  } = usePersonalizacionPantalones();

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

  const handleSavePants = async () => {
    if (!pantsName) {
      mostrarAlerta('Por favor, escribe un nombre para tu pantalón antes de guardar.', 'danger');
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
      let estampado = null;
      let renderURL = null;
      let imagen = null;
      const FILESTACK_API_KEY = 'AjII17vhrTW6nlVmqqZ8sz';
      if (uploadedImage) {
        const imageFile = base64ToFile(uploadedImage, 'upload.png');
        const formData = new FormData();
        formData.append('fileUpload', imageFile);

        try {
          const response = await axios.post(
            `https://www.filestackapi.com/api/store/S3?key=${FILESTACK_API_KEY}`,
            formData
          );
          const imageURL = response.data.url;
          const imgData = { path: imageURL, ubicacionID: await getubicacionID(imagePosition) };
          await createImagen(imgData);
          estampado = await getimgID(imageURL);
        } catch (error) {
          mostrarAlerta('No se pudo subir la imagen. Inténtalo nuevamente.', 'danger');
          return;
        }
      }

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
      //   title: pantsName,
      //   content: "Un pantalón personalizado en Persicuf!",
      // };

      // console.log("Post a enviar:", post);
      // const postD = await createPost(post);

      const pantsData = {
        precio: price,
        rubroID: categoryID,
        colorID,
        imagenID: imagen,
        estampadoID: estampado,
        largoID: await getLargoID(selectedLarge),
        materialID: await getMaterialID(selectedMaterial),
        usuarioID: userId,
        nombre: pantsName,
        talleAlfabeticoID: await getTalleAlfabeticoID(selectedSize),
        postID: 0,
      };

      await createPantalon(pantsData);
      mostrarAlerta(`Tu pantalón "${pantsName}" ha sido guardado exitosamente.`, 'success');
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

      <h1 className="mb-4">Personaliza tu pantalón</h1>
      <div className="row">
        <div className="col-md-6">
          <ProductViewer
            ref={viewerRef}
            color={selectedColor.codigoHexa}
            uploadedImage={uploadedImage}
            imagePosition={imagePosition}
            selectedCategory={selectedCategory}
            selectedLarge={selectedLarge}
            className="product-viewer"
          />
          <div className="mt-3 text-start">
            <h4>Precio: ${price}</h4>
          </div>
        </div>
        <div className="col-md-6 text-start">
          <ColorSelector onColorSelect={setSelectedColor} className="color-selector" />
          <ImageUploader
            onImageUpload={setUploadedImage}
            onPositionSelect={setImagePosition}
            className="image-uploader"
          />
          <div className="mb-3">
            <label htmlFor="pantsName" className="form-label">Nombre del pantalón:</label>
            <input
              type="text"
              id="pantsName"
              className="form-control"
              value={pantsName}
              onChange={(e) => setPantsName(e.target.value)}
              placeholder="Ingresa un nombre para tu pantalón"
            />
          </div>
          <ProductOptions
            onSizeChange={setSelectedSize}
            onCategoryChange={setSelectedCategory}
            onMaterialChange={setSelectedMaterial}
            onLargeChange={setSelectedLarge}
            selectedSize={selectedSize}
            selectedCategory={selectedCategory}
            selectedMaterial={selectedMaterial}
            selectedLarge={selectedLarge}
          />
          <button
            className="btn btn-primary mt-3"
            onClick={handleSavePants}
          >
            Guardar prenda
          </button>
        </div>
      </div>
    </div>
  );
}

export default PersonalizacionPantalones;