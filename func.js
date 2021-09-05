'use_strict'

class __StorAction {
	constructor () {
		this.storBins = new Map();
		this.storRepeat2 = new Map();
	}

	setBeforeHandler(target, prop, val, receiver) {
		let stor = this.storRepeat2.get(receiver[prop]);
		if (stor) {
			this.storRepeat2.set(val, stor);
			this.storRepeat2.delete(receiver[prop]);
		}

		stor = this.storBins.get(receiver[prop]);
		if (stor) {
			this.storBins.set(val, stor);
			this.storBins.delete(receiver[prop]);
		}
	}

    setHandler(target, prop, val, receiver) {
		let stor = this.storRepeat2.get(receiver);
		if (stor) {
			for (const sdata of stor) {
				const node = sdata[0].get(prop);
				if ((node) && (val == null)) {
					node.remove();
					--sdata[1][2];
					sdata[0].delete(prop);
				} else if ((!node) && (val != null)) {
					const snode = sdata[0].values().next().value;
					
					const newNode = snode.cloneNode(true);
					this.binded(newNode, sdata[1], val, prop, ++sdata[3], sdata[2], receiver);
					snode.parentNode.append(newNode);
				}
			}
		}

		stor = this.storBins.get(receiver);
		if ((stor) && (stor = stor.get(prop)))
		  	for (const h of stor) h(this.data);
    }

    delHandler(target, prop, receiver) {
		let stor = this.storRepeat2.get(receiver);
		if (stor) {
			for (const sdata of stor) {
				const node = sdata[0].get(prop);
				if (node) {
					node.remove();
					--sdata[1][2];
					sdata[0].delete(prop);
				}
			}
		}

		stor = this.storBins.get(receiver);
		let storData;
		if ((stor) && (storData = stor.get(prop))) {
			for (const h of storData) h(this.data);
			stor.delete(prop);
		}
		  	
    }

	getHandler(target, prop, receiver) {

	}
}

class __Proxymer { 
	constructor(storAct) {
		this.proxysSections = new Set();

		this.__storAct = storAct;
	}

	build (obj) {
		return new Proxy(obj, this);
	}

	get (target, prop, receiver) {
		if (!(prop in Object.prototype)) {
			const val = target[prop];
			const ps = this.proxysSections;

			if ((val instanceof Object) && (!ps.has(val))) {
				ps.add(target[prop] = this.build(val));	
			}

			this.__storAct.getHandler(target, prop, receiver);
		}
		return Reflect.get(target, prop, receiver);
	}

	set (target, prop, val, receiver, deep) {
		if (val instanceof Object) {

			if (!this.proxysSections.has(val)) {
				val = this.build(val);
				this.proxysSections.add(val);
			}
				
			for (const k in val) {
				this.set(null, k, val[k], receiver[prop], true);
			}
		}

		this.__storAct.setBeforeHandler(target, prop, val, receiver);
		const reflect = deep ? null: Reflect.set(target, prop, val, receiver);

		this.__storAct.setHandler(target, prop, val, receiver);
		return reflect;
	}

	deleteProperty (target, prop) {
		const storObj = this.proxysSections.get(target);
		if ((storObj) && (storObj.has(prop))) {
			storObj.delete(prop)
			if (!storObj.size) storObj.delete(target);
		};

		this.__storAct.delHandler(target, prop, proxy);
		
		return Reflect.deleteProperty(target, prop);
	}
}

class Func {
	constructor(obj) {
		this.source = obj;

		this.__storAct = new __StorAction(this);
		this.__proxymer = new __Proxymer(this.__storAct);
		this.data = this.__proxymer.build(obj);
	}

	binded(els, handler, v, k, i, addedStor, df) {
		const node = (els instanceof HTMLElement) ? els : document.querySelector(els);
		
		const getData = () => {
			if (!(addedStor?.length)) return this.data;

			let stack = this.data;
			for (const g of addedStor)
				stack = stack[g[1]];
			stack = stack[k]
			return stack;
		};

		const hndl = () => handler(node, getData(), k, i);
			this.__storAct.getHandler = (target, prop, receiver) => {
			let stor = this.__storAct.storBins.get(receiver);
			let stor2;
			if (!stor) 
				this.__storAct.storBins.set(receiver, (new Map()).set(prop, [hndl]));
			else if (stor2 = stor.get(prop))
				stor2.push(hndl);
			else
				stor.set(prop, [hndl]);
		};
		if (addedStor?.length) for (const av of addedStor)
			this.__storAct.getHandler(null, av[1], av[0]);
		if (df) this.__storAct.getHandler(null, k, df);
		hndl();
		this.__storAct.getHandler = ()=>null;
	}

	repeat(els, objH, handler, noStor) {
		const node = (els instanceof HTMLElement) ? els : document.querySelector(els);
		let newNode;
		const addedStor = [];
		if ((!noStor) && objH)
			this.__storAct.getHandler = (target, prop, receiver) => addedStor.push([receiver, prop]);
			
		const obj = objH ? objH(this.data) : this.data;
		this.__storAct.getHandler = ()=>null;
		
		const stor = [new Map(), handler, addedStor, 0];
		
		let i = 0;
		for (const k in obj) {
			newNode = node.cloneNode(true);
			this.binded(newNode, handler, obj[k], k, ++i, addedStor, obj);
			node.parentNode.append(newNode);

			stor[0].set(k, newNode);
		}

		if (i) {
			stor[3] = i;
			const gstor = (this.__storAct.storRepeat2.get(obj) || this.__storAct.storRepeat2.set(obj, [])).get(obj);
			gstor.push(stor);
		}
		
		node.remove();
	}
}

