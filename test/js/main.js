"use strict"
///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
/*
const app = new Botode({a:false, b:false });
const data = app.data;
*/

const [app, data] = new Botode({a:false, b:false }).sugar();

const isJsonString = str => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


//const dataViewerElm = document.querySelector('#data-viewer');

// app.bind('#data-editor', (el, data) => {
//         el.value = JSON.stringify(data.json, null, 4);

//     }, event => isJsonString(event.target.value) ? data.json = JSON.parse(event.target.value) : null);

//app.set(dataViewerElm, (el, data) => console.log(55, el.value = JSON.stringify(data.json, null, 4)), data.json );

/////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

//app.repeat('.txt', data.json).binded((el, obj, k, i) => el.value = k);

//setTimeout(x => data.json.k = null, 2000);

app.bind('.checkbox', el => el.checked = data.a, e => data.a ? data.b = false : null);
app.bind('.checkbox2', el => el.checked = data.b, e => data.b ? data.a = false : null);

////////////////////////