
const contenedor = document.getElementById("contenedor");
const loader = document.getElementById("loader");
const mensaje = document.getElementById("mensaje");
const inputBusqueda = document.getElementById("inputBusqueda");
const paginacion = document.getElementById("paginacion");
const modal = document.getElementById("modal");
const filtros = document.querySelectorAll(".btn-filtro");
const volverArriba = document.getElementById("volverArriba");

let razas = [];
let paginaActual = 1;
const porPagina = 12;
let filtroActual = "todos";

async function obtenerRazas() {
  loader.style.display = "flex";
  try {
    const res = await fetch("https://api.thecatapi.com/v1/breeds");
    if (!res.ok) throw new Error("Error en la API");
    razas = await res.json();
    mostrarPaginacion();
    mostrarRazas();
  } catch (error) {
    mensaje.style.display = "flex";
    mensaje.innerHTML = `
      <i class="fas fa-cat"></i>
      <p>Error al cargar los datos. Por favor, intenta de nuevo.</p>
      <button class="btn btn-primario" onclick="obtenerRazas()">
        <i class="fas fa-redo"></i> Reintentar
      </button>
    `;
  } finally {
    setTimeout(() => {
      loader.style.display = "none";
    }, 500);
  }
}

function mostrarRazas(filtradas = razas) {
  contenedor.innerHTML = "";
  mensaje.style.display = "none";

  const valor = inputBusqueda.value.toLowerCase();
  let razasFiltradas = filtradas.filter(r =>
    r.name.toLowerCase().includes(valor) ||
    r.origin.toLowerCase().includes(valor) ||
    r.temperament.toLowerCase().includes(valor)
  );

  const inicio = (paginaActual - 1) * porPagina;
  const fin = inicio + porPagina;
  const razasPagina = razasFiltradas.slice(inicio, fin);

  if (razasPagina.length === 0) {
    mensaje.style.display = "flex";
    mensaje.innerHTML = `
      <i class="fas fa-cat"></i>
      <p>No se encontraron razas que coincidan con tu búsqueda</p>
      <button class="btn btn-primario" onclick="resetearBusqueda()">
        <i class="fas fa-redo"></i> Reiniciar búsqueda
      </button>
    `;
    paginacion.innerHTML = "";
    document.getElementById("paginacionInfo").textContent = "";
    return;
  }

  razasPagina.forEach(raza => {
    const imagenURL = raza.reference_image_id
      ? `https://cdn2.thecatapi.com/images/${raza.reference_image_id}.jpg`
      : "https://via.placeholder.com/400x300?text=Sin+Imagen";

    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-raza";
    tarjeta.innerHTML = `
      <div class="contenedor-imagen">
        <img src="${imagenURL}" alt="${raza.name}" onerror="this.src='https://via.placeholder.com/400x300?text=Sin+Imagen';">
        <div class="favorito" onclick="toggleFavorito(this)">
          <i class="fas fa-heart"></i>
        </div>
      </div>
      <div class="info-raza">
        <div class="nombre-raza"><i class="fas fa-cat"></i> ${raza.name}</div>
        <div class="etiquetas">
          <span class="etiqueta">Origen: ${raza.origin}</span>
          <span class="etiqueta">Vida: ${raza.life_span} años</span>
        </div>
        <div class="acciones">
          <button class="btn btn-primario" onclick='abrirModal(${JSON.stringify(raza)})'>
            Ver más
          </button>
        </div>
      </div>
    `;
    contenedor.appendChild(tarjeta);
  });

  mostrarPaginacion(razasFiltradas.length);
}

function mostrarPaginacion(total = razas.length) {
  paginacion.innerHTML = "";
  const totalPaginas = Math.ceil(total / porPagina);

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "pagina-btn";
    if (i === paginaActual) btn.classList.add("activo");
    btn.onclick = () => {
      paginaActual = i;
      mostrarRazas(filtroActual === "todos" ? razas : razas.filter(raza => filtrarRaza(raza, filtroActual)));
    };
    paginacion.appendChild(btn);
  }

  document.getElementById("paginacionInfo").textContent = totalPaginas > 0 ? `Página ${paginaActual} de ${totalPaginas}` : "";
}

// Constantes para los filtros
const Filtros = {
  PELAJE_LARGO: "pelaje-largo",
  PELAJE_CORTO: "pelaje-corto",
  JUGUETON: "jugueton",
  TRANQUILO: "tranquilo",
  SOCIAL: "social",
};

// Objeto de funciones de filtrado
const filtrosRaza = {
  [Filtros.PELAJE_LARGO]: (raza) =>
    raza.hairless === 0 && raza.short_legs === 0,

  [Filtros.PELAJE_CORTO]: (raza) =>
    raza.hairless === 0 && raza.short_legs === 1,

  [Filtros.JUGUETON]: (raza) =>
    raza.temperament?.toLowerCase().includes("playful"),

  [Filtros.TRANQUILO]: (raza) =>
    raza.temperament?.toLowerCase().includes("calm"),

  [Filtros.SOCIAL]: (raza) =>
    raza.temperament?.toLowerCase().includes("social"),
};

