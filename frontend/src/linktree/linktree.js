import "./linktree.scss"

let links = document.querySelectorAll(".link")

links.forEach((link) => {
    link.addEventListener("click", () => {
        let hyperLink = link.dataset.link
        window.open(hyperLink, "_blank")
    })
})