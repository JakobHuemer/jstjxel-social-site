import fs from 'fs';

export let options = {
    key: fs.readFileSync('./backend/ssl/localhost.key'),
    cert: fs.readFileSync('./backend/ssl/localhost.crt'),
    passphrase: "einsbaum"
}

// export let options = {
//     key: fs.readFileSync('./ssl/jstjxel.de_private_key.key'),
//     cert: fs.readFileSync('./ssl/jstjxel.de_ssl_certificate.cer'),
//     ca: fs.readFileSync("./ssl/jstjxel.de_ssl_certificate_INTERMEDIATE.cer")
// }