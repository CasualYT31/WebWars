import StructuredObject from "#shared/structuredObject.mjs";

test("simple structured object behavior", () => {
    const so = new StructuredObject(
        {},
        {
            number: 8,
            string: "Hi",
            boolean: true,
            array: [7, 8, 9],
            object: {
                nested: 8,
                lost: "key",
            },
        }
    );
    expect(so.eventsGivenAtConstruction).toEqual([]);
    expect(so.structure).toEqual({});
    expect(so.data).toEqual({
        number: 8,
        string: "Hi",
        boolean: true,
        array: [7, 8, 9],
        object: {
            nested: 8,
            lost: "key",
        },
    });
    so.update({
        number: -5,
        string: "New",
        array: [-1, "Str"],
        newKey: "key",
        object: {
            nested: "4",
        },
    });
    expect(so.structure).toEqual({});
    expect(so.data).toEqual({
        number: -5,
        string: "New",
        boolean: true,
        array: [-1, "Str"],
        newKey: "key",
        object: {
            nested: "4",
        },
    });
});

test("structured object behavior with one level", () => {
    const so = new StructuredObject(
        {
            object: {},
        },
        {
            number: 8,
            string: "Hi",
            boolean: true,
            array: [7, 8, 9],
            object: {
                nested: 8,
                lost: "key",
            },
        }
    );
    expect(so.structure).toEqual({
        object: {},
    });
    expect(so.data).toEqual({
        number: 8,
        string: "Hi",
        boolean: true,
        array: [7, 8, 9],
        object: {
            nested: 8,
            lost: "key",
        },
    });
    so.update({
        number: -5,
        string: "New",
        array: [-1, "Str"],
        newKey: "key",
        object: {
            nested: "4",
        },
    });
    expect(so.structure).toEqual({
        object: {},
    });
    expect(so.data).toEqual({
        number: -5,
        string: "New",
        boolean: true,
        array: [-1, "Str"],
        newKey: "key",
        object: {
            nested: "4",
            lost: "key",
        },
    });
});

test("structured object behavior with multiple levels", () => {
    const structure = {
        map: {
            0: {
                0: {},
                1: {},
                2: {},
            },
            1: {
                0: {},
                1: {},
                2: {},
            },
        },
        ignoredObject: {},
        settings: {
            render: {},
            input: {},
        },
    };
    const data = {
        value: 235,
        map: {
            0: {
                0: {
                    type: "PLAINS",
                    hp: 99,
                    unit: 6,
                },
                1: {
                    type: "PLAINS",
                    hp: 34,
                    unit: undefined,
                },
                2: {
                    type: "ROADS",
                    hp: 99,
                    unit: undefined,
                },
            },
            1: {
                0: {
                    type: "MOUNT",
                    hp: 99,
                    unit: 6,
                },
                1: {
                    type: "CITY",
                    hp: 34,
                    unit: 1,
                },
                2: {
                    type: "HQ",
                    hp: 99,
                    unit: undefined,
                },
            },
        },
        ignoredObject: {
            string: "ABC",
            object: {},
        },
        settings: {
            render: {
                x: 7,
                y: 9,
            },
            input: {
                a: "A",
                b: "B",
                overwritten: {
                    c: "C",
                    d: "D",
                },
            },
            addKeyToThisObject: {},
        },
    };
    const so = new StructuredObject(structure, data);
    expect(so.structure).toEqual(structure);
    expect(so.data).toEqual(data);
    so.update({
        value: 89,
    });
    expect(so.structure).toEqual(structure);
    expect(so.data).toEqual({
        ...data,
        value: 89,
    });
    so.update({
        map: {
            0: {
                0: {
                    hp: 34,
                    unit: undefined,
                },
                3: {
                    new: "object",
                },
            },
            1: {},
        },
        settings: {
            input: {
                a: "A",
                b: "B",
                overwritten: {
                    e: "E",
                },
            },
            addKeyToThisObject: {
                newKey: "must exist",
            },
        },
    });
    expect(so.structure).toEqual(structure);
    expect(so.data).toEqual({
        value: 89,
        map: {
            0: {
                0: {
                    type: "PLAINS",
                    hp: 34,
                    unit: undefined,
                },
                1: {
                    type: "PLAINS",
                    hp: 34,
                    unit: undefined,
                },
                2: {
                    type: "ROADS",
                    hp: 99,
                    unit: undefined,
                },
                3: {
                    new: "object",
                },
            },
            1: {
                0: {
                    type: "MOUNT",
                    hp: 99,
                    unit: 6,
                },
                1: {
                    type: "CITY",
                    hp: 34,
                    unit: 1,
                },
                2: {
                    type: "HQ",
                    hp: 99,
                    unit: undefined,
                },
            },
        },
        ignoredObject: {
            string: "ABC",
            object: {},
        },
        settings: {
            render: {
                x: 7,
                y: 9,
            },
            input: {
                a: "A",
                b: "B",
                overwritten: {
                    e: "E",
                },
            },
            addKeyToThisObject: {
                newKey: "must exist",
            },
        },
    });
});

test("structured object accessors are read-only", () => {
    const structure = {
        map: {
            0: {
                0: {},
                1: {},
                2: {},
            },
            1: {
                0: {},
                1: {},
                2: {},
            },
        },
        ignoredObject: {},
        settings: {
            render: {},
            input: {},
        },
    };
    const data = {
        value: 235,
        map: {
            0: {
                0: {
                    type: "PLAINS",
                    hp: 99,
                    unit: 6,
                },
                1: {
                    type: "PLAINS",
                    hp: 34,
                    unit: undefined,
                },
                2: {
                    type: "ROADS",
                    hp: 99,
                    unit: undefined,
                },
            },
            1: {
                0: {
                    type: "MOUNT",
                    hp: 99,
                    unit: 6,
                },
                1: {
                    type: "CITY",
                    hp: 34,
                    unit: 1,
                },
                2: {
                    type: "HQ",
                    hp: 99,
                    unit: undefined,
                },
            },
        },
        ignoredObject: {
            string: "ABC",
            object: {},
        },
        settings: {
            render: {
                x: 7,
                y: 9,
            },
            input: {
                a: "A",
                b: "B",
                overwritten: {
                    c: "C",
                    d: "D",
                },
            },
            addKeyToThisObject: {},
        },
    };
    const so = new StructuredObject(structure, data);
    expect(so.structure).toEqual(structure);
    expect(so.data).toEqual(data);

    expect(() => (so.structure.map["0"]["0"] = { 0: {} })).toThrow();
    expect(() => (so.data.settings.render.x = 10)).toThrow();
    expect(so.structure).toEqual(structure);
    expect(so.data).toEqual(data);

    expect(() => (so.structure.map["0"] = {})).toThrow();
    so.update({
        map: {
            0: {
                0: {
                    type: "ROAD",
                },
            },
        },
    });
    expect(so.structure).toEqual(structure);
    data.map["0"]["0"].type = "ROAD";
    expect(so.data).toEqual(data);
});

test("structured object events list", () => {
    const so = new StructuredObject({}, { value: 8 }, "NewClient", "LanguageUpdated");
    expect(so.eventsGivenAtConstruction).toEqual(["NewClient", "LanguageUpdated"]);
});
