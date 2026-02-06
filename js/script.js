// Selectores DOM
const categoriasContainer = document.getElementById("categorias-container");
const productosContainer = document.getElementById("productos-container");
const productoModal = document.getElementById("producto-modal");
const detalleImg = document.getElementById("detalle-img");
const detalleVideo = document.getElementById("detalle-video");
const detalleNombre = document.getElementById("detalle-nombre");
const detalleDescripcion = document.getElementById("detalle-descripcion");
const opcionesMedidas = document.getElementById("opciones-medidas");
const opcionMedidaWrapper = document.getElementById("opcion-medida-wrapper");
const detallePrecio = document.getElementById("detalle-precio");
const btnAgregarCarrito = document.getElementById("btn-agregar-carrito");
const btnCancelar = document.getElementById("btn-cancelar");
const cerrarProducto = document.getElementById("cerrar-producto");
const btnRestar = document.getElementById("btn-restar");
const btnSumar = document.getElementById("btn-sumar");
const inputCantidad = document.getElementById("input-cantidad");
const btnCarrito = document.getElementById("btn-carrito");
const carritoCount = document.getElementById("carrito-count");

// Variables globales
let data = null;
let productoActual = null;
let seleccion = {
  medida: null,
  medidaIndex: null,
  cantidad: 1
};
let carrito = [];
let carruselIntervalos = {};
let imagenActualIndex = 0;
let imagenesProductoActual = [];
let seleccionColor = null;

// Número de WhatsApp
const telefonoWhats = "5493547576851";

// Cargar datos del stock.json desde GitHub
async function cargarStock() {
  categoriasContainer.innerHTML = '<div class="cargando"><div class="spinner spinner-lg"></div><span>Cargando productos...</span></div>';
  
  try {
    console.log("Cargando stock.json local...");
    const resp = await fetch("stock.json");
    
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    
    data = await resp.json();
    console.log("Datos cargados exitosamente:", data);
    
    // ESTA LÍNEA FALTABA - Mostrar las categorías
    mostrarCategorias();
    
  } catch (e) {
    console.error("Error cargando stock.json:", e);
    categoriasContainer.innerHTML = `
      <div class="cargando" style="color: #d32f2f;">
        No se pudieron cargar los productos.<br>
        Error: ${e.message}<br>
        <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; cursor: pointer;">
          Recargar
        </button>
      </div>
    `;
    return;
  }
}

// Crear spinner de carga
function crearSpinner() {
  const loader = document.createElement("div");
  loader.className = "image-loader";
  loader.innerHTML = '<div class="spinner"></div>';
  return loader;
}

// Configurar imagen con spinner
function configurarImagenConSpinner(img, contenedor) {
  const spinner = crearSpinner();
  contenedor.appendChild(spinner);
  
  // Si la imagen ya está cacheada, ocultar spinner inmediatamente
  if (img.complete && img.naturalHeight !== 0) {
    spinner.classList.add("loaded");
    setTimeout(() => spinner.remove(), 300);
  } else {
    img.addEventListener("load", function() {
      spinner.classList.add("loaded");
      setTimeout(() => spinner.remove(), 300);
    });
    img.addEventListener("error", function() {
      spinner.classList.add("loaded");
      setTimeout(() => spinner.remove(), 300);
    });
  }
}

// Mostrar categorías
function mostrarCategorias() {
  categoriasContainer.innerHTML = "";
  const cats = data.categorias || [];

  cats.forEach(cat => {
    const div = document.createElement("div");
    div.className = "categoria";

    const imgWrapper = document.createElement("div");
    imgWrapper.className = "imagen-wrapper";

    const img = document.createElement("img");
    img.src = cat.imagen || "img/placeholder.jpg";
    img.alt = cat.nombre || cat.id;
    img.loading = "lazy";
    img.onerror = function() {
      this.onerror = null;
      this.src = 'img/placeholder.jpg';
    };

    const h3 = document.createElement("h3");
    h3.textContent = cat.nombre || cat.id;

    imgWrapper.appendChild(img);
    configurarImagenConSpinner(img, imgWrapper);
    div.appendChild(imgWrapper);
    div.appendChild(h3);

    div.addEventListener("click", () => mostrarProductosCategoria(cat.id));
    categoriasContainer.appendChild(div);
  });
}

