import fs from 'fs';

export let options = {
    key: fs.readFileSync('./backend/ssl/localhost.key'),
    cert: fs.readFileSync('./backend/ssl/localhost.crt'),
    passphrase: "einsbaum"
}

