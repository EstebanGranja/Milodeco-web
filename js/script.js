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
let carruselIntervalos = {}; // Para guardar los intervalos de cada carrusel

// Número de WhatsApp
const telefonoWhats = "5493547656901";

// Cargar datos del stock.json desde GitHub
async function cargarStock() {
  categoriasContainer.innerHTML = '<div class="cargando">Cargando productos...</div>';
  try {
    const resp = await fetch("https://raw.githubusercontent.com/EstebanGranja/milodeco-stock/refs/heads/master/stock.json");
    if (!resp.ok) throw new Error("No se pudo cargar stock.json");
    data = await resp.json();
    console.log("Datos cargados:", data);
  } catch (e) {
    console.error("Error cargando stock.json", e);
    categoriasContainer.innerHTML = '<div class="cargando">Error al cargar productos. Por favor recarga la página.</div>';
    return;
  }

  mostrarCategorias();
  cargarCarrito();
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
  volver.innerHTML = `<h3>← Volver a categorías</h3>`;
  volver.addEventListener("click", () => {
    // Limpiar intervalos al volver
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
    
    // Determinar si hay múltiples imágenes
    const imagenes = prod.imagenes && prod.imagenes.length > 0 ? prod.imagenes : [prod.imagen];
    const tieneMultiplesImagenes = imagenes.length > 1;

    // Crear estructura HTML para el carrusel
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
    
    // Si tiene múltiples imágenes, iniciar carrusel automático
    if (tieneMultiplesImagenes) {
      const carruselWrapper = div.querySelector(".carrusel-wrapper");
      const imagenesElements = div.querySelectorAll(".producto-img");
      const dotsContainer = div.querySelector(".carrusel-dots");
      let indiceActual = 0;
      
      // Crear indicadores de puntos
      imagenes.forEach((_, index) => {
        const dot = document.createElement("span");
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener("click", () => {
          clearTimeout(carruselIntervalos[prod.id]);
          mostrarImagen(index);
          iniciarCarrusel(); // Reiniciar el intervalo
        });
        dotsContainer.appendChild(dot);
      });
      
      // Función para mostrar una imagen específica
      const mostrarImagen = (nuevoIndice) => {
        // Remover clase active de todas las imágenes y puntos
        imagenesElements.forEach(img => img.classList.remove("active"));
        dotsContainer.querySelectorAll(".dot").forEach(dot => dot.classList.remove("active"));
        
        // Aplicar clase active a la imagen y punto actual
        imagenesElements[nuevoIndice].classList.add("active");
        dotsContainer.querySelectorAll(".dot")[nuevoIndice].classList.add("active");
        
        indiceActual = nuevoIndice;
      };
      
      // Función para cambiar a la siguiente imagen
      const siguienteImagen = () => {
        const nuevoIndice = (indiceActual + 1) % imagenes.length;
        mostrarImagen(nuevoIndice);
      };
      
      // Iniciar el carrusel automático
      const iniciarCarrusel = () => {
        carruselIntervalos[prod.id] = setTimeout(() => {
          siguienteImagen();
          iniciarCarrusel(); // Programar siguiente cambio
        }, 3000); // Cambiar cada 3 segundos
      };
      
      // Iniciar el carrusel
      iniciarCarrusel();
      
      // Pausar carrusel al hacer hover
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
function abrirModalProducto(categoriaId, productoId) {
  const cat = data.categorias.find(c => c.id === categoriaId);
  if (!cat) return;
  const prod = cat.productos.find(p => p.id === productoId);
  if (!prod) return;

  productoActual = { ...prod, categoria: categoriaId };
  seleccion = {
    medida: null,
    medidaIndex: null,
    cantidad: 1
  };

  inputCantidad.value = 1;
  detalleNombre.textContent = productoActual.nombre;
  detalleDescripcion.textContent = productoActual.descripcion || "";
  detalleImg.src = productoActual.imagen || "img/placeholder.jpg";
  detalleDemora.textContent = productoActual.demora || "Consultar";

  // Medidas
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
      });
      opcionesMedidas.appendChild(chip);
      if (idx === 0) chip.click();
    });
  } else {
    opcionMedidaWrapper.style.display = "none";
    seleccion.medida = null;
  }

  actualizarPrecio();
  productoModal.classList.remove("oculto");
}

// Actualizar precio en el modal
function actualizarPrecio() {
  if (!productoActual) return;

  let precio = 0;

  // Si tiene array de precios y una medida seleccionada
  if (productoActual.precios && productoActual.precios.length > 0 && seleccion.medidaIndex !== null) {
    const precioSeleccionado = productoActual.precios[seleccion.medidaIndex];
    if (typeof precioSeleccionado === 'number') {
      precio = precioSeleccionado;
    }
  }
  // Si tiene precio único
  else if (productoActual.precio && typeof productoActual.precio === 'number') {
    precio = productoActual.precio;
  }

  if (precio > 0) {
    const precioTotal = precio * seleccion.cantidad;
    detallePrecio.textContent = `$${precioTotal.toLocaleString('es-AR')}`;
  } else {
    detallePrecio.textContent = "Consultar";
  }
}

// Event listeners cantidad
btnRestar.addEventListener("click", () => {
  let current = parseInt(inputCantidad.value);
  if (current > 1) {
    inputCantidad.value = current - 1;
    seleccion.cantidad = current - 1;
    actualizarPrecio();
  }
});

btnSumar.addEventListener("click", () => {
  let current = parseInt(inputCantidad.value);
  if (current < 99) {
    inputCantidad.value = current + 1;
    seleccion.cantidad = current + 1;
    actualizarPrecio();
  }
});

inputCantidad.addEventListener("change", (e) => {
  let value = parseInt(e.target.value);
  if (value < 1) e.target.value = 1;
  if (value > 99) e.target.value = 99;
  seleccion.cantidad = parseInt(e.target.value);
  actualizarPrecio();
});

// Agregar al carrito
btnAgregarCarrito.addEventListener("click", () => {
  if (!productoActual) return;

  const precio = calcularPrecioProducto();
  
  const itemCarrito = {
    id: `${productoActual.id}-${seleccion.medidaIndex}`,
    productoId: productoActual.id,
    nombre: productoActual.nombre,
    imagen: productoActual.imagen,
    medida: seleccion.medida || "Sin especificar",
    cantidad: seleccion.cantidad,
    precio: precio,
    precioTotal: precio * seleccion.cantidad
  };

  // Verificar si ya existe en el carrito
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
function calcularPrecioProducto() {
  let precio = 0;
  if (productoActual.precios && productoActual.precios.length > 0 && seleccion.medidaIndex !== null) {
    precio = productoActual.precios[seleccion.medidaIndex];
  } else if (productoActual.precio) {
    precio = productoActual.precio;
  }
  return precio;
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

// Abrir carrito (placeholder para implementar después)
btnCarrito.addEventListener("click", () => {
  if (carrito.length === 0) {
    mostrarNotificacion("El carrito está vacío", "error");
    return;
  }
  alert("El carrito se implementará en la próxima versión. Por ahora puedes contactarnos por WhatsApp.");
});

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