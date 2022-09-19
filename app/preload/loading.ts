export function appendLoading() {
  const styleContent = `
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9;
  background-color: rgba(255, 255, 255);
}

.lds-dual-ring {
  display: inline-block;
  width: 36px;
  height: 36px;
  padding-top: 3px;
}
.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 28px;
  height: 28px;
  margin: 8px;
  border-radius: 50%;
  border: 2px solid #232323;
  border-color: #232323 transparent #232323 transparent;
  animation: lds-dual-ring 1.2s linear infinite;
}
@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}


@media (prefers-color-scheme: dark) {
  .app-loading-wrap {
    background-color: rgba(26, 26, 26);
    color: rgba(210, 210, 210);
  }

  .lds-dual-ring:after {
    border: 2px solid #989898;
    border-color: #989898 transparent #989898 transparent;
  }

}

    `;
  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");

  oStyle.id = "app-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.id = "app-loading-wrap";
  oDiv.className = "app-loading-wrap";
  oDiv.innerHTML = `
  <div><div class="lds-dual-ring"><div></div><div></div></div> <span style="width: 150px; margin-left: 15px; font-size: 2rem; font-family: sans-serif; font-weight: 100;">PAPERLIB</span> </div>`;

  document.head.appendChild(oStyle);
  document.body.appendChild(oDiv);
}

export function removeLoading() {
  const oStyle = document.getElementById(
    "app-loading-style"
  ) as HTMLStyleElement;
  const oDiv = document.getElementById("app-loading-wrap") as HTMLDivElement;
  try {
    if (oStyle) {
      document.head.removeChild(oStyle);
    }
    if (oDiv) {
      document.body.removeChild(oDiv);
    }
  } catch (e) {
    console.error(e);
  }
}
