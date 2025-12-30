const sections = {
    0: document.getElementById("projects-section"),
    1: document.getElementById("blog-section"),
    2: document.getElementById("photos-section"),
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

function fixdelay(index) {
    const projects = document.querySelectorAll(".project");
    for (let i = index + 1; i < projects.length; i++) {
        projects[i].style["transition-delay"] = `${150 * (i - index - 1)}ms`;
    }
}

function scrollleft() {
    document
        .querySelector(".projects-wrapper")
        .scrollBy({ left: -200, behavior: "smooth" }); // width - overlap
}
function scrollright() {
    document
        .querySelector(".projects-wrapper")
        .scrollBy({ left: 200, behavior: "smooth" }); // width - overlap
}