// Mostrar productos de una categoría
function mostrarProductosCategoria(categoriaId) {
  const cat = data.categorias.find(c => c.id === categoriaId);
  if (!cat) return;

  // Scroll hacia arriba
  window.scrollTo(0, 0);

  // Limpiar intervalos anteriores
  Object.values(carruselIntervalos).forEach(intervalo => clearInterval(intervalo));
  carruselIntervalos = {};

  categoriasContainer.classList.add("oculto");
  productosContainer.classList.remove("oculto");
  productosContainer.innerHTML = "";

  // Contenedor header con botón y título
  const header = document.createElement("div");
  header.className = "categoria-header";

  // Botón volver
  const volver = document.createElement("button");
  volver.className = "btn-volver-categorias";
  volver.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
    Volver a categorías
  `;
  volver.addEventListener("click", () => {
    Object.values(carruselIntervalos).forEach(intervalo => clearInterval(intervalo));
    carruselIntervalos = {};
    productosContainer.classList.add("oculto");
    categoriasContainer.classList.remove("oculto");
    mostrarCategorias();
  });

  // Título de la categoría
  const titulo = document.createElement("h1");
  titulo.className = "titulo-categoria";
  titulo.textContent = cat.nombre.toUpperCase();

  header.appendChild(volver);
  header.appendChild(titulo);
  productosContainer.appendChild(header);

  // Productos
  const productos = cat.productos || [];
  productos.forEach(prod => {
    const div = document.createElement("div");
    div.className = "producto";
    
    const precioTexto = calcularPrecioBase(prod);
    
    // Filtrar solo imágenes (excluir videos) para el carrusel
    let imagenes = prod.imagenes && prod.imagenes.length > 0 ? prod.imagenes : [prod.imagen];
    imagenes = imagenes.filter(src => !esVideo(src));
    
    // Para Arbolitos de Navidad, usar solo las 2 primeras imágenes en el carrusel
    if (prod.nombre === "Arbolitos de Navidad" && imagenes.length > 2) {
      imagenes = imagenes.slice(0, 2);
    }
    
    const tieneMultiplesImagenes = imagenes.length > 1;

    div.innerHTML = `
      <div class="imagen-container" data-producto-id="${prod.id}">
        <div class="image-loader"><div class="spinner"></div></div>
        <div class="carrusel-wrapper">
          ${imagenes.map((img, index) => 
            `<img src="${img || 'img/placeholder.jpg'}" 
                  alt="${prod.nombre}" 
                  class="producto-img ${index === 0 ? 'active' : ''}" 
                  loading="lazy"
                  onerror="this.onerror=null;this.src='img/placeholder.jpg'">`
          ).join('')}
        </div>
        ${tieneMultiplesImagenes ? '<div class="carrusel-dots"></div>' : ''}
      </div>
      <h3>${prod.nombre}</h3>
      <p>${prod.descripcion}</p>
      <div class="producto-info"><strong>${precioTexto}</strong></div>
      <button class="btn-ver">Ver producto</button>
    `;
    
    // Configurar spinner para la primera imagen del producto
    const imagenContainer = div.querySelector(".imagen-container");
    const primeraImagen = div.querySelector(".producto-img");
    const spinnerProducto = div.querySelector(".image-loader");
    
    if (primeraImagen.complete && primeraImagen.naturalHeight !== 0) {
      spinnerProducto.classList.add("loaded");
      setTimeout(() => spinnerProducto.remove(), 300);
    } else {
      primeraImagen.addEventListener("load", function() {
        spinnerProducto.classList.add("loaded");
        setTimeout(() => spinnerProducto.remove(), 300);
      });
      primeraImagen.addEventListener("error", function() {
        spinnerProducto.classList.add("loaded");
        setTimeout(() => spinnerProducto.remove(), 300);
      });
    }
    
    div.querySelector(".btn-ver").addEventListener("click", () => abrirModalProducto(cat.id, prod.id));
    
    if (tieneMultiplesImagenes) {
      const carruselWrapper = div.querySelector(".carrusel-wrapper");
      const imagenesElements = div.querySelectorAll(".producto-img");
      const dotsContainer = div.querySelector(".carrusel-dots");
      let indiceActual = 0;
      
      imagenes.forEach((_, index) => {
        const dot = document.createElement("span");
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener("click", () => {
          clearTimeout(carruselIntervalos[prod.id]);
          mostrarImagen(index);
          iniciarCarrusel();
        });
        dotsContainer.appendChild(dot);
      });
      
      const mostrarImagen = (nuevoIndice) => {
        imagenesElements.forEach(img => img.classList.remove("active"));
        dotsContainer.querySelectorAll(".dot").forEach(dot => dot.classList.remove("active"));
        
        imagenesElements[nuevoIndice].classList.add("active");
        dotsContainer.querySelectorAll(".dot")[nuevoIndice].classList.add("active");
        
        indiceActual = nuevoIndice;
      };
      
      const siguienteImagen = () => {
        const nuevoIndice = (indiceActual + 1) % imagenes.length;
        mostrarImagen(nuevoIndice);
      };
      
      const iniciarCarrusel = () => {
        carruselIntervalos[prod.id] = setTimeout(() => {
          siguienteImagen();
          iniciarCarrusel();
        }, 4000);
      };
      
      iniciarCarrusel();
      
      imagenContainer.addEventListener("mouseenter", () => {
        clearTimeout(carruselIntervalos[prod.id]);
      });
      
      imagenContainer.addEventListener("mouseleave", iniciarCarrusel);
    }
    
    productosContainer.appendChild(div);
  });
}

// Calcular precio base para mostrar en tarjeta
function calcularPrecioBase(prod) {
  if (prod.precios && prod.precios.length > 0) {
    const preciosNumericos = prod.precios.filter(p => typeof p === 'number');
    if (preciosNumericos.length > 0) {
      const minPrecio = Math.min(...preciosNumericos);
      return `$${minPrecio.toLocaleString('es-AR')}`;
    }
  }
  if (prod.precio && typeof prod.precio === 'number') {
    return `$${prod.precio.toLocaleString('es-AR')}`;
  }
  return "Consultar precio";
}

// Abrir modal de producto
// Abrir modal de producto
function abrirModalProducto(categoriaId, productoId) {
  const cat = data.categorias.find(c => c.id === categoriaId);
  if (!cat) return;
  const prod = cat.productos.find(p => p.id === productoId);
  if (!prod) return;

  productoActual = { ...prod, categoria: categoriaId };
  imagenesProductoActual = productoActual.imagenes && productoActual.imagenes.length > 0 
    ? productoActual.imagenes 
    : [productoActual.imagen];
  imagenActualIndex = 0;

  // Configuración especial para Papel Kraft
  if (productoActual.tipo === "papel_kraft") {
    seleccion = {
      medida: null,
      medidaIndex: null,
      cantidad: 100 // Por defecto 100m
    };
    seleccionColor = null;
  } else {
    seleccion = {
      medida: null,
      medidaIndex: null,
      cantidad: 1
    };
    seleccionColor = null;
  }

  inputCantidad.value = seleccion.cantidad;
  
  // Actualizar label de cantidad según el tipo de producto
  const labelCantidad = document.querySelector('.opcion:has(#input-cantidad) label');
  if (productoActual.tipo === "papel_kraft") {
    labelCantidad.textContent = "Cantidad (metros)";
  } else {
    labelCantidad.textContent = "Cantidad";
  }

  detalleNombre.textContent = productoActual.nombre;
  detalleDescripcion.textContent = productoActual.descripcion || "";
  actualizarImagenModal();
  
  configurarNavegacionImagenes();

  // Mostrar demora si existe
  const demoraWrapper = document.getElementById("opcion-demora-wrapper");
  const demoraMensaje = document.getElementById("info-demora-mensaje");
  if (productoActual.demora) {
    demoraMensaje.textContent = productoActual.demora;
    demoraWrapper.style.display = "flex";
  } else {
    demoraWrapper.style.display = "none";
  }

  // Limpiar cualquier contenedor de medidas kraft anterior
  const medidaKraftAnterior = document.getElementById("opciones-medidas-kraft");
  if (medidaKraftAnterior) {
    medidaKraftAnterior.remove();
  }

  // Lógica especial para Papel Kraft
  if (productoActual.tipo === "papel_kraft") {
    configurarSelectorPapelKraft();
  } else {
    // Lógica normal para otros productos
    opcionesMedidas.innerHTML = "";
    if (productoActual.medidas && productoActual.medidas.length) {
      opcionMedidaWrapper.style.display = "block";
      productoActual.medidas.forEach((m, idx) => {
        const chip = document.createElement("button");
        chip.className = "chip";
        chip.textContent = m;
        chip.addEventListener("click", (event) => {
          [...opcionesMedidas.children].forEach(x => x.classList.remove("selected"));
          chip.classList.add("selected");
          seleccion.medida = m;
          seleccion.medidaIndex = idx;
          actualizarPrecio();
          
          // Solo cambiar imagen si es un click real del usuario (no programático)
          if (productoActual.nombre === "Arbolitos de Navidad" && event.isTrusted) {
            const mapaImagenes = {
              "30cm alto": 2,
              "60cm alto": 3,
              "100cm alto": 4
            };
            
            if (mapaImagenes[m] !== undefined) {
              imagenActualIndex = mapaImagenes[m];
              actualizarImagenModal();
              actualizarIndicadores();
            }
          }
        });
        opcionesMedidas.appendChild(chip);
        if (idx === 0) chip.click();
      });
    } else {
      opcionMedidaWrapper.style.display = "none";
      seleccion.medida = null;
    }
  }

  actualizarPrecio();
  productoModal.classList.remove("oculto");
}


function configurarSelectorPapelKraft() {
  // Obtener el contenedor principal de opciones
  const opcionesContainer = document.getElementById("opciones-container");
  
  // Obtener referencias a los elementos que necesitamos reorganizar
  const opcionCantidad = document.getElementById("opcion-cantidad-wrapper");
  
  // Configurar el selector de Color
  opcionMedidaWrapper.style.display = "block";
  const labelMedida = opcionMedidaWrapper.querySelector('label');
  labelMedida.textContent = "Color";
  
  opcionesMedidas.innerHTML = "";
  
  // Crear selector de color
  productoActual.colores.forEach(color => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = color;
    chip.addEventListener("click", () => {
      seleccionarColorPapelKraft(color);
    });
    opcionesMedidas.appendChild(chip);
  });
  
  // Crear contenedor para el selector de Grosor
  const medidaContainer = document.createElement("div");
  medidaContainer.id = "opciones-medidas-kraft";
  medidaContainer.className = "opcion";
  medidaContainer.style.display = "none";
  medidaContainer.innerHTML = `
    <label>Grosor</label>
    <div id="chips-medidas-kraft"></div>
  `;
  
  // Reorganizar elementos en el orden correcto: Color -> Grosor -> Cantidad
  // Usando appendChild en elementos ya existentes los MUEVE (no los duplica)
  
  // 1. Asegurar que Color esté primero (ya está en opcionMedidaWrapper)
  opcionesContainer.appendChild(opcionMedidaWrapper);
  
  // 2. Agregar Grosor después de Color
  opcionesContainer.appendChild(medidaContainer);
  
  // 3. Mover Cantidad después de Grosor
  if (opcionCantidad) {
    opcionesContainer.appendChild(opcionCantidad);
  }
  
  // Auto-seleccionar Marrón por defecto
  const colorPorDefecto = productoActual.colores[0];
  const chipMarron = [...opcionesMedidas.children].find(c => c.textContent === colorPorDefecto);
  if (chipMarron) {
    chipMarron.click();
    
    // Después de seleccionar Marrón, auto-seleccionar 4mm (índice 1)
    setTimeout(() => {
      const chipsMedidasKraft = document.getElementById("chips-medidas-kraft");
      if (chipsMedidasKraft && chipsMedidasKraft.children.length > 1) {
        chipsMedidasKraft.children[1].click();
      }
    }, 0);
  }
}


function seleccionarColorPapelKraft(color) {
  seleccionColor = color;
  
  // Actualizar chips de color
  [...opcionesMedidas.children].forEach(chip => {
    chip.classList.remove("selected");
    if (chip.textContent === color) {
      chip.classList.add("selected");
    }
  });
  
  // Mostrar y actualizar medidas según el color
  const medidaContainer = document.getElementById("opciones-medidas-kraft");
  const chipsMedidasKraft = document.getElementById("chips-medidas-kraft");
  
  medidaContainer.style.display = "flex";
  chipsMedidasKraft.innerHTML = "";
  
  const medidasDisponibles = productoActual.medidas_por_color[color];
  const preciosDisponibles = productoActual.precios_por_color[color];
  
  medidasDisponibles.forEach((medida, idx) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = medida;
    chip.addEventListener("click", () => {
      [...chipsMedidasKraft.children].forEach(x => x.classList.remove("selected"));
      chip.classList.add("selected");
      seleccion.medida = medida;
      seleccion.medidaIndex = idx;
      actualizarPrecio();
    });
    chipsMedidasKraft.appendChild(chip);
  });
}


// Detectar si un archivo es video
function esVideo(src) {
  return src && (src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.ogg'));
}

// Actualizar imagen del modal
function actualizarImagenModal() {
  const mediaSrc = imagenesProductoActual[imagenActualIndex] || "img/placeholder.jpg";
  
  if (esVideo(mediaSrc)) {
    // Mostrar video, ocultar imagen
    detalleImg.style.display = "none";
    detalleVideo.style.display = "block";
    detalleVideo.src = mediaSrc;
    detalleVideo.play();
  } else {
    // Mostrar imagen, ocultar video
    detalleVideo.style.display = "none";
    detalleVideo.pause();
    detalleImg.style.display = "block";
    detalleImg.src = mediaSrc;
    
    // Detectar imágenes verticales específicas (arbolitos de navidad)
    const imagenesVerticales = ['deco_23.jpeg', 'deco_24.jpeg', 'deco_25.jpeg'];
    const esImagenVertical = imagenesVerticales.some(img => mediaSrc.includes(img));
    
    if (esImagenVertical) {
      detalleImg.classList.add('imagen-vertical');
    } else {
      detalleImg.classList.remove('imagen-vertical');
    }
  }
}

// Configurar navegación de imágenes en el modal
function configurarNavegacionImagenes() {
  const detalleImagenContainer = document.querySelector(".detalle-imagen");
  
  // Limpiar controles previos
  const controlesAnteriores = detalleImagenContainer.querySelectorAll('.imagen-nav-arrow, .imagen-indicators');
  controlesAnteriores.forEach(el => el.remove());

  // Configurar evento de click en el video para fullscreen
  detalleVideo.onclick = () => abrirMediaFullscreen();

  // Si solo hay una imagen/video, agregar evento de zoom y salir
  if (imagenesProductoActual.length === 1) {
    detalleImg.onclick = () => abrirMediaFullscreen();
    return;
  }

  // Crear flechas de navegación
  const flechaPrev = document.createElement("button");
  flechaPrev.className = "imagen-nav-arrow prev";
  flechaPrev.innerHTML = "‹";
  flechaPrev.onclick = (e) => {
    e.stopPropagation();
    cambiarImagenModal(-1);
  };

  const flechaNext = document.createElement("button");
  flechaNext.className = "imagen-nav-arrow next";
  flechaNext.innerHTML = "›";
  flechaNext.onclick = (e) => {
    e.stopPropagation();
    cambiarImagenModal(1);
  };

  // Crear indicadores
  const indicatorsContainer = document.createElement("div");
  indicatorsContainer.className = "imagen-indicators";
  
  imagenesProductoActual.forEach((_, index) => {
    const indicator = document.createElement("span");
    indicator.className = `imagen-indicator ${index === 0 ? 'active' : ''}`;
    indicator.onclick = (e) => {
      e.stopPropagation();
      imagenActualIndex = index;
      actualizarImagenModal();
      actualizarIndicadores();
    };
    indicatorsContainer.appendChild(indicator);
  });

  detalleImagenContainer.appendChild(flechaPrev);
  detalleImagenContainer.appendChild(flechaNext);
  detalleImagenContainer.appendChild(indicatorsContainer);

  // Evento para abrir en pantalla completa
  detalleImg.onclick = () => abrirMediaFullscreen();
}

// Cambiar imagen en el modal
function cambiarImagenModal(direccion) {
  imagenActualIndex = (imagenActualIndex + direccion + imagenesProductoActual.length) % imagenesProductoActual.length;
  actualizarImagenModal();
  actualizarIndicadores();
}

// Actualizar indicadores activos
function actualizarIndicadores() {
  const indicators = document.querySelectorAll(".imagen-indicator");
  indicators.forEach((ind, idx) => {
    if (idx === imagenActualIndex) {
      ind.classList.add("active");
    } else {
      ind.classList.remove("active");
    }
  });
}

// Abrir media (imagen o video) en pantalla completa
function abrirMediaFullscreen() {
  const fullscreenModal = document.createElement("div");
  fullscreenModal.className = "imagen-fullscreen-modal";
  
  const fullscreenContent = document.createElement("div");
  fullscreenContent.className = "fullscreen-content";
  
  const mediaSrc = imagenesProductoActual[imagenActualIndex];
  let mediaElement;
  
  // Crear elemento según el tipo de media
  function crearElementoMedia(src) {
    if (esVideo(src)) {
      const video = document.createElement("video");
      video.src = src;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.controls = true;
      return video;
    } else {
      const img = document.createElement("img");
      img.src = src;
      img.alt = productoActual.nombre;
      return img;
    }
  }
  
  mediaElement = crearElementoMedia(mediaSrc);
  
  const cerrar = document.createElement("span");
  cerrar.className = "cerrar-modal";
  cerrar.innerHTML = "&times;";
  cerrar.onclick = (e) => {
    e.stopPropagation();
    if (mediaElement.tagName === 'VIDEO') mediaElement.pause();
    fullscreenModal.remove();
  };
  
  fullscreenContent.appendChild(mediaElement);
  
  // Si hay múltiples imágenes/videos, agregar controles de navegación
  if (imagenesProductoActual.length > 1) {
    const flechaPrev = document.createElement("button");
    flechaPrev.className = "imagen-nav-arrow prev";
    flechaPrev.innerHTML = "‹";
    flechaPrev.onclick = (e) => {
      e.stopPropagation();
      if (mediaElement.tagName === 'VIDEO') mediaElement.pause();
      imagenActualIndex = (imagenActualIndex - 1 + imagenesProductoActual.length) % imagenesProductoActual.length;
      const nuevoSrc = imagenesProductoActual[imagenActualIndex];
      const nuevoMedia = crearElementoMedia(nuevoSrc);
      fullscreenContent.replaceChild(nuevoMedia, mediaElement);
      mediaElement = nuevoMedia;
      actualizarIndicadoresFullscreen();
      actualizarImagenModal();
    };

    const flechaNext = document.createElement("button");
    flechaNext.className = "imagen-nav-arrow next";
    flechaNext.innerHTML = "›";
    flechaNext.onclick = (e) => {
      e.stopPropagation();
      if (mediaElement.tagName === 'VIDEO') mediaElement.pause();
      imagenActualIndex = (imagenActualIndex + 1) % imagenesProductoActual.length;
      const nuevoSrc = imagenesProductoActual[imagenActualIndex];
      const nuevoMedia = crearElementoMedia(nuevoSrc);
      fullscreenContent.replaceChild(nuevoMedia, mediaElement);
      mediaElement = nuevoMedia;
      actualizarIndicadoresFullscreen();
      actualizarImagenModal();
    };

    // Crear indicadores
    const indicatorsContainer = document.createElement("div");
    indicatorsContainer.className = "imagen-indicators";
    
    imagenesProductoActual.forEach((_, index) => {
      const indicator = document.createElement("span");
      indicator.className = `imagen-indicator ${index === imagenActualIndex ? 'active' : ''}`;
      indicator.onclick = (e) => {
        e.stopPropagation();
        if (mediaElement.tagName === 'VIDEO') mediaElement.pause();
        imagenActualIndex = index;
        const nuevoSrc = imagenesProductoActual[imagenActualIndex];
        const nuevoMedia = crearElementoMedia(nuevoSrc);
        fullscreenContent.replaceChild(nuevoMedia, mediaElement);
        mediaElement = nuevoMedia;
        actualizarIndicadoresFullscreen();
        actualizarImagenModal();
      };
      indicatorsContainer.appendChild(indicator);
    });

    fullscreenContent.appendChild(flechaPrev);
    fullscreenContent.appendChild(flechaNext);
    fullscreenModal.appendChild(indicatorsContainer);

    // Función para actualizar indicadores en fullscreen
    function actualizarIndicadoresFullscreen() {
      const indicators = indicatorsContainer.querySelectorAll(".imagen-indicator");
      indicators.forEach((ind, idx) => {
        if (idx === imagenActualIndex) {
          ind.classList.add("active");
        } else {
          ind.classList.remove("active");
        }
      });
      // También actualizar los indicadores del modal principal
      actualizarIndicadores();
    }
  }
  
  fullscreenModal.appendChild(fullscreenContent);
  fullscreenModal.appendChild(cerrar);
  
  // Cerrar al hacer click en el fondo
  fullscreenModal.onclick = (e) => {
    if (e.target === fullscreenModal) {
      if (mediaElement.tagName === 'VIDEO') mediaElement.pause();
      fullscreenModal.remove();
    }
  };
  
  document.body.appendChild(fullscreenModal);
}

// Mantener compatibilidad con nombre anterior
function abrirImagenFullscreen() {
  abrirMediaFullscreen();
}

// Actualizar precio en el modal
// Función para calcular el precio del producto (sin actualizar UI)
function calcularPrecioProducto() {
  if (!productoActual) return 0;

  let precio = 0;

  // Lógica especial para Papel Kraft
  if (productoActual.tipo === "papel_kraft" && seleccionColor && seleccion.medidaIndex !== null) {
    const precioPor100m = productoActual.precios_por_color[seleccionColor][seleccion.medidaIndex];
    const metros = seleccion.cantidad;
    precio = (precioPor100m / 100) * metros;
  }
  // Lógica normal para otros productos
  else if (productoActual.precios && productoActual.precios.length > 0 && seleccion.medidaIndex !== null) {
    const precioSeleccionado = productoActual.precios[seleccion.medidaIndex];
    if (typeof precioSeleccionado === 'number') {
      precio = precioSeleccionado * seleccion.cantidad;
    }
  }
  else if (productoActual.precio && typeof productoActual.precio === 'number') {
    precio = productoActual.precio * seleccion.cantidad;
  }

  return Math.round(precio);
}

function actualizarPrecio() {
  const precio = calcularPrecioProducto();

  if (precio > 0) {
    detallePrecio.textContent = `$${precio.toLocaleString('es-AR')}`;
  } else {
    detallePrecio.textContent = "Consultar";
  }
}

// Event listeners cantidad
btnRestar.addEventListener("click", () => {
  const isPapelKraft = productoActual && productoActual.tipo === "papel_kraft";
  const incremento = isPapelKraft ? 50 : 1;
  const minimo = isPapelKraft ? 50 : 1;
  
  let current = parseInt(inputCantidad.value);
  if (current > minimo) {
    inputCantidad.value = current - incremento;
    seleccion.cantidad = current - incremento;
    actualizarPrecio();
  }
});

btnSumar.addEventListener("click", () => {
  const isPapelKraft = productoActual && productoActual.tipo === "papel_kraft";
  const incremento = isPapelKraft ? 50 : 1;
  const maximo = isPapelKraft ? 9999 : 99;
  
  let current = parseInt(inputCantidad.value);
  if (current < maximo) {
    inputCantidad.value = current + incremento;
    seleccion.cantidad = current + incremento;
    actualizarPrecio();
  }
});

inputCantidad.addEventListener("change", (e) => {
  const isPapelKraft = productoActual && productoActual.tipo === "papel_kraft";
  const incremento = isPapelKraft ? 50 : 1;
  const minimo = isPapelKraft ? 50 : 1;
  const maximo = isPapelKraft ? 9999 : 99;
  
  let value = parseInt(e.target.value);
  
  if (isPapelKraft) {
    // Redondear al múltiplo de 50 más cercano
    value = Math.round(value / incremento) * incremento;
  }
  
  if (value < minimo) value = minimo;
  if (value > maximo) value = maximo;
  
  e.target.value = value;
  seleccion.cantidad = value;
  actualizarPrecio();
});


// Agregar al carrito
btnAgregarCarrito.addEventListener("click", () => {
  if (!productoActual) return;

  // Validación especial para Papel Kraft
  if (productoActual.tipo === "papel_kraft") {
    if (!seleccionColor) {
      mostrarNotificacion("Por favor selecciona un color", "error");
      return;
    }
    if (seleccion.medidaIndex === null) {
      mostrarNotificacion("Por favor selecciona un grosor", "error");
      return;
    }
  }

  const precio = calcularPrecioProducto();
  
  let descripcionMedida = seleccion.medida || "Sin especificar";
  
  // Para Papel Kraft, agregar el color en la descripción
  if (productoActual.tipo === "papel_kraft" && seleccionColor) {
    descripcionMedida = `${seleccionColor} - ${seleccion.medida}`;
  }
  
  // Para Papel Kraft, el precio ya incluye la cantidad (metros)
  // Para otros productos, necesitamos el precio unitario
  const precioUnitario = productoActual.tipo === "papel_kraft" 
    ? precio / seleccion.cantidad 
    : precio / seleccion.cantidad;
  
  const itemCarrito = {
    id: `${productoActual.id}-${seleccionColor || ''}-${seleccion.medidaIndex}`,
    productoId: productoActual.id,
    nombre: productoActual.nombre,
    imagen: productoActual.imagenes && productoActual.imagenes.length > 0 ? productoActual.imagenes[0] : productoActual.imagen,
    medida: descripcionMedida,
    cantidad: seleccion.cantidad,
    unidad: productoActual.unidad || "unidades",
    precio: precioUnitario,
    precioTotal: precio
  };

  const existente = carrito.find(item => item.id === itemCarrito.id);
  if (existente) {
    existente.cantidad += itemCarrito.cantidad;
    existente.precioTotal = existente.precio * existente.cantidad;
  } else {
    carrito.push(itemCarrito);
  }

  guardarCarrito();
  actualizarContadorCarrito();
  mostrarNotificacion("Producto agregado al carrito", "success");
  productoModal.classList.add("oculto");
});


// Calcular precio del producto actual
function calcularPrecioBase(prod) {
  // Lógica especial para Papel Kraft
  if (prod.tipo === "papel_kraft") {
    // Por defecto: Marrón, 4mm (índice 1), 100m
    const colorPorDefecto = "Marrón";
    const indicePorDefecto = 1; // 4mm es el índice 1 en el array de Marrón
    const cantidadPorDefecto = 100;
    
    const precioPor100m = prod.precios_por_color[colorPorDefecto][indicePorDefecto];
    const precioCalculado = (precioPor100m / 100) * cantidadPorDefecto;
    
    return `$${Math.round(precioCalculado).toLocaleString('es-AR')}`;
  }
  
  // Lógica normal para otros productos - mostrar SIEMPRE el primer precio
  if (prod.precios && prod.precios.length > 0) {
    const primerPrecio = prod.precios[0];
    if (typeof primerPrecio === 'number') {
      return `$${primerPrecio.toLocaleString('es-AR')}`;
    }
  }
  if (prod.precio && typeof prod.precio === 'number') {
    return `$${prod.precio.toLocaleString('es-AR')}`;
  }
  return "Consultar precio";
}

// Guardar carrito en localStorage
function guardarCarrito() {
  localStorage.setItem('carritoHierro', JSON.stringify(carrito));
}

// Cargar carrito desde localStorage
function cargarCarrito() {
  const carritoGuardado = localStorage.getItem('carritoHierro');
  if (carritoGuardado) {
    carrito = JSON.parse(carritoGuardado);
    actualizarContadorCarrito();
  }
}

// Actualizar contador del carrito
function actualizarContadorCarrito() {
  const totalItems = carrito.reduce((sum, item) => {
    // Para Papel Kraft, contar como 1 item sin importar los metros
    if (item.unidad === "metros") {
      return sum + 1;
    }
    return sum + item.cantidad;
  }, 0);
  carritoCount.textContent = totalItems;
  if (totalItems > 0) {
    carritoCount.style.display = "flex";
  } else {
    carritoCount.style.display = "none";
  }
}

// === FUNCIONALIDAD DEL MODAL CARRITO ===
const modalCarrito = document.getElementById("modal-carrito");
const cerrarCarritoBtn = document.getElementById("cerrar-carrito");
const carritoItemsContainer = document.getElementById("carrito-items-container");
const carritoVacio = document.getElementById("carrito-vacio");
const carritoContenido = document.getElementById("carrito-contenido");
const carritoFooter = document.getElementById("carrito-footer");
const totalCarrito = document.getElementById("total-carrito");
const btnFinalizarCompra = document.getElementById("btn-finalizar");
const btnCancelarCarrito = document.getElementById("btn-cancelar-carrito");
const nombreClienteInput = document.getElementById("nombre-cliente");
const btnGuardarNombre = document.getElementById("btn-guardar-nombre");
const mensajeGuardado = document.getElementById("mensaje-guardado");
const btnInfo = document.getElementById("btn-info");
const tooltipInfo = document.getElementById("tooltip-info");

// Abrir carrito
btnCarrito.addEventListener("click", () => {
  abrirModalCarrito();
});

// Función para abrir el modal del carrito
function abrirModalCarrito() {
  modalCarrito.classList.add("activo");
  actualizarVistaCarrito();
  cargarNombreGuardado();
}

// Cerrar modal carrito
cerrarCarritoBtn.addEventListener("click", () => {
  modalCarrito.classList.remove("activo");
});

btnCancelarCarrito.addEventListener("click", () => {
  modalCarrito.classList.remove("activo");
});

// Cerrar al hacer click fuera del contenido
modalCarrito.addEventListener("click", (e) => {
  if (e.target === modalCarrito) {
    modalCarrito.classList.remove("activo");
  }
});

// Actualizar vista del carrito
function actualizarVistaCarrito() {
  if (carrito.length === 0) {
    carritoVacio.style.display = "block";
    carritoContenido.style.display = "none";
    carritoFooter.style.display = "none";
    carritoItemsContainer.innerHTML = "";
  } else {
    carritoVacio.style.display = "none";
    carritoContenido.style.display = "block";
    carritoFooter.style.display = "block";
    renderizarItemsCarrito();
    actualizarTotalCarrito();
  }
}

// Renderizar items del carrito
function renderizarItemsCarrito() {
  carritoItemsContainer.innerHTML = "";
  
  carrito.forEach((item, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "carrito-item";
    
    const precioTexto = item.precioTotal === 0 ? 'A consultar' : `$${item.precioTotal.toLocaleString('es-AR')}`;
    
    itemDiv.innerHTML = `
      <div class="item-imagen">
        <div class="image-loader"><div class="spinner"></div></div>
        <img src="${item.imagen || 'img/placeholder.jpg'}" alt="${item.nombre}" onerror="this.onerror=null;this.src='img/placeholder.jpg'">
      </div>
      <div class="item-info">
        <p class="item-nombre">${item.nombre}</p>
        <p class="item-medida">Medida: ${item.medida}</p>
        <p class="item-cantidad">Cantidad: ${item.cantidad}${item.unidad === 'metros' ? 'm' : ''}</p>
      </div>
      <div class="item-derecha">
        <p class="item-precio">${precioTexto}</p>
        <button class="btn-eliminar" data-index="${index}" aria-label="Eliminar producto">×</button>
      </div>
    `;
    
    // Configurar spinner para la imagen del carrito
    const imagenCarrito = itemDiv.querySelector("img");
    const spinnerCarrito = itemDiv.querySelector(".image-loader");
    
    if (imagenCarrito.complete && imagenCarrito.naturalHeight !== 0) {
      spinnerCarrito.classList.add("loaded");
      setTimeout(() => spinnerCarrito.remove(), 300);
    } else {
      imagenCarrito.addEventListener("load", function() {
        spinnerCarrito.classList.add("loaded");
        setTimeout(() => spinnerCarrito.remove(), 300);
      });
      imagenCarrito.addEventListener("error", function() {
        spinnerCarrito.classList.add("loaded");
        setTimeout(() => spinnerCarrito.remove(), 300);
      });
    }
    
    // Event listener para eliminar
    const btnEliminar = itemDiv.querySelector(".btn-eliminar");
    btnEliminar.addEventListener("click", () => eliminarDelCarrito(index));
    
    carritoItemsContainer.appendChild(itemDiv);
  });
}

// Actualizar total del carrito
function actualizarTotalCarrito() {
  const hayProductosSinPrecio = carrito.some(item => item.precioTotal === 0);
  
  if (hayProductosSinPrecio) {
    const total = carrito.reduce((sum, item) => sum + item.precioTotal, 0);
    if (total === 0) {
      totalCarrito.textContent = 'A consultar';
    } else {
      totalCarrito.textContent = `$${total.toLocaleString('es-AR')} + A consultar`;
    }
  } else {
    const total = carrito.reduce((sum, item) => sum + item.precioTotal, 0);
    totalCarrito.textContent = `$${total.toLocaleString('es-AR')}`;
  }
}

// Eliminar producto del carrito
function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  actualizarContadorCarrito();
  actualizarVistaCarrito();
  mostrarNotificacion("Producto eliminado del carrito", "error");
}

// Guardar nombre del cliente
btnGuardarNombre.addEventListener("click", () => {
  const nombre = nombreClienteInput.value.trim();
  if (nombre) {
    localStorage.setItem('nombreClienteHierro', nombre);
    mostrarMensajeGuardado();
  }
});

// Cargar nombre guardado
function cargarNombreGuardado() {
  const nombreGuardado = localStorage.getItem('nombreClienteHierro');
  if (nombreGuardado) {
    nombreClienteInput.value = nombreGuardado;
  }
}

// Mostrar mensaje de guardado
function mostrarMensajeGuardado() {
  mensajeGuardado.classList.add("mostrar");
  setTimeout(() => {
    mensajeGuardado.classList.remove("mostrar");
  }, 2000);
}

// Toggle tooltip info
btnInfo.addEventListener("click", (e) => {
  e.stopPropagation();
  tooltipInfo.classList.toggle("mostrar");
});

// Cerrar tooltip al hacer click fuera
document.addEventListener("click", (e) => {
  if (!btnInfo.contains(e.target) && !tooltipInfo.contains(e.target)) {
    tooltipInfo.classList.remove("mostrar");
  }
});

// Finalizar compra - enviar por WhatsApp
btnFinalizarCompra.addEventListener("click", () => {
  if (carrito.length === 0) {
    mostrarNotificacion("El carrito está vacío", "error");
    return;
  }
  
  generarMensajeWhatsApp();
});

// Generar mensaje de WhatsApp
function generarMensajeWhatsApp() {
  let mensaje = "Hola Silvana! Quiero realizar una compra:\n\n";
  
  // Agregar nombre si existe
  const nombre = nombreClienteInput.value.trim();
  if (nombre) {
    mensaje += `*Nombre:* ${nombre}\n\n`;
  }
  
  // Agregar productos
  mensaje += "*PRODUCTOS:*\n";
  carrito.forEach((item, index) => {
    mensaje += `${index + 1}. *${item.nombre}*\n`;
    mensaje += `   - Medida: ${item.medida}\n`;
    mensaje += `   - Cantidad: ${item.cantidad}\n`;
    mensaje += `   - Precio: $${item.precioTotal.toLocaleString('es-AR')}\n\n`;
  });
  
  // Agregar total
  const total = carrito.reduce((sum, item) => sum + item.precioTotal, 0);
  mensaje += `*TOTAL: $${total.toLocaleString('es-AR')}*\n\n`;
  mensaje += "Quedo a la espera de tu respuesta. ¡Gracias!";
  
  // Codificar mensaje para URL
  const mensajeCodificado = encodeURIComponent(mensaje);
  const urlWhatsApp = `https://wa.me/${telefonoWhats}?text=${mensajeCodificado}`;
  
  // Abrir WhatsApp
  window.open(urlWhatsApp, '_blank');
  
  // Opcional: limpiar carrito después de enviar
  // carrito = [];
  // guardarCarrito();
  // actualizarContadorCarrito();
  // modalCarrito.classList.remove("activo");
}

