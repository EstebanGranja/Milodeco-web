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

// Número de WhatsApp
const telefonoWhats = "5493547656901";

// Cargar datos del stock.json
async function cargarStock() {
  categoriasContainer.innerHTML = '<div class="cargando">Cargando productos...</div>';
  try {
    const resp = await fetch("stock.json");
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

  categoriasContainer.classList.add("oculto");
  productosContainer.classList.remove("oculto");
  productosContainer.innerHTML = "";

  // Botón volver
  const volver = document.createElement("div");
  volver.className = "producto volver-btn";
  volver.innerHTML = `<h3>← Volver a categorías</h3>`;
  volver.addEventListener("click", () => {
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
    const imgUrl = prod.imagen || "img/placeholder.jpg";

    const precioTexto = calcularPrecioBase(prod);

    div.innerHTML = `
      <div class="imagen-container" data-producto-id="${prod.id}">
        <img src="${imgUrl}" alt="${prod.nombre}" onerror="this.onerror=null;this.src='img/placeholder.jpg'">
      </div>
      <h3>${prod.nombre}</h3>
      <p>${prod.descripcion}</p>
      <div class="producto-info"><strong>${precioTexto}</strong></div>
      <button class="btn-ver">Ver producto</button>
    `;

    div.querySelector(".btn-ver").addEventListener("click", () => abrirModalProducto(cat.id, prod.id));
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