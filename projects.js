const TAGS = {
    autonomous: { label: "autonomous robotics", rgb: "78, 190, 255" },
    classicVision: { label: "classic vision", rgb: "45, 212, 191" },
    control: { label: "control systems", rgb: "76, 134, 255" },
    cpp: { label: "c++", rgb: "181, 137, 255" },
    customPcb: { label: "custom PCB", rgb: "34, 197, 94" },
    embedded: { label: "embedded systems", rgb: "255, 132, 76" },
    opencv: { label: "opencv", rgb: "0, 217, 255" },
    pid: { label: "PID", rgb: "214, 255, 64" },
    python: { label: "python", rgb: "90, 160, 255" },
    pytorch: { label: "pytorch", rgb: "244, 114, 182" },
    sensorFusion: { label: "sensor fusion", rgb: "255, 180, 48" }
};

const PROJECTS = [
    {
        title: "Sumo Battlebot",
        subtitle: "Autonomous competition robot focused on real-time sensing, decision logic and robust embedded control.",
        body: "Autonomous Sumo robot designed to react quickly in a constrained competitive arena. The project combines real-time embedded C++ control, sensor fusion, finite-state behavior, edge detection, opponent tracking and safety handling to turn noisy sensor input into reliable movement strategies such as searching, escaping, recovering and attacking. It highlights low-level robotics work where timing, robustness and clear control logic matter more than raw complexity.",
        media: {
            type: "video",
            src: "img/combate3-preview.mp4",
            poster: "img/combate3-poster.jpg",
            href: "https://youtu.be/11dywdyJRuc",
            label: "Open Sumo demo on YouTube"
        },
        tags: ["embedded", "cpp", "sensorFusion", "autonomous", "customPcb"],
        links: [
            { label: "source", href: "https://github.com/R2DeezNuts/EggBot-Sumo-Battlebot-", icon: "fab fa-github" },
            { label: "video demo", href: "https://youtu.be/11dywdyJRuc", icon: "fas fa-play-circle", variant: "video" }
        ]
    },
    {
        title: "Autonomous Driving with Neural Networks",
        subtitle: "Scaled autonomous vehicle using computer vision and neural perception for lane keeping and obstacle avoidance.",
        body: "Scaled autonomous driving platform built to perceive a track from camera input and convert that perception into steering and throttle decisions. The project brings together Python, PyTorch, OpenCV, semantic segmentation, dataset preparation, mask post-processing, real-time decision logic and embedded communication to create a complete loop from video capture to vehicle control. It demonstrates the full workflow behind applied machine learning in robotics: data, inference, interpretation and actuation.",
        media: {
            type: "video",
            src: "img/video-coche-preview.mp4",
            poster: "img/video-coche-poster.jpg"
        },
        tags: ["autonomous", "python", "pytorch", "opencv", "pid", "embedded"],
        links: [
            { label: "source", href: "https://github.com/R2DeezNuts/jetson-racer", icon: "fab fa-github" },
            { label: "video demo", href: "https://youtu.be/iftXwQ2Pxf0", icon: "fas fa-play-circle", variant: "video" }
        ]
    },
    {
        title: "Inverted Pendulum",
        subtitle: "Closed-loop control project for stabilizing an inherently unstable dynamic system.",
        body: "Inverted pendulum control project focused on stabilizing an inherently unstable mechanical system through closed-loop feedback. It applies real-time embedded control, PID tuning, digital signal filtering, sensor telemetry processing and actuator command generation to continuously estimate the tilt error and correct the system with smooth, precise motor response. The project is a compact example of control engineering, where measurement quality and tuning discipline directly shape physical behavior.",
        media: {
            type: "image",
            src: "img/imagen-pendulo.jpeg",
            alt: "Illustrative diagram of Inverted Pendulum closed-loop PID control system"
        },
        tags: ["control", "pid", "embedded", "cpp", "customPcb"],
        links: [
            { label: "source", href: "https://github.com/R2DeezNuts/Pendulo-Invertido", icon: "fab fa-github" }
        ]
    },
    {
        title: "Vision-Based Sumo Control",
        subtitle: "Computer vision control stack for turning live camera input into autonomous Sumo robot commands.",
        body: "Vision-based control system for extending the Sumo platform with live perception and autonomous command generation. The project combines Python, OpenCV, UDP video streaming, perspective correction, ROI masking, contour-based line and object detection, PID-style steering, manual/automatic modes and a diagnostic dashboard to transform camera frames into safe, rate-limited robot actions. It shows how a robotics system can be structured into perception, decision and command layers while still remaining testable during real hardware runs.",
        media: {
            type: "video",
            src: "img/sumo-vision-preview.mp4",
            poster: "img/sumo-vision-poster.jpg"
        },
        tags: ["embedded", "opencv", "classicVision", "autonomous", "pid", "python", "cpp"],
        links: [
            { label: "source", href: "https://github.com/R2DeezNuts/sumo-vision", icon: "fab fa-github" }
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
        video.autoplay = true;
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