// Función principal que usa el objeto de filtros
function filtrarRaza(raza, filtro) {
  return filtrosRaza[filtro]?.(raza) ?? true;
}


function abrirModal(raza) {
  const imagenURL = raza.reference_image_id
    ? `https://cdn2.thecatapi.com/images/${raza.reference_image_id}.jpg`
    : "https://via.placeholder.com/400x300?text=Sin+Imagen";

  document.getElementById("modalHeader").innerHTML = `
    <img style="height: 600px;" src="${imagenURL}" alt="${raza.name}" onerror="this.src='https://via.placeholder.com/400x300?text=Sin+Imagen';">
    <div class="modal-header-overlay">
      <h2 class="modal-titulo">${raza.name}</h2>
      <p class="modal-subtitulo">${raza.origin} - ${raza.life_span} años</p>
    </div>
    <span class="cerrar-modal" onclick="cerrarModal()">×</span>
  `;
  document.getElementById("modalBody").innerHTML = `
    <div class="modal-seccion">
      <h3 class="modal-seccion-titulo"><i class="fas fa-paw"></i> Descripción</h3>
      <p class="texto">${raza.description}</p>
    </div>
    <div class="modal-seccion">
      <h3 class="modal-seccion-titulo"><i class="fas fa-heart"></i> Temperamento</h3>
      <div class="modal-temperamento">
        ${raza.temperament.split(", ").map(tag => `<span class="tag-temperamento">${tag}</span>`).join("")}
      </div>
    </div>
    <div class="modal-seccion">
      <h3 class="modal-seccion-titulo"><i class="fas fa-info-circle"></i> Características</h3>
      <div class="modal-caracteristicas">
        <div>
          <p><strong class="texto">Adaptabilidad:</strong></p>
          <div class="barra-nivel"><div class="nivel" style="width: ${raza.adaptability * 20}%"></div></div>
        </div>
        <div>
          <p><strong class="texto">Afecto:</strong></p>
          <div class="barra-nivel"><div class="nivel" style="width: ${raza.affection_level * 20}%"></div></div>
        </div>
        <div>
          <p><strong class="texto">Energía:</strong></p>
          <div class="barra-nivel"><div class="nivel" style="width: ${raza.energy_level * 20}%"></div></div>
        </div>
        <div>
          <p><strong class="texto">Inteligencia:</strong></p>
          <div class="barra-nivel"><div class="nivel" style="width: ${raza.intelligence * 20}%"></div></div>
        </div>
      </div>
    </div>
  `;
  modal.style.display = "flex";

  // Configurar botón de compartir
  document.getElementById("btnCompartir").onclick = () => {
    const url = window.location.href;
    const texto = `¡Descubre la raza de gato ${raza.name}! ${url}`;
    if (navigator.share) {
      navigator.share({ title: raza.name, text: texto, url })
        .then(() => mostrarToast("¡Enlace compartido!"))
        .catch(() => mostrarToast("Error al compartir"));
    } else {
      navigator.clipboard.write(texto).then(() => mostrarToast("¡Enlace copiado al portapapeles!"));
    }
  };
}

function cerrarModal() {
  modal.style.display = "none";
}

function toggleFavorito(element) {
  element.classList.toggle("activo");
  mostrarToast(element.classList.contains("activo") ? "Añadido a favoritos" : "Eliminado de favoritos");
}

function mostrarToast(mensajeTexto) {
  const toast = document.getElementById("toast");
  document.getElementById("toastMensaje").textContent = mensajeTexto;
  toast.classList.add("mostrar");
  setTimeout(() => {
    toast.classList.remove("mostrar");
  }, 3000);
}

function resetearBusqueda() {
  inputBusqueda.value = "";
  paginaActual = 1;
  filtroActual = "todos";
  filtros.forEach(b => b.classList.remove("activo"));
  document.querySelector(".btn-filtro[data-filtro='todos']").classList.add("activo");
  mostrarRazas();
}

inputBusqueda.addEventListener("input", () => {
  paginaActual = 1;
  mostrarRazas(filtroActual === "todos" ? razas : razas.filter(raza => filtrarRaza(raza, filtroActual)));
});

filtros.forEach(btn => {
  btn.addEventListener("click", () => {
    filtros.forEach(b => b.classList.remove("activo"));
    btn.classList.add("activo");
    filtroActual = btn.dataset.filtro;
    paginaActual = 1;
    mostrarRazas(filtroActual === "todos" ? razas : razas.filter(raza => filtrarRaza(raza, filtroActual)));
  });
});

window.addEventListener("click", (e) => {
  if (e.target === modal) cerrarModal();
});

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    volverArriba.classList.add("visible");
  } else {
    volverArriba.classList.remove("visible");
  }
});

volverArriba.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

obtenerRazas();