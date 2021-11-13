const scriptElement = document.createElement("script");
scriptElement.setAttribute("type", "text/javascript");
scriptElement.setAttribute("src", chrome.runtime.getURL("/extensions.js"));
document.body.appendChild(scriptElement);