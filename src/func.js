const Botode = (() => {
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

		static propALL = Symbol('propALL');

		constructor (coreInstance) {
			this.coreInstance = coreInstance;
		}

		addStorBins(obj, key, handler) {
			let stor2, stor;
			if ( !(stor = this.storBins.get(obj)) )
				this.storBins.set(obj, (new Map()).set( key, (new Set()).add(handler) ));
			else if (stor2 = stor.get(key))
				stor2.add(handler);
			else
				stor.set(key, (new Set()).add(handler));
		}

		createStorRepeat(handler) {
			const stor = Object.create(null);
			stor.sequence = new Map();
			stor.handler = handler;
			//stor.addedStor = addedStor;
			stor.idx = 0;

			return stor;
		}

		addStorRepeat(obj, stor) {
			const st = this.storRepeat.get(obj)
			if (st)
				st.push(stor);
			else
				this.storRepeat.set(obj, [stor]);
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

		replaceStorData(oldKeyObj, keyObj) {
			let stor;
			console.log(oldKeyObj, keyObj);
			if (stor = this.storRepeat.get(oldKeyObj)) {
				this.storRepeat.set(keyObj, stor);
				this.storRepeat.delete(oldKey);
			}

			if (stor = this.storBins.get(oldKeyObj)) {
				this.storBins.set(keyObj, stor);
				this.storBins.delete(oldKeyObj);
			}

			if (stor = this.#__oppBinsStor.get(oldKeyObj)) {
				this.storOppositBins[stor].obj = keyObj;
				this.#__oppBinsStor.set(keyObj, stor);
				this.#__oppBinsStor.delete(oldKeyObj);
			}
		}

		setStorBinsHandler(handler, selfHandler) {
			this.getBeforeHandler = (target, prop, receiver) => {
				let stor2;
				const stor = this.storBins.get(receiver);
				if ( !stor )
					this.storBins.set(receiver, (new Map()).set( prop, (new Set()).add(selfHandler) ));
				else if (stor2 = stor.get(prop))
					stor2.add(selfHandler);
				else
					stor.set(prop, (new Set()).add(selfHandler));
			}

			handler();

			this.getBeforeHandler = () => null;
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
			if (target[prop] != val)
				this.replaceStorData(target[prop], val);
		}

		/**
		 * сеттер прослушиваемых объетов, выполняющийся после присвоения значения
		 * 
		 * @param {any} target "чистый" обрабатываемый объект (см Proxy)
		 * @param {string | any} prop задаваемый ключ объекта
		 * @param {any} val задаваемое значение
		 * @param {any} receiver обрабатываемый прокси-объект
		 */
		setHandler(target, prop, val, receiver, i) {
			let stor = this.storRepeat.get(receiver);
			if (stor) {
				for (const sdata of stor) {
					const node = sdata.sequence.get(prop);
					if ((node) && (val == null)) {
						node.remove();
						--sdata.idx;
						sdata.sequence.delete(prop);
					} else if ((!node) && (val != null)) {
						const snode = sdata.sequence.values().next().value;
						
						const newNode = snode.cloneNode(true);
						this.coreInstance.__binded(newNode, sdata.handler, val, prop, ++sdata.idx, null, receiver);
						snode.parentNode.append(newNode);
					}
				}
			}

			stor = this.storBins.get(receiver);
			let hstor;
			if (stor) {
				if (hstor = stor.get(prop))
					for (const fun of hstor) fun();
			
				if ( hstor = stor.get(__StorAction.propALL) )
					for (const fun of hstor) fun();
			}
		}

		/**
		 * Обработчик события удаления значения из прослушаемого объекта
		 * 
		 * @param {any} target "чистый" обрабатываемый объект (см Proxy)
		 * @param {string | any} prop задаваемый ключ объекта
		 * @param {any} receiver обрабатываемый прокси-объект
		 */
		delHandler(target, prop, receiver) {
			console.log('DEL', prop);
			let stor = this.storRepeat.get(receiver);
			if (stor) {
				for (const sdata of stor) {
					const node = sdata.sequence.get(prop);
					if (node) {
						node.remove();
						--sdata.idx;
						sdata.sequence.delete(prop);
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
		getBeforeHandler(target, prop, receiver) {

		}
	}

	/**
	 * Класс осуществляющий оборачивание объекта в прокси
	 * 
	 * @class
	 */
	class __Proxymer {
		#backTrace = new (class {
			#current = Object.create(null);
			#before = Object.create(null);

			add(target, prop, receiver) {
				if ((!this.#before.target) || (this.#current === receiver)) {
					this.#before = this.#current

					this.#current = Object.create(null);
					this.#current.target = target;
					this.#current.prop = prop;
					this.#current.receiver = receiver;
				}
			}

			call(storAct) {
				const before = this.#before;
				if (before.target) {
					storAct.setBeforeHandler(before.target, before.prop, before.target[before.prop], before.receiver);
					storAct.setHandler(before.target, before.prop, before.target[before.prop], before.receiver, true);
				}
				this.clear();
			}

			clear() {
				this.#before = this.#current = Object.create(null);
			}
		})();

		/**
		 * @constructs
		 * @param {__StorAction} storAct 
		 */
		constructor(storAct) {
			this.proxysSections = new WeakSet();
			this.__storAct = storAct;
		}

		/**
		 * Создаёт прокси прослушку для объекта
		 * 
		 * @param {any} obj Объект для установки прокси
		 * @returns Proxy
		 */
		build (obj, ) {
			const proxy = new Proxy(obj, this);
			this.proxysSections.add(proxy);
			return proxy;
		}

		/**
		 * Геттер прокси
		 * 
		 */
		get (target, prop, receiver) {
			if (!prop in target.__proto__)
				return Reflect.get(target, prop, receiver);

			let val = target[prop];

			if (val instanceof Object) {
				if (!this.proxysSections.has(val)) {
					const newVal = this.build(val);
					this.__storAct.replaceStorData(val, newVal);
					target[prop] = newVal;
					console.log("GET", prop);
					
				}

				this.#backTrace.add(target, prop, receiver);
			}

			this.__storAct.getBeforeHandler(target, prop, receiver);

			const reflect = Reflect.get(target, prop, receiver);

			return reflect;
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
		set (target, prop, val, receiver, deep) {console.log('SET!!',deep, prop, val);
			const needRecurse = val instanceof Object;
			
			if ((needRecurse) && (!this.proxysSections.has(val)))
				val = this.build(val);

			if (!deep) this.__storAct.setBeforeHandler(target, prop, val, receiver);
			
			const reflect = deep ? null : Reflect.set(target, prop, val, receiver);

			if (needRecurse) for (const k in val)
				this.set(target[prop], k, val[k], receiver[prop], true);

			if (!deep) {
				this.#backTrace.call(this.__storAct);
				
				this.__storAct.setHandler(target, prop, val, receiver);
			}

			return reflect;
		}

		/**
		 * Обработсик удаления значения из прокси-обертки
		 */
		deleteProperty (target, prop) {
			this.#backTrace.clear();

			const storObj = this.proxysSections.get(target);
			if ((storObj) && (storObj.has(prop))) {
				storObj.delete(prop)
				if (!storObj.size) storObj.delete(target);
			};

			this.__storAct.delHandler(target, prop, proxy);
			
			return Reflect.deleteProperty(target, prop);
		}
	}

	/**
	 * Основной класс
	 * 
	 * @class
	 */
	class __Core {
		/**
		 * @construct
		 * @param {*} obj объект с данными
		 */
		constructor(obj) {
			this.source = obj;

			this.__storAct = new __StorAction(this);
			this.__proxymer = new __Proxymer(this.__storAct);
			this.data = this.__proxymer.build(obj);
		}

		__set(el, handler, v, k, i, addedStor, obj, observeObj) {
			return this.__binded(el, handler, v, k, i, addedStor, obj, true, null, observeObj);
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
		 * @param {boolean} NOToppositBin флаг, использовать ли обратное связывание
		 * @param {function} bindedOppositHandler отдельная ф-ция для обратного связывания
		 * @todo Удалить аргумент v, переименовать addedStor
		 */
		__binded(el, handler, v, k, i, addedStor, obj, NOToppositBin, bindedOppositHandler, observeObj) {
			const node = (el instanceof HTMLElement) ? el : document.querySelector(el);
			
			const data = () => {
				if (!(addedStor?.length)) return this.data;

				let stack = this.data;
				for (const key of addedStor)
					stack = stack[g[1]];

				stack = stack[k]
				return stack;
			};

			let stack = [];

			const selfHandler = () => this.__storAct.setStorBinsHandler(() => handler(node, data(), k, i), selfHandler);
			const lastObj = Object.create(null);
			
			// переопределяем геттер
			this.__storAct.getBeforeHandler = (target, prop, receiver) => {
				this.__storAct.addStorBins(observeObj || receiver, observeObj ? __StorAction.propALL : prop, selfHandler);

				if (!NOToppositBin) {
					lastObj.obj = receiver;
					lastObj.nameProp = prop;
				}
			};

			if (addedStor?.length) for (const av of addedStor)
				this.__storAct.getBeforeHandler(null, av[1], av[0]);

			if (obj) this.__storAct.getBeforeHandler(null, k, obj);

			const proxyEl = sobj => NOToppositBin ? sobj : new Proxy(Object.create(null), {
				get(target, prop, receiver) {
					sobj = stack.reduce((acc, el) => acc[el], sobj);
					stack.push(prop);	
					return sobj[prop] instanceof Object ? proxyEl(sobj[prop]) : sobj[prop];
				},

				set(target, prop, val, receiver) {
					stack.push(prop);
					sobj[prop] = val;
					return true;
				}
			});

			handler(proxyEl(node), data(), k, i);

			// сбрасываем геттер
			this.__storAct.getBeforeHandler = () => null;

			if (!NOToppositBin) {
				lastObj.node = node;
				const key = this.__storAct.addOppositBin(lastObj.obj, lastObj.nameProp);

				bindedOppositHandler = bindedOppositHandler || (event => this.__storAct.storOppositBins[key](stack.reduce((acc, el) => acc[el], event.target)));
				
				node.addEventListener('input', bindedOppositHandler);
			}
		}

		/**
		 * метод для двустороннего связывания и иетерации DOM элементов по объекту данных
		 * 
		 * @param {string | HTMLElement} els DOM элемент или его CSS селектор
		 * @param {function} objH функция возвращающая путь до целевого объекта в структуре основного объекта танных
		 * @param {function} methods метод этого же класса для связывания данных с DOM элементом
		 * @param {function} handler функция определяющяя связывание и иетерацию DOM элементов от данных 
		 */
		__repeat(els, data, methods, handler, noStor) {
			const node = (els instanceof HTMLElement) ? els : document.querySelector(els);
				
			const obj = data || this.data;
			
			const stor = this.__storAct.createStorRepeat(handler);
			
			let i = 0, newNode;
			for (const k in obj) {
				newNode = node.cloneNode(true);
				methods.call(this, newNode, handler, obj[k], k, ++i, null, obj);
				node.parentNode.append(newNode);

				stor.sequence.set(k, newNode);
			}

			if (i)
				this.__storAct.addStorRepeat(obj, stor);

			node.remove();
		}
	}

	const bindedMethodsName = Object.create(null);
	bindedMethodsName['binded'] = __Core.prototype.__binded;
	bindedMethodsName['set'] = __Core.prototype.__set;

	const createRepeater = (querySelector, instanceClass, data) => {
		const obj = Object.create(null);

		for (const name in bindedMethodsName)
			obj[name] = handler => instanceClass.__repeat.call(instanceClass, querySelector, data, bindedMethodsName[name], handler);

		return obj;
	};

	return class {
		#owner;

		constructor(...args) {
			this.#owner = new __Core(...args);
			this.data = this.#owner.data;
			this.source = this.#owner.source;
		}

		bind(querySelector, handler, oppositHandler, observeObj) {
			if ((oppositHandler) && (typeof oppositHandler != 'function'))
				observeObj = oppositHandler;

			this.#owner.__binded(querySelector, handler, null, null, null, null, null, null, oppositHandler, observeObj);
		}

		set(querySelector, handler, observeObj) {
			this.#owner.__set(querySelector, handler, observeObj, null, null, null, null, observeObj);
		}

		repeat(querySelector, data) {
			return createRepeater(querySelector, this.#owner, data);
		}

		getOwner() {
			return this.#owner;
		}
	}
})();