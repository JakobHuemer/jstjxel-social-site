import './fortnitestats.scss';

fetch(window.location.hostname + ':3000/api/v1/fortnitestats' + new URLSearchParams({
    user_login: 'SK JstJxel_TTV'
}), {
    method: 'GET',
}).then(res => {
    res.json().then(data => {
        console.log(data);
    });
})