// Cerrar modal
btnCancelar.addEventListener("click", () => {
  productoModal.classList.add("oculto");
});

if (cerrarProducto) {
  cerrarProducto.addEventListener("click", () => {
    productoModal.classList.add("oculto");
  });
}

productoModal.addEventListener("click", (e) => {
  if (e.target === productoModal) {
    productoModal.classList.add("oculto");
  }
});

// Función de notificación
function mostrarNotificacion(mensaje, tipo = "success") {
  const notification = document.createElement("div");
  notification.className = `notificacion ${tipo}`;
  notification.textContent = mensaje;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// ===========================
// SECCIÓN SOBRE MÍ
// ===========================

// Selectores
const btnSobreMi = document.getElementById("btn-sobre-mi");
const btnVolverProductos = document.getElementById("btn-volver-productos");
const sobreMiSection = document.getElementById("sobre-mi-section");
const videoPlayer = document.getElementById("video-player");
const progressFill = document.getElementById("progress-fill");
const prevButton = document.getElementById("prev-video");
const nextButton = document.getElementById("next-video");
const indicators = document.querySelectorAll(".video-indicator");

// Segundo reproductor de video
const videoPlayer2 = document.getElementById("video-player-2");
const progressFill2 = document.getElementById("progress-fill-2");
const prevButton2 = document.getElementById("prev-video-2");
const nextButton2 = document.getElementById("next-video-2");
const indicators2 = videoPlayer2 
  ? videoPlayer2.closest('.video-wrapper-talleres').querySelectorAll(".video-indicator")
  : [];

// Videos
const videos = [
  'videos/video1.mp4',
  'videos/video2.mp4',
  'videos/video3.mp4'
];

// Videos del segundo reproductor
const videos2 = [
  'videos/video5.mp4'
];

let currentVideoIndex = 0;
let updateProgressInterval = null;

let currentVideoIndex2 = 0;
let updateProgressInterval2 = null;

// Mostrar sección Sobre Mí
btnSobreMi.addEventListener("click", () => {
  categoriasContainer.classList.add("oculto");
  productosContainer.classList.add("oculto");
  sobreMiSection.classList.remove("oculto");
  
  // Scroll al inicio
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Intentar reproducir los videos
  setTimeout(() => {
    if (videoPlayer) {
      videoPlayer.play().catch(err => {
        console.log('Reproducción automática bloqueada:', err);
      });
    }
    if (videoPlayer2) {
      videoPlayer2.play().catch(err => {
        console.log('Reproducción automática bloqueada video 2:', err);
      });
    }
  }, 300);
});

// Volver a productos
btnVolverProductos.addEventListener("click", () => {
  sobreMiSection.classList.add("oculto");
  categoriasContainer.classList.remove("oculto");
  
  // Pausar videos
  if (videoPlayer) {
    videoPlayer.pause();
  }
  if (videoPlayer2) {
    videoPlayer2.pause();
  }
  
  // Scroll al inicio
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Funciones del carrusel de videos
function loadVideo(index) {
  if (!videoPlayer) return;
  
  currentVideoIndex = index;
  videoPlayer.src = videos[index];
  videoPlayer.load();
  videoPlayer.play().catch(err => {
    console.log('Error al reproducir el video:', err);
  });
  
  // Actualizar indicadores
  indicators.forEach((indicator, idx) => {
    if (idx === index) {
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active');
    }
  });
  
  // Resetear barra de progreso
  if (progressFill) {
    progressFill.style.width = '0%';
  }
}

// Actualizar barra de progreso
function updateProgress() {
  if (videoPlayer && videoPlayer.duration > 0 && progressFill) {
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressFill.style.width = progress + '%';
  }
}

// Iniciar actualización de progreso
function startProgressUpdate() {
  if (updateProgressInterval) {
    clearInterval(updateProgressInterval);
  }
  updateProgressInterval = setInterval(updateProgress, 100);
}

// Event listeners de los controles
if (prevButton) {
  prevButton.addEventListener('click', () => {
    const newIndex = (currentVideoIndex - 1 + videos.length) % videos.length;
    loadVideo(newIndex);
  });
}

if (nextButton) {
  nextButton.addEventListener('click', () => {
    const newIndex = (currentVideoIndex + 1) % videos.length;
    loadVideo(newIndex);
  });
}

// Click en indicadores
indicators.forEach((indicator, index) => {
  indicator.addEventListener('click', () => {
    loadVideo(index);
  });
});

// Event listeners del video
if (videoPlayer) {
  videoPlayer.addEventListener('play', () => {
    startProgressUpdate();
  });

  videoPlayer.addEventListener('ended', () => {
    const nextIndex = (currentVideoIndex + 1) % videos.length;
    loadVideo(nextIndex);
  });

  videoPlayer.addEventListener('timeupdate', updateProgress);

  videoPlayer.addEventListener('pause', () => {
    if (updateProgressInterval) {
      clearInterval(updateProgressInterval);
    }
  });
}

// ========== SEGUNDO REPRODUCTOR DE VIDEO ==========

// Funciones del segundo carrusel de videos
function loadVideo2(index) {
  if (!videoPlayer2) return;
  
  currentVideoIndex2 = index;
  videoPlayer2.src = videos2[index];
  videoPlayer2.load();
  videoPlayer2.play().catch(err => {
    console.log('Error al reproducir el video 2:', err);
  });
  
  // Actualizar indicadores
  indicators2.forEach((indicator, idx) => {
    if (idx === index) {
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active');
    }
  });
  
  // Resetear barra de progreso
  if (progressFill2) {
    progressFill2.style.width = '0%';
  }
}

// Actualizar barra de progreso del segundo reproductor
function updateProgress2() {
  if (videoPlayer2 && videoPlayer2.duration > 0 && progressFill2) {
    const progress = (videoPlayer2.currentTime / videoPlayer2.duration) * 100;
    progressFill2.style.width = progress + '%';
  }
}

// Iniciar actualización de progreso del segundo reproductor
function startProgressUpdate2() {
  if (updateProgressInterval2) {
    clearInterval(updateProgressInterval2);
  }
  updateProgressInterval2 = setInterval(updateProgress2, 100);
}

// Event listeners de los controles del segundo reproductor
if (prevButton2) {
  prevButton2.addEventListener('click', () => {
    const newIndex = (currentVideoIndex2 - 1 + videos2.length) % videos2.length;
    loadVideo2(newIndex);
  });
}

if (nextButton2) {
  nextButton2.addEventListener('click', () => {
    const newIndex = (currentVideoIndex2 + 1) % videos2.length;
    loadVideo2(newIndex);
  });
}

// Click en indicadores del segundo reproductor
indicators2.forEach((indicator, index) => {
  indicator.addEventListener('click', () => {
    loadVideo2(index);
  });
});

// Event listeners del segundo video player
if (videoPlayer2) {
  videoPlayer2.addEventListener('play', () => {
    startProgressUpdate2();
  });

  videoPlayer2.addEventListener('ended', () => {
    const nextIndex = (currentVideoIndex2 + 1) % videos2.length;
    loadVideo2(nextIndex);
  });

  videoPlayer2.addEventListener('timeupdate', updateProgress2);

  videoPlayer2.addEventListener('pause', () => {
    if (updateProgressInterval2) {
      clearInterval(updateProgressInterval2);
    }
  });
}


// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarStock();
});


