import "./linktree.scss"

let linkList = document.querySelectorAll(".link")

linkList.forEach((link) => {

    link.innerHTML += "<button class='link-copy-button'><i class=\"fa-solid fa-copy\"></i></button>"


    link.addEventListener("click", () => {
        let hyperLink = link.dataset.link
        window.open(hyperLink, "_blank")
    })

    link.querySelector(".link-copy-button").addEventListener("click", (e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(link.dataset.link)
    });
})

console.log('Memory', navigator.deviceMemory);
console.log('Cores', navigator.hardwareConcurrency);
console.log('Connection', navigator.connection);
console.log(navigator)
console.log('Clipboard', navigator.clipboard.read());