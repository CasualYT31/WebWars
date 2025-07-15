import { deepFreeze, getAllPropertyNames } from "#shared/utils.mjs";

test("deep freezing", () => {
    const object = {
        number: 7,
        nullObject: null,
        array: [2, 7, 8],
        object: {
            nested: "Yes",
            anotherNest: {
                nested: "End",
            },
        },
    };
    const shallowFrozen = Object.freeze(structuredClone(object));
    const deepFrozen = deepFreeze(structuredClone(object));
    expect(shallowFrozen).toEqual(object);
    expect(deepFrozen).toEqual(object);
    expect(shallowFrozen).toEqual(deepFrozen);

    expect(() => (shallowFrozen.number = 0)).toThrow();
    expect(() => (deepFrozen.number = 0)).toThrow();

    expect(() => shallowFrozen.array.push(9)).not.toThrow();
    expect(shallowFrozen).not.toEqual(object);
    expect(() => shallowFrozen.array.pop()).not.toThrow();
    expect(shallowFrozen).toEqual(object);

    expect(() => deepFrozen.array.push(9)).toThrow();
    expect(deepFrozen).toEqual(object);

    expect(() => (shallowFrozen.object.anotherNest.nested = "No End")).not.toThrow();
    expect(shallowFrozen).not.toEqual(object);
    expect(() => (shallowFrozen.object.anotherNest.nested = "End")).not.toThrow();
    expect(shallowFrozen).toEqual(object);

    expect(() => (deepFrozen.object.anotherNest.nested = "No End")).toThrow();
    expect(deepFrozen).toEqual(object);
});

test("getting all property names", () => {
    const everyObjectHas = ["constructor"];
    const objectProperties = [
        "__defineGetter__",
        "__defineSetter__",
        "hasOwnProperty",
        "__lookupGetter__",
        "__lookupSetter__",
        "isPrototypeOf",
        "propertyIsEnumerable",
        "toString",
        "valueOf",
        "__proto__",
        "toLocaleString",
    ];

    class A {
        test() {}
    }
    const a = new A();
    const aProperties = ["test"];
    expect(getAllPropertyNames(a)).toEqual(everyObjectHas.concat(aProperties));
    expect(getAllPropertyNames(a, { includeRootObject: true })).toEqual(
        everyObjectHas.concat(aProperties.concat(objectProperties))
    );

    class B extends A {
        test2() {}
    }
    const b = new B();
    const bProperties = ["test2"];
    expect(getAllPropertyNames(b)).toEqual(everyObjectHas.concat(bProperties.concat(aProperties)));
    expect(getAllPropertyNames(b, { includeRootObject: true })).toEqual(
        everyObjectHas.concat(bProperties.concat(aProperties.concat(objectProperties)))
    );
});
