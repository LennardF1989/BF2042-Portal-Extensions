const styleElement = document.createElement("style");
styleElement.setAttribute("type", "text/css");

styleElement.innerHTML = `
    .blocklyWidgetDiv .blocklyMenu {
        background: rgb(22, 29, 30);
    }

    .blocklyMenuItem {
        color: #ffffff;
    }

    .blocklyMenuItemDisabled {
        color: #aaaaaa !important;
    }
`;

document.head.appendChild(styleElement);
