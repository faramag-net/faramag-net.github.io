(() => {
  const fotos = [
    { src: "../../imagenes/eventos/estacion-nieves.jpg", alt: "Estación artesanal de nieves de garrafa", caption: "Estación de nieves artesanales" },
    { src: "../../imagenes/eventos/estacion-cartel.jpg", alt: "Montaje de estación para eventos", caption: "Montaje de estación para eventos" },
    { src: "../../imagenes/eventos/bolis-paletas-variedad.jpg", alt: "Variedad de bolis y paletas artesanales", caption: "Bolis y paletas para compartir" }
  ];
  const dialog = document.getElementById("galleryDialog"), image = document.getElementById("galleryImage"), caption = document.getElementById("galleryCaption"), count = document.getElementById("galleryCount");
  let index = 0;
  function render(){const photo=fotos[index];image.src=photo.src;image.alt=photo.alt;caption.textContent=photo.caption;count.textContent=`${index+1} / ${fotos.length}`;}
  document.getElementById("openGallery").addEventListener("click",()=>{index=0;render();dialog.showModal();});
  document.getElementById("closeGallery").addEventListener("click",()=>dialog.close());
  document.getElementById("prevPhoto").addEventListener("click",()=>{index=(index-1+fotos.length)%fotos.length;render();});
  document.getElementById("nextPhoto").addEventListener("click",()=>{index=(index+1)%fotos.length;render();});
  dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close();});
})();
