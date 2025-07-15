import StructuredObjectStore from "#shared/structuredObjectStore.mjs";

test("add and update single structured object", () => {
    const sos = new StructuredObjectStore();
    sos.update({
        type: StructuredObjectStore.UpdateType.Replace,
        name: "Test",
        events: [],
        structure: {},
        data: {
            number: 9,
            string: "HI",
            boolean: false,
        },
    });
    expect(sos.getObject("Test")).toEqual({
        number: 9,
        string: "HI",
        boolean: false,
    });
    sos.update({
        type: StructuredObjectStore.UpdateType.Update,
        name: "Test",
        events: [],
        updates: {
            string: "B",
        },
    });
    expect(sos.getObject("Test")).toEqual({
        number: 9,
        string: "B",
        boolean: false,
    });
});

test("add, replace, then update single structured object with events", () => {
    let emittedEvents = [];
    const sos = new StructuredObjectStore(
        () => {},
        (...events) => emittedEvents.push(...events)
    );
    sos.update({
        type: StructuredObjectStore.UpdateType.Replace,
        name: "Test",
        events: ["MyEvent"],
        structure: {
            hi: {},
        },
        data: {
            number: 9,
            string: "HI",
            boolean: false,
            hi: {
                1: "1",
                2: "2",
            },
        },
    });
    expect(sos.getObject("Test")).toEqual({
        number: 9,
        string: "HI",
        boolean: false,
        hi: {
            1: "1",
            2: "2",
        },
    });
    expect(emittedEvents).toEqual(["MyEvent"]);
    emittedEvents = [];

    sos.update({
        type: StructuredObjectStore.UpdateType.Replace,
        name: "Test",
        events: ["MyEvent", "AnotherEvent"],
        structure: {
            hi: {},
        },
        data: {
            boolean: true,
            hi: {
                1: "11",
                3: "3",
            },
        },
    });
    expect(sos.getObject("Test")).toEqual({
        boolean: true,
        hi: {
            1: "11",
            3: "3",
        },
    });
    expect(emittedEvents).toEqual(["MyEvent", "AnotherEvent"]);
    emittedEvents = [];

    sos.update({
        type: StructuredObjectStore.UpdateType.Update,
        name: "Test",
        events: [],
        updates: {
            string: "Hi",
            boolean: undefined,
            hi: {
                2: "2",
            },
        },
    });
    expect(sos.getObject("Test")).toEqual({
        string: "Hi",
        boolean: undefined,
        hi: {
            1: "11",
            3: "3",
            2: "2",
        },
    });
    expect(emittedEvents).toEqual([]);
    emittedEvents = [];
});

test("add and update multiple structured objects with events", () => {
    let emittedEvents = [];
    const sos = new StructuredObjectStore(
        () => {},
        (...events) => emittedEvents.push(...events)
    );
    sos.update(
        {
            type: StructuredObjectStore.UpdateType.Replace,
            name: "Test",
            events: ["CreateTest"],
            structure: {},
            data: {
                string: "Hi",
                boolean: undefined,
                hi: {
                    2: "2",
                },
            },
        },
        {
            type: StructuredObjectStore.UpdateType.Replace,
            name: "Test2",
            events: ["CreateTest", "CreateSecondTest"],
            structure: {
                a: {
                    b: {},
                },
            },
            data: {
                a: {
                    b: {
                        number: 9,
                    },
                    extra: [9, "HI", true],
                },
            },
        },
        {
            type: StructuredObjectStore.UpdateType.Update,
            name: "Test",
            events: [],
            updates: {
                string: "New",
                boolean: true,
                hi: {
                    2: "5",
                },
            },
        },
        {
            type: StructuredObjectStore.UpdateType.Replace,
            name: "Test3",
            events: ["4"],
            structure: {},
            data: {},
        },
        {
            type: StructuredObjectStore.UpdateType.Update,
            name: "Test2",
            events: ["1", "2", "4"],
            updates: {
                a: {
                    b: {
                        number: -9,
                    },
                    hi: "Y",
                },
            },
        }
    );
    expect(sos.getObject("Test")).toEqual({
        string: "New",
        boolean: true,
        hi: {
            2: "5",
        },
    });
    expect(sos.getObject("Test2")).toEqual({
        a: {
            b: {
                number: -9,
            },
            extra: [9, "HI", true],
            hi: "Y",
        },
    });
    expect(sos.getObject("Test3")).toEqual({});
    expect(emittedEvents).toEqual(["CreateTest", "CreateTest", "CreateSecondTest", "4", "1", "2", "4"]);
});

