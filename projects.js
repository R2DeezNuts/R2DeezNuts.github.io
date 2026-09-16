const TAGS = {
    autonomous: { label: "robótica autónoma", rgb: "78, 190, 255" },
    classicVision: { label: "visión clásica", rgb: "45, 212, 191" },
    control: { label: "control", rgb: "76, 134, 255" },
    cpp: { label: "c++", rgb: "181, 137, 255" },
    customPcb: { label: "PCB propia", rgb: "34, 197, 94" },
    embedded: { label: "sistemas embebidos", rgb: "255, 132, 76" },
    opencv: { label: "opencv", rgb: "0, 217, 255" },
    pid: { label: "PID", rgb: "214, 255, 64" },
    python: { label: "python", rgb: "90, 160, 255" },
    pytorch: { label: "pytorch", rgb: "244, 114, 182" },
    sensorFusion: { label: "fusión de sensores", rgb: "255, 180, 48" }
};

const PROJECTS = [
    {
        "title": "Jetson Racer — percepción y control de vehículo",
        "subtitle": "Proyecto académico · De la imagen al movimiento",
        "body": "El objetivo era conectar lo que ve la cámara con el movimiento de un vehículo a escala. Implementé la percepción con una red neuronal de segmentación semántica e integré su salida con las órdenes de dirección y aceleración. Trabajé con Python y PyTorch para enlazar el procesamiento de imágenes con el control del vehículo. El código y la demostración permiten ver esa integración sobre la plataforma física.",
        "media": {
            "type": "video",
            "src": "img/video-coche-preview.mp4",
            "poster": "img/video-coche-poster.jpg"
        },
        "tags": [
            "python",
            "pytorch",
            "opencv",
            "control"
        ],
        "links": [
            {
                "label": "Código",
                "href": "https://github.com/R2DeezNuts/jetson-racer",
                "icon": "fab fa-github"
            },
            {
                "label": "Demostración",
                "href": "https://youtu.be/iftXwQ2Pxf0",
                "icon": "fas fa-play-circle",
                "variant": "video"
            }
        ]
    },
    {
        "title": "Sumo Vision — retirada autónoma de obstáculos",
        "subtitle": "Proyecto académico · Visión y decisiones sobre una plataforma reutilizada",
        "body": "Reutilicé el robot sumo como plataforma para un prototipo quitanieves que retirase obstáculos dentro de un área delimitada. Implementé la visión con ESP32-CAM y OpenCV y la conecté con la lógica de decisión y los comandos UDP enviados al robot. El prototipo localizó y retiró obstáculos de forma autónoma. El repositorio recoge el sistema de percepción y control; la demostración muestra su funcionamiento sobre la plataforma física.",
        "media": {
            "type": "video",
            "src": "img/sumo-vision-preview.mp4",
            "poster": "img/sumo-vision-poster.jpg"
        },
        "tags": [
            "python",
            "opencv",
            "embedded",
            "autonomous"
        ],
        "links": [
            {
                "label": "Código",
                "href": "https://github.com/R2DeezNuts/sumo-vision",
                "icon": "fab fa-github"
            },
            {
                "label": "Demostración",
                "href": "img/sumo-vision-preview.mp4",
                "icon": "fas fa-play-circle",
                "variant": "video"
            }
        ]
    },
    {
        "title": "Robot sumo Eggbots — integración y competición",
        "subtitle": "Proyecto en equipo · Primer puesto en el torneo de robots sumo",
        "body": "En este proyecto de competición contribuí al diseño 3D, la PCB, la integración electrónica y el software de control del robot. El trabajo consistió en reunir esos componentes en una plataforma física capaz de participar en combate sumo. Nuestro equipo consiguió el primer puesto en el torneo. La demostración permite ver el robot en competición y acompaña esta descripción de mi contribución. El repositorio de código se mantiene privado.",
        "media": {
            "type": "video",
            "src": "img/combate3-preview.mp4",
            "poster": "img/combate3-poster.jpg"
        },
        "tags": [
            "cpp",
            "embedded",
            "customPcb"
        ],
        "links": [
            {
                "label": "Demostración",
                "href": "https://youtu.be/11dywdyJRuc",
                "icon": "fas fa-play-circle",
                "variant": "video"
            }
        ]
    },
    {
        "title": "Péndulo invertido — control sobre ESP32",
        "subtitle": "Proyecto académico · PID, filtrado y telemetría",
        "body": "El péndulo invertido plantea un problema de control en el que la medición de los sensores alimenta las órdenes al actuador. Implementé un controlador PID sobre ESP32, con filtrado de sensores y telemetría. Añadí una interfaz web para observar el estado y ajustar los parámetros del controlador. El repositorio permite revisar esa implementación. La imagen es un esquema ilustrativo; no se presentan aquí medidas de estabilidad ni una validación experimental cuantificada.",
        "media": {
            "type": "image",
            "src": "img/imagen-pendulo.jpeg",
            "alt": "Esquema ilustrativo del control PID de un péndulo invertido"
        },
        "tags": [
            "cpp",
            "pid",
            "embedded"
        ],
        "links": [
            {
                "label": "Código e interfaz",
                "href": "https://github.com/R2DeezNuts/Pendulo-Invertido",
                "icon": "fab fa-github"
            }
        ]
    },
    {
        "title": "USV — proyecto personal en planteamiento",
        "subtitle": "Concepto · Sin prototipo construido ni resultados de navegación",
        "body": "Estoy planteando un vehículo de superficie no tripulado para explorar aplicaciones de la robótica en el entorno marino. El concepto contempla navegación con piloto automático y telemetría, con visión artificial en una fase posterior. Parte de mi interés por estas aplicaciones y de pruebas básicas previas con ArduPilot en un tanque y un dron. El proyecto está en fase de planteamiento: la imagen es conceptual y el documento recoge objetivos y decisiones pendientes.",
        "media": {
            "type": "image",
            "src": "img/usv-concept.png",
            "alt": "Ilustración conceptual del USV; no representa un prototipo construido"
        },
        "tags": [
            "autonomous",
            "embedded"
        ],
        "links": [
            {
                "label": "Planteamiento del proyecto",
                "href": "usv-proyecto-personal.pdf",
                "icon": "fas fa-file-pdf"
            }
        ]
    }
];

