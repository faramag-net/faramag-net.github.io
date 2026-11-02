/*
 * Productos Santa Rosa
 * Módulo: Galería pública de eventos
 * Las fotografías se agregan manualmente en /imagenes/eventos/.
 * Cada colección puede tener una portada y varias fotografías.
 */
(() => {
  const BASE = "../../../../imagenes/eventos/";

  // Para agregar contenido: crea una carpeta dentro de /imagenes/eventos/
  // y agrega aquí una colección con su portada y su arreglo de fotografías.
  const eventos = [
    {
      id: "estacion-nieves",
      nombre: "Estación de nieves artesanales",
      categoria: "Estaciones",
      descripcion: "Nieves de garrafa para compartir en bodas, cumpleaños y celebraciones.",
      portada: `${BASE}estacion-nieves.jpg`,
      imagenes: [
        { src: `${BASE}estacion-nieves.jpg`, alt: "Estación de nieves artesanales", texto: "Estación de nieves artesanales" },
        { src: `${BASE}nieves-cartel.jpg`, alt: "Nieves artesanales para eventos", texto: "Nieves para compartir" }
      ],
      activo: true
    },
    {
      id: "toppings-preparados",
      nombre: "Toppings y preparados",
      categoria: "Preparados",
      descripcion: "Chamoyadas, nieves preparadas y paletas con cobertura para darle un toque especial a cada antojo.",
      portada: `${BASE}estacion-cartel.jpg`,
      imagenes: [
        { src: `${BASE}estacion-cartel.jpg`, alt: "Montaje de estación para preparados", texto: "Preparados al momento" }
      ],
      activo: true
    },
    {
      id: "bolis-paletas",
      nombre: "Bolis y paletas",
      categoria: "Productos",
      descripcion: "Opciones frutales y gourmet para disfrutar y compartir durante tu celebración.",
      portada: `${BASE}bolis-paletas.jpg`,
      imagenes: [
        { src: `${BASE}bolis-paletas.jpg`, alt: "Variedad de bolis y paletas artesanales", texto: "Bolis y paletas para compartir" }
      ],
      activo: true,
      enlace: "../producto/"
    }
  ];

  const container = document.getElementById("servicios");
  const dialog = document.getElementById("galleryDialog");
  const image = document.getElementById("galleryImage");
  const title = document.getElementById("galleryTitle");
  const caption = document.getElementById("galleryCaption");
  const count = document.getElementById("galleryCount");
  const thumbnails = document.getElementById("galleryThumbnails");
  const prev = document.getElementById("prevPhoto");
  const next = document.getElementById("nextPhoto");
  const close = document.getElementById("closeGallery");

  if (!container || !dialog || !image || !title || !caption || !count || !thumbnails) return;

  let collection = null;
  let index = 0;

  function renderCollections() {
    container.innerHTML = "";
    eventos.filter(item => item.activo && item.imagenes?.length).forEach(item => {
      const card = document.createElement("article");
      card.className = "service-card event-collection-card";

      const media = document.createElement("button");
      media.className = "service-image event-collection-cover";
      media.type = "button";
      media.setAttribute("aria-label", `Abrir fotografías de ${item.nombre}`);
      const img = document.createElement("img");
      img.src = item.portada;
      img.alt = item.nombre;
      img.loading = "lazy";
      img.onerror = () => { img.hidden = true; media.classList.add("image-missing"); };
      media.appendChild(img);

      const content = document.createElement("div");
      content.className = "service-content";
      const category = document.createElement("span");
      category.className = "service-number";
      category.textContent = item.categoria || "SANTA ROSA";
      const heading = document.createElement("h2");
      heading.textContent = item.nombre;
      const description = document.createElement("p");
      description.textContent = item.descripcion || "Conoce esta colección de Santa Rosa.";
      const actions = document.createElement("div");
      actions.className = "inline-links";
      const open = document.createElement("button");
      open.type = "button";
      open.className = "text-link gallery-collection-open";
      open.textContent = `Ver fotografías (${item.imagenes.length}) →`;
      open.addEventListener("click", () => openCollection(item));
      media.addEventListener("click", () => openCollection(item));
      actions.appendChild(open);
      if (item.enlace) {
        const link = document.createElement("a");
        link.className = "text-link";
        link.href = item.enlace;
        link.textContent = "Ver productos →";
        actions.appendChild(link);
      }
      content.append(category, heading, description, actions);
      card.append(media, content);
      container.appendChild(card);
    });
  }

  function renderPhoto() {
    if (!collection || !collection.imagenes.length) return;
    const photo = collection.imagenes[index];
    image.src = photo.src;
    image.alt = photo.alt || collection.nombre;
    caption.textContent = photo.texto || collection.nombre;
    count.textContent = `${index + 1} / ${collection.imagenes.length}`;
    prev.disabled = collection.imagenes.length < 2;
    next.disabled = collection.imagenes.length < 2;
    [...thumbnails.children].forEach((button, i) => {
      button.classList.toggle("active", i === index);
      button.setAttribute("aria-current", i === index ? "true" : "false");
    });
  }

  function openCollection(item) {
    collection = item;
    index = 0;
    title.textContent = item.nombre;
    thumbnails.innerHTML = "";
    item.imagenes.forEach((photo, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-thumb";
      button.setAttribute("aria-label", `Ver fotografía ${i + 1}`);
      const thumb = document.createElement("img");
      thumb.src = photo.src;
      thumb.alt = photo.alt || "";
      thumb.loading = "lazy";
      button.appendChild(thumb);
      button.addEventListener("click", () => { index = i; renderPhoto(); });
      thumbnails.appendChild(button);
    });
    renderPhoto();
    dialog.showModal();
  }

  function move(step) {
    if (!collection || collection.imagenes.length < 2) return;
    index = (index + step + collection.imagenes.length) % collection.imagenes.length;
    renderPhoto();
  }

  prev.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  document.addEventListener("keydown", event => {
    if (!dialog.open) return;
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  });

  renderCollections();
})();
