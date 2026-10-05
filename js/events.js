const sections = {
    0: document.getElementById("projects-section"),
    1: document.getElementById("blog-section"),
    2: document.getElementById("music-section"),
    3: document.getElementById("interests-section"),
};



function ul(newIndex) {
    const underline = document.querySelector(".underline");
    if (!underline) return;

    const currentIndex = Number(underline.dataset.index || 0);
    if (newIndex === currentIndex) return;

    // move underline
    underline.style.transform = `translateX(${newIndex * 100}%)`;
    underline.dataset.index = String(newIndex);

    const prevSection = sections[currentIndex];
    const nextSection = sections[newIndex];

    activeSection = nextSection;
    setSectionsHeight();
    setTimeout(setSectionsHeight, 900);


    // animate old section out
    if (prevSection && prevSection !== nextSection) {
        if (currentIndex < newIndex) {
            prevSection.style.transform = "translateX(-100%)";
        } else {
            prevSection.style.transform = "translateX(100%)";
        }
        prevSection.style.visibility = "hidden";
        prevSection.style.opacity = 0;
        prevSection.style.filter = "blur(5px)";
        prevSection.style.transitionDelay = "0ms";
    }

    // animate new section in
    if (nextSection) {
        nextSection.style.visibility = "visible";
        nextSection.style.opacity = 1;
        nextSection.style.filter = "blur(0)";
        nextSection.style.transform = "translateX(0)";
        nextSection.style.transitionDelay = "800ms";
    }
}

const sectionsContainer = document.getElementById("sections");
let activeSection = sections[0];

function setSectionsHeight() {
    if (!sectionsContainer || !activeSection) return;
    sectionsContainer.style.height = `${activeSection.scrollHeight}px`;
}

// keep footer from overlapping when section content changes (blog load, music, etc.)
const sectionResizeObserver = new ResizeObserver(() => {
    // only measure the currently-visible section
    setSectionsHeight();
});

Object.values(sections).forEach((sec) => {
    if (sec) sectionResizeObserver.observe(sec);
});

// initial
setSectionsHeight();

window.addEventListener("resize", setSectionsHeight);

document.getElementById("webring").style.opacity = 1;
