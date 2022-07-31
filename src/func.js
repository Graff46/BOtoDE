const Func = (() => {
	/**
	 * Класс действий вызываемых прокси при действиях на прослушиваемых объектах
	 * 
	 * @class
	 */
	class __StorAction {
		storBins = new Map();
		storRepeat = new Map();

		storOppositBins = Object.create(null);
		#__oppBinsStor = new Map();

		constructor () {
		
		}

		addOppositBin(obj, propName) {
			const key = Symbol();
			this.#__oppBinsStor.set(obj, key);
			const handler = newValue => handler.obj[handler.propName] = newValue;
			handler.obj = obj;
			handler.propName = propName;
			this.storOppositBins[key] = handler;
			return key;
		}

		/**
		 * сеттер прослушиваемых объетов, выполняющийся до присвоения значения
		 * 
		 * @param {any} target "чистый" обрабатываемый объект (см Proxy)
		 * @param {string | any} prop задаваемый ключ объекта
		 * @param {any} val задаваемое значение
		 * @param {any} receiver обрабатываемый прокси-объект
		 */
		setBeforeHandler(target, prop, val, receiver) {
			let stor = this.storRepeat.get(receiver[prop]);
			if (stor) {
				this.storRepeat.set(val, stor);
				this.storRepeat.delete(receiver[prop]);
			}

			stor = this.storBins.get(receiver[prop]);
			if (stor) {
				this.storBins.set(val, stor);
				this.storBins.delete(receiver[prop]);
			}

			stor = this.#__oppBinsStor.get(receiver[prop]);
			if (stor) {
				this.storOppositBins[stor].obj = val;
				this.#__oppBinsStor.set(val, stor);
				this.#__oppBinsStor.delete(receiver[prop]);
			}
		}

		/**
		 * сеттер прослушиваемых объетов, выполняющийся после присвоения значения
		 * 
		 * @param {any} target "чистый" обрабатываемый объект (см Proxy)
		 * @param {string | any} prop задаваемый ключ объекта
		 * @param {any} val задаваемое значение
		 * @param {any} receiver обрабатываемый прокси-объект
		 */
		setHandler(target, prop, val, receiver) {
			let stor = this.storRepeat.get(receiver);
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
				for (const fun of stor) fun(this.data);
		}

		/**
		 * Обработчик события удаления значения из прослушаемого объекта
		 * 
		 * @param {any} target "чистый" обрабатываемый объект (см Proxy)
		 * @param {string | any} prop задаваемый ключ объекта
		 * @param {any} receiver обрабатываемый прокси-объект
		 */
		delHandler(target, prop, receiver) {
			let stor = this.storRepeat.get(receiver);
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
				for (const handler of storData) handler(this.data);
				stor.delete(prop);
			}
		}

		/**
		 * (отложенный) геттер прослушиваемых объетов, может быть переопределен в коде
		 * 
		 * @param {any} target "чистый" обрабатываемый объект (см Proxy)
		 * @param {string | any} prop задаваемый ключ объекта
		 * @param {any} receiver обрабатываемый прокси-объект
		 */
		getHandler(target, prop, receiver) {

		}
	}

	class __Proxymer { 
		/**
		 * Класс осуществляющий оборачивание объекта в прокси
		 * 
		 * @param {__StorAction} storAct 
		 */
		constructor(storAct) {
			this.proxysSections = new Set();

			this.__storAct = storAct;
		}

		/**
		 * Создаёт прокси прослушку для объекта
		 * 
		 * @param {any} obj Объект для установки прокси
		 * @returns 
		 */
		build (obj) {
			return new Proxy(obj, this);
		}

		/**
		 * Геттер прокси
		 * 
		 */
		get (target, prop, receiver) {
			if (!(prop in Object.prototype)) {
				const val = target[prop];

				if ((val instanceof Object) && (!this.proxysSections.has(val))) {
					this.proxysSections.add(target[prop] = this.build(val));	
				}

				this.__storAct.getHandler(target, prop, receiver);
			}
			return Reflect.get(target, prop, receiver);
		}

		/**
		 * Сеттер прокси
		 * 
		 * @param {*} target 
		 * @param {*} prop 
		 * @param {*} val 
		 * @param {*} receiver 
		 * @param {boolean} deep рекурсивный ли заход в функцию 
		 * @returns 
		 */
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

		/**
		 * Обработсик удаления значения из прокси-обертки
		 */
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

	class Core {
		/**
		 * Основной класс
		 * 
		 * @param {*} obj объект с данными
		 */
		constructor(obj) {
			this.source = obj;

			this.__storAct = new __StorAction(this);
			this.__proxymer = new __Proxymer(this.__storAct);
			this.data = this.__proxymer.build(obj);
		}

		/**
		 * метод для двустороннего связывания прокси-объекта с DOM
		 * 
		 * @param {string | HTMLElement} el DOM элемент или его CSS селектор
		 * @param {function} handler функция связывания объекта с DOM
		 * @param {any} v TODO Удалить
		 * @param {string | any} k ключ (поле) объекта
		 * @param {number} i счетчик ключей
		 * @param {Array} addedStor массив ключей (полей) до целевого значения в главном объекте данных
		 * @param {any} obj объект данных
		 * @todo Удалить аргумент v, переименовать addedStor
		 */
		__binded(el, handler, v, k, i, addedStor, obj) {
			const node = (el instanceof HTMLElement) ? el : document.querySelector(el);
			
			const getData = () => {
				if (!(addedStor?.length)) return this.data;

				let stack = this.data;
				for (const g of addedStor)
					stack = stack[g[1]];

				stack = stack[k]
				return stack;
			};

			let stack = [];
			const proxyEl = sobj => new Proxy(Object.create(null), {
				get(target, prop, receiver) {
					sobj = stack.reduce((akk, el) => akk[el], sobj);
					stack.push(prop);	
					return sobj[prop] instanceof Object ? proxyEl(sobj[prop]) : sobj[prop];
				},

				set(target, prop, val, receiver) {
					stack.push(prop);
					sobj[prop] = val;
					return true;
				}
			});

			const data = getData();
			const hndl = () => handler(node, data, k, i);
			let lastObj = Object.create(null);
			
			// переопределяем геттер
			this.__storAct.getHandler = (target, prop, receiver) => {
				let stor2, stor ;
				if (!(stor = this.__storAct.storBins.get(receiver)) )
					this.__storAct.storBins.set(receiver, (new Map()).set(prop, [hndl]));
				else if (stor2 = stor.get(prop))
					stor2.push(hndl);
				else
					stor.set(prop, [hndl]);

				lastObj.obj = receiver;
				lastObj.nameProp = prop;
			};

			if (addedStor?.length) for (const av of addedStor)
				this.__storAct.getHandler(null, av[1], av[0]);

			if (obj) this.__storAct.getHandler(null, k, obj);

			handler(proxyEl(node), data, k, i);

			// сбрасываем геттер
			this.__storAct.getHandler = () => null;
			lastObj.node = node;
			const key = this.__storAct.addOppositBin(lastObj.obj, lastObj.nameProp);
			
			node.addEventListener('input', event => this.__storAct.storOppositBins[key](stack.reduce((acc, el) => acc[el], event.target)));
		}

		/**
		 * метод для двустороннего связывания и иетерации DOM элементов по объекту данных
		 * 
		 * @param {string | HTMLElement} els DOM элемент или его CSS селектор
		 * @param {function} objH функция возвращающая путь до целевого объекта в структуре основного объекта танных
		 * @param {function} handler функция определяющяя связывание и иетерацию DOM элементов от данных 
		 * @param {boolean} noStor не записывать операцию в реестр операций
		 */
		__repeat(els, objH, handler, noStor) {
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
				const gstor = (this.__storAct.storRepeat.get(obj) || this.__storAct.storRepeat.set(obj, [])).get(obj);
				gstor.push(stor);
			}
			
			node.remove();
		}
	}

	return class Func extends Core {
		binded(querySelector, handler) {
			return this.__binded(querySelector, handler);
		}

		repeat() {
			return this.__repeat();
		}
	};
})();