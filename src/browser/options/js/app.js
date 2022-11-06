const configService = (function () {
    let config = {};

    async function loadConfig() {
        const result = await new Promise((resolve) => {
            chrome.storage.local.get(["config"], function (result) {
                resolve(result.config);
            });
        });

        config = result || {};

        return config;
    }

    function getConfig() {
        return config;
    }

    function saveConfig() {
        chrome.storage.local.set({ "config": config });
    }

    return {
        loadConfig: loadConfig,
        getConfig: getConfig,
        saveConfig: saveConfig
    }
})();

const manifestURLInputElement = document.querySelector("#manifestURLInput");
const versionDropdownElement = document.querySelector("#versionDropdown");

let manifestUrl;
let manifestVersions;

function init() {
    const version = chrome.runtime.getManifest().version;
    document.querySelector("#version").innerHTML = version;

    document.querySelector("#officialManifest").addEventListener("click", async function(e) {
        e.preventDefault();

        manifestUrl = this.href;
        manifestURLInputElement.value = manifestUrl;
        await refreshManifest();

        return false;
    });

    document.querySelector("#refreshManifest").addEventListener("click", refreshManifest);
    document.querySelector("#confirmVersion").addEventListener("click", confirmVersion);

    setTimeout(async function() {
        await asyncInit();
    }, 0);
}

async function asyncInit() {
    config = await configService.loadConfig();
    manifestUrl = config.manifestUrl || "";
    manifestVersions = config.versions || [];
    config.selectedVersion = config.selectedVersion || "";

    manifestURLInputElement.value = manifestUrl;
    await refreshManifest();
    versionDropdownElement.value = config.selectedVersion;
    updateElementValidation(versionDropdownElement, versionDropdownElement.value);

    document.querySelector("#loading").classList.add("d-none");
    document.querySelector("#loaded").classList.remove("d-none");
}

async function refreshManifest() {
    if(!manifestURLInputElement.value) {
        updateElementValidation(manifestURLInputElement, false);
        
        return;
    }

    manifestUrl = manifestURLInputElement.value;

    try {
        const response = await fetch(manifestUrl);
        const data = await response.json();

        manifestVersions = data.versions || {};

        updateElementValidation(manifestURLInputElement, true);

        loadVersions(manifestVersions);
    }
    catch(e) {
        updateElementValidation(manifestURLInputElement, false);

        loadVersions([]);
    }
    
    updateElementValidation(versionDropdownElement, versionDropdownElement.value);
}

function loadVersions(versions) {
    removeAllChildNodes(versionDropdownElement);

    for(const key in versions) {
        const version = versions[key];

        const option = document.createElement("option");
        option.innerText = version.name;
        option.value = key;

        versionDropdownElement.appendChild(option);
    }
}

function confirmVersion() {
    if(!versionDropdownElement.value) {
        return;
    }
    
    const confirmText = `Please review the following information:
- Manifest URL: ${manifestUrl}
- Version: ${manifestVersions[versionDropdownElement.value].name}

Are you sure you want to confirm these changes?`;

    if(!confirm(confirmText)) {
        return;
    }

    let config = configService.getConfig();
    
    config.manifestUrl = manifestUrl;
    config.versions = manifestVersions;
    config.selectedVersion = versionDropdownElement.value;

    configService.saveConfig();
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function updateElementValidation(element, isValid) {
    if(isValid) {
        element.classList.remove("is-invalid");
        element.classList.add("is-valid");
    }
    else {
        element.classList.remove("is-valid");
        element.classList.add("is-invalid");
    }
}

init();