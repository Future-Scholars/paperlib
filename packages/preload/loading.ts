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

.lds-ripple {
  display: inline-block;
  position: relative;
  width: 38px;
  height: 38px;
  top: 4px;
}
.lds-ripple div {
  position: absolute;
  border: 4px solid #000;
  opacity: 1;
  border-radius: 50%;
  animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
}
.lds-ripple div:nth-child(2) {
  animation-delay: -0.5s;
}
@keyframes lds-ripple {
  0% {
    top: 19px;
    left: 19px;
    width: 0;
    height: 0;
    opacity: 0;
  }
  4.9% {
    top: 19px;
    left: 19px;
    width: 0;
    height: 0;
    opacity: 0;
  }
  5% {
    top: 19px;
    left: 19px;
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    top: 0px;
    left: 0px;
    width: 38px;
    height: 38px;
    opacity: 0;
  }
}

@media (prefers-color-scheme: dark) {
  .app-loading-wrap {
    background-color: rgba(26, 26, 26);
    color: rgba(210, 210, 210);
  }

  .lds-ripple div {
    border: 4px solid rgba(200, 200, 200);
  }

}



    `;
  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");

  oStyle.id = "app-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.id = "app-loading-wrap";
  oDiv.className = "app-loading-wrap";
  oDiv.innerHTML = `<div><div class="lds-ripple"><div></div><div></div></div> <span style="width: 150px; margin-left: 15px; font-size: 2rem; font-family: sans-serif; font-weight: 100">PAPERLIB</span> </div>`;

  document.head.appendChild(oStyle);
  document.body.appendChild(oDiv);
}

export function removeLoading() {}
