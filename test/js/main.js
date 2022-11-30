"use strict"
///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
const app = new Botode({json: {k: [false, true, false], j:[]} });
const data = app.data;

const isJsonString = str => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

const dataViewerElm = document.querySelector('#data-viewer');

// app.bind('#data-editor', (el, data) => {
//         el.value = JSON.stringify(data.json, null, 4);

//     }, event => isJsonString(event.target.value) ? data.json = JSON.parse(event.target.value) : null);

app.set(dataViewerElm, (el, data) => console.log(55, el.value = JSON.stringify(data.json, null, 4)), data.json );

/////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

app.repeat('.txt', data.json).binded((el, obj, k, i) => el.value = k);

setTimeout(x => data.json.k = [9], 2000);