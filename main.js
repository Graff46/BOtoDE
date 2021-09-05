"use strict"
///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

//let obj = {io: {h: -1} };
const obj = {io: {l: {f:  {dk:88}, f2:{dk: 77}}, ll: {ff: 888}}, gg: {h: {v: 55}, hh: {vv: 5555}}, t: 'qwe'};

const app = new Func(obj);
const data = app.data;

app.repeat('.li', d=>d.io.l, (el, v, k) => el.innerText = k+': '+(v.dk || 'none'));

//app.binded('.txt', (el, d, k) => el.value = v.io.l.f.dk);

//data.io.l.f3 = {dk: 33}
//delete data.io.l.f2;

setTimeout(() => data.io = {l: {f:  {dk:55}, f2:{dk: 11}}, ll: {ff: 888}}, 2000)
setTimeout(() => data.io.l.f = {dk: 12}, 4000)

