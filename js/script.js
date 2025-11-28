// Selectores DOM
const categoriasContainer = document.getElementById("categorias-container");
const productosContainer = document.getElementById("productos-container");
const productoModal = document.getElementById("producto-modal");
const detalleImg = document.getElementById("detalle-img");
const detalleNombre = document.getElementById("detalle-nombre");
const detalleDescripcion = document.getElementById("detalle-descripcion");
const opcionesMedidas = document.getElementById("opciones-medidas");
const opcionMedidaWrapper = document.getElementById("opcion-medida-wrapper");
const detalleDemora = document.getElementById("detalle-demora");
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
const telefonoWhats = "5493547656901";

// Cargar datos del stock.json desde GitHub
async function cargarStock() {
  categoriasContainer.innerHTML = '<div class="cargando">Cargando productos...</div>';
  
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
    img.onerror = function() {
      this.onerror = null;
      this.src = 'img/placeholder.jpg';
    };

    const h3 = document.createElement("h3");
    h3.textContent = cat.nombre || cat.id;

    imgWrapper.appendChild(img);
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

  // Limpiar intervalos anteriores
  Object.values(carruselIntervalos).forEach(intervalo => clearInterval(intervalo));
  carruselIntervalos = {};

  categoriasContainer.classList.add("oculto");
  productosContainer.classList.remove("oculto");
  productosContainer.innerHTML = "";

  // Botón volver
  const volver = document.createElement("div");
  volver.className = "producto volver-btn";
  volver.innerHTML = `<h3>Volver a categorías</h3>`;
  volver.addEventListener("click", () => {
    Object.values(carruselIntervalos).forEach(intervalo => clearInterval(intervalo));
    carruselIntervalos = {};
    productosContainer.classList.add("oculto");
    categoriasContainer.classList.remove("oculto");
    mostrarCategorias();
  });
  productosContainer.appendChild(volver);

  // Productos
  const productos = cat.productos || [];
  productos.forEach(prod => {
    const div = document.createElement("div");
    div.className = "producto";
    
    const precioTexto = calcularPrecioBase(prod);
    
    // Para Arbolitos de Navidad, usar solo las 2 primeras imágenes en el carrusel
    let imagenes = prod.imagenes && prod.imagenes.length > 0 ? prod.imagenes : [prod.imagen];
    if (prod.nombre === "Arbolitos de Navidad" && imagenes.length > 2) {
      imagenes = imagenes.slice(0, 2);
    }
    
    const tieneMultiplesImagenes = imagenes.length > 1;

    div.innerHTML = `
      <div class="imagen-container" data-producto-id="${prod.id}">
        <div class="carrusel-wrapper">
          ${imagenes.map((img, index) => 
            `<img src="${img || 'img/placeholder.jpg'}" 
                  alt="${prod.nombre}" 
                  class="producto-img ${index === 0 ? 'active' : ''}"
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
      
      const imagenContainer = div.querySelector(".imagen-container");
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
      return `Desde $${minPrecio.toLocaleString('es-AR')}`;
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
    labelCantidad.textContent = "Cantidad";
  } else {
    labelCantidad.textContent = "Cantidad";
  }

  detalleNombre.textContent = productoActual.nombre;
  detalleDescripcion.textContent = productoActual.descripcion || "";
  actualizarImagenModal();
  
  const demoraTexto = productoActual.demora || "Consultar";
  detalleDemora.textContent = demoraTexto;
  
  if (demoraTexto.toLowerCase() === "en stock") {
    detalleDemora.classList.add("en-stock");
  } else {
    detalleDemora.classList.remove("en-stock");
  }

  configurarNavegacionImagenes();

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
        chip.addEventListener("click", () => {
          [...opcionesMedidas.children].forEach(x => x.classList.remove("selected"));
          chip.classList.add("selected");
          seleccion.medida = m;
          seleccion.medidaIndex = idx;
          actualizarPrecio();
          
          if (productoActual.nombre === "Arbolitos de Navidad") {
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
  const opcionDemoraWrapper = document.getElementById("opcion-demora-wrapper");
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
  
  // Reorganizar elementos en el orden correcto: Color -> Grosor -> Demora -> Cantidad
  // Usando appendChild en elementos ya existentes los MUEVE (no los duplica)
  
  // 1. Asegurar que Color esté primero (ya está en opcionMedidaWrapper)
  opcionesContainer.appendChild(opcionMedidaWrapper);
  
  // 2. Agregar Grosor después de Color
  opcionesContainer.appendChild(medidaContainer);
  
  // 3. Mover Demora después de Grosor
  if (opcionDemoraWrapper) {
    opcionesContainer.appendChild(opcionDemoraWrapper);
  }
  
  // 4. Mover Cantidad después de Demora
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


// Actualizar imagen del modal
function actualizarImagenModal() {
  const imagenSrc = imagenesProductoActual[imagenActualIndex] || "img/placeholder.jpg";
  detalleImg.src = imagenSrc;
  
  // Detectar imágenes verticales específicas (arbolitos de navidad)
  const imagenesVerticales = ['deco_23.jpeg', 'deco_24.jpeg', 'deco_25.jpeg'];
  const esImagenVertical = imagenesVerticales.some(img => imagenSrc.includes(img));
  
  if (esImagenVertical) {
    detalleImg.classList.add('imagen-vertical');
  } else {
    detalleImg.classList.remove('imagen-vertical');
  }
}

// Configurar navegación de imágenes en el modal
function configurarNavegacionImagenes() {
  const detalleImagenContainer = document.querySelector(".detalle-imagen");
  
  // Limpiar controles previos
  const controlesAnteriores = detalleImagenContainer.querySelectorAll('.imagen-nav-arrow, .imagen-indicators');
  controlesAnteriores.forEach(el => el.remove());

  // Si solo hay una imagen, agregar evento de zoom y salir
  if (imagenesProductoActual.length === 1) {
    detalleImg.onclick = () => abrirImagenFullscreen();
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
  detalleImg.onclick = () => abrirImagenFullscreen();
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

// Abrir imagen en pantalla completa
function abrirImagenFullscreen() {
  const fullscreenModal = document.createElement("div");
  fullscreenModal.className = "imagen-fullscreen-modal";
  
  const fullscreenContent = document.createElement("div");
  fullscreenContent.className = "fullscreen-content";
  
  const img = document.createElement("img");
  img.src = imagenesProductoActual[imagenActualIndex];
  img.alt = productoActual.nombre;
  
  const cerrar = document.createElement("span");
  cerrar.className = "cerrar-modal";
  cerrar.innerHTML = "&times;";
  cerrar.onclick = (e) => {
    e.stopPropagation();
    fullscreenModal.remove();
  };
  
  fullscreenContent.appendChild(img);
  
  // Si hay múltiples imágenes, agregar controles de navegación
  if (imagenesProductoActual.length > 1) {
    const flechaPrev = document.createElement("button");
    flechaPrev.className = "imagen-nav-arrow prev";
    flechaPrev.innerHTML = "‹";
    flechaPrev.onclick = (e) => {
      e.stopPropagation();
      imagenActualIndex = (imagenActualIndex - 1 + imagenesProductoActual.length) % imagenesProductoActual.length;
      img.src = imagenesProductoActual[imagenActualIndex];
      actualizarIndicadoresFullscreen();
    };

    const flechaNext = document.createElement("button");
    flechaNext.className = "imagen-nav-arrow next";
    flechaNext.innerHTML = "›";
    flechaNext.onclick = (e) => {
      e.stopPropagation();
      imagenActualIndex = (imagenActualIndex + 1) % imagenesProductoActual.length;
      img.src = imagenesProductoActual[imagenActualIndex];
      actualizarIndicadoresFullscreen();
    };

    // Crear indicadores
    const indicatorsContainer = document.createElement("div");
    indicatorsContainer.className = "imagen-indicators";
    
    imagenesProductoActual.forEach((_, index) => {
      const indicator = document.createElement("span");
      indicator.className = `imagen-indicator ${index === imagenActualIndex ? 'active' : ''}`;
      indicator.onclick = (e) => {
        e.stopPropagation();
        imagenActualIndex = index;
        img.src = imagenesProductoActual[imagenActualIndex];
        actualizarIndicadoresFullscreen();
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
      fullscreenModal.remove();
    }
  };
  
  document.body.appendChild(fullscreenModal);
}

// Actualizar precio en el modal
function actualizarPrecio() {
  if (!productoActual) return;

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

  if (precio > 0) {
    detallePrecio.textContent = `$${Math.round(precio).toLocaleString('es-AR')}`;
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
  
  const itemCarrito = {
    id: `${productoActual.id}-${seleccionColor || ''}-${seleccion.medidaIndex}`,
    productoId: productoActual.id,
    nombre: productoActual.nombre,
    imagen: productoActual.imagen,
    medida: descripcionMedida,
    cantidad: seleccion.cantidad,
    unidad: productoActual.unidad || "unidades",
    precio: precio,
    precioTotal: precio * seleccion.cantidad
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
  
  // Lógica normal para otros productos
  if (prod.precios && prod.precios.length > 0) {
    const preciosNumericos = prod.precios.filter(p => typeof p === 'number');
    if (preciosNumericos.length > 0) {
      const minPrecio = Math.min(...preciosNumericos);
      return `Desde $${minPrecio.toLocaleString('es-AR')}`;
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
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
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
    
    itemDiv.innerHTML = `
      <div class="item-imagen">
        <img src="${item.imagen || 'img/placeholder.jpg'}" alt="${item.nombre}" onerror="this.onerror=null;this.src='img/placeholder.jpg'">
      </div>
      <div class="item-info">
        <p class="item-nombre">${item.nombre}</p>
        <p class="item-medida">Medida: ${item.medida}</p>
        <p class="item-cantidad">Cantidad: ${item.cantidad}</p>
      </div>
      <div class="item-derecha">
        <p class="item-precio">$${item.precioTotal.toLocaleString('es-AR')}</p>
        <button class="btn-eliminar" data-index="${index}" aria-label="Eliminar producto">×</button>
      </div>
    `;
    
    // Event listener para eliminar
    const btnEliminar = itemDiv.querySelector(".btn-eliminar");
    btnEliminar.addEventListener("click", () => eliminarDelCarrito(index));
    
    carritoItemsContainer.appendChild(itemDiv);
  });
}

// Actualizar total del carrito
function actualizarTotalCarrito() {
  const total = carrito.reduce((sum, item) => sum + item.precioTotal, 0);
  totalCarrito.textContent = `$${total.toLocaleString('es-AR')}`;
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
  let mensaje = "¡Hola Silvana! Quiero realizar una compra:\n\n";
  
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



// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarStock();
});