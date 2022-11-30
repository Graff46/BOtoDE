
const Local = Object.create(null);
Local.set = array => {
    Local.data = array;
    for (const query in array)
        document.getElementById(query).textContent = array[query][document.location.hash === '#en' ? 'en' : 'ru']; 
};

window.addEventListener('hashchange', e => Local.set(Local.data));