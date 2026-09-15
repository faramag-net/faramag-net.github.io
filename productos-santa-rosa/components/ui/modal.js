export function openModal(content){

    const modal =
        document.createElement("div");

    modal.className = "modal-overlay";

    modal.innerHTML = `

        <div class="modal-content">

            <button
                class="modal-close"
            >
                ✖
            </button>

            ${content}

        </div>

    `;

    document.body.appendChild(modal);

    modal
    .querySelector(".modal-close")
    .onclick = () => {

        modal.remove();
    };
}
