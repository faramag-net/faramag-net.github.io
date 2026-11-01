const modal = document.getElementById("modalArtesanales");
const abrir = document.getElementById("abrirArtesanales");
const cerrar = document.getElementById("cerrarArtesanales");

function cerrarModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-abierto");
  abrir.focus();
}
abrir.addEventListener("click", () => {
  modal.hidden = false;
  document.body.classList.add("modal-abierto");
  cerrar.focus();
});
cerrar.addEventListener("click", cerrarModal);
modal.addEventListener("click", event => {
  if (event.target === modal) cerrarModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modal.hidden) cerrarModal();
});