function appendTextElement(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
}

function createExternalLink(link, className) {
    const anchor = document.createElement("a");
    anchor.href = link.href;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    if (className) anchor.className = className;
    if (link.ariaLabel) anchor.setAttribute("aria-label", link.ariaLabel);

    if (link.icon) {
        const icon = document.createElement("i");
        icon.className = link.icon;
        icon.setAttribute("aria-hidden", "true");
        anchor.append(icon, " ");
    }

    anchor.append(link.label);
    return anchor;
}

function createMedia(media) {
    const wrapper = media.href
        ? createExternalLink({ href: media.href, label: "", ariaLabel: media.label }, "video-preview")
        : document.createElement("div");

    if (!media.href) wrapper.className = `${media.type}-preview`;

    if (media.type === "video") {
        const video = document.createElement("video");
        video.className = "project-media";
        video.autoplay = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        video.controls = true;
        video.setAttribute("aria-label", "Demostración del proyecto");
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "metadata";
        if (media.poster) video.poster = media.poster;

        const source = document.createElement("source");
        source.src = media.src;
        source.type = "video/mp4";
        video.append(source);
        wrapper.append(video);
        return wrapper;
    }

    const image = document.createElement("img");
    image.className = "project-image";
    image.src = media.src;
    image.alt = media.alt;
    image.loading = "lazy";
    wrapper.append(image);
    return wrapper;
}

function createTag(tagId) {
    const tag = TAGS[tagId];
    if (!tag) throw new Error(`Unknown project tag: ${tagId}`);

    const element = document.createElement("span");
    element.className = "tech-tag";
    element.style.setProperty("--tag-rgb", tag.rgb);
    element.textContent = tag.label;
    return element;
}

function createProjectCard(project) {
    const card = document.createElement("section");
    card.className = "project-card";

    const header = document.createElement("div");
    header.className = "project-header";
    appendTextElement(header, "h3", "", project.title);
    card.append(header, createMedia(project.media));

    appendTextElement(card, "div", "project-subtitle", project.subtitle);
    appendTextElement(card, "p", "", project.body);

    const stack = document.createElement("div");
    stack.className = "tech-stack";
    stack.append(...project.tags.map(createTag));
    card.append(stack);

    const links = document.createElement("div");
    links.className = "project-links";
    links.append(...project.links.map(link => createExternalLink(link, link.variant === "video" ? "video-link" : "")));
    card.append(links);

    return card;
}

export function renderProjects(container = document.getElementById("project-grid")) {
    if (!container) return;
    container.replaceChildren(...PROJECTS.map(createProjectCard));
}