test("failure to update non-existent structured object", () => {
    let events = [];
    let logs = [];
    const sos = new StructuredObjectStore(
        (...args) => logs.push(...args),
        (...events) => events.push(...events)
    );
    sos.update({
        type: StructuredObjectStore.UpdateType.Update,
        name: "Test",
        events: ["ShouldNotBeEmitted"],
        updates: {
            string: "Hi",
            boolean: undefined,
            hi: {
                2: "2",
            },
        },
    });
    expect(() => sos.getObject("Test")).toThrow();
    expect(events).toEqual([]);
    events = [];
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.at(0)).toBe("warn");
    logs = [];
});

test("structured object store cloning", () => {
    const sos = new StructuredObjectStore();
    sos.update(
        {
            type: StructuredObjectStore.UpdateType.Replace,
            name: "Test",
            events: ["Hello", "THROW_ERROR"],
            structure: {},
            data: {
                x: 7,
                y: -900,
                z: 98.5,
            },
        },
        {
            type: StructuredObjectStore.UpdateType.Replace,
            name: "Test2",
            events: ["Hello2"],
            structure: {
                nested: {},
            },
            data: {
                val: 9,
                nested: {
                    str: "1",
                    msg: "?",
                },
            },
        }
    );

    const clone = sos.clone();
    expect(clone).toEqual({
        Test: [{}, { x: 7, y: -900, z: 98.5 }, "Hello", "THROW_ERROR"],
        Test2: [
            { nested: {} },
            {
                val: 9,
                nested: {
                    str: "1",
                    msg: "?",
                },
            },
            "Hello2",
        ],
    });
    expect(() => (clone.Test[1].x += 9)).toThrow();
    expect(clone).toEqual({
        Test: [{}, { x: 7, y: -900, z: 98.5 }, "Hello", "THROW_ERROR"],
        Test2: [
            { nested: {} },
            {
                val: 9,
                nested: {
                    str: "1",
                    msg: "?",
                },
            },
            "Hello2",
        ],
    });

    let errorCount = 0;
    let emittedEvents = [];
    const sosClone = new StructuredObjectStore(
        (level, message, err) => {
            if (level === "error" && err.message === "OH NO") {
                ++errorCount;
            }
        },
        (...events) => {
            emittedEvents.push(...events);
            if (events.includes("THROW_ERROR")) {
                throw new Error("OH NO");
            }
        },
        clone
    );
    sosClone.emitEventsAfterConstruction();
    expect(emittedEvents).toEqual(["Hello", "THROW_ERROR", "Hello2"]);
    expect(errorCount).toBe(1);
    expect(sosClone.getObject("Test")).toEqual({ x: 7, y: -900, z: 98.5 });
    expect(sosClone.getObject("Test2")).toEqual({
        val: 9,
        nested: {
            str: "1",
            msg: "?",
        },
    });
    sosClone.update({
        type: StructuredObjectStore.UpdateType.Update,
        name: "Test2",
        events: [],
        updates: {
            nested: {
                hi: 0,
            },
        },
    });
    expect(sosClone.getObject("Test2")).toEqual({
        val: 9,
        nested: {
            str: "1",
            msg: "?",
            hi: 0,
        },
    });
    expect(sos.getObject("Test2")).toEqual({
        val: 9,
        nested: {
            str: "1",
            msg: "?",
        },
    });
});
