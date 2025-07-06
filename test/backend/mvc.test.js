import Controller from "#src/mvc/controller.mjs";
import Model from "#src/mvc/model.mjs";

// MARK: Integration Testing

test("integration of models and controller", async () => {
    class TestModel1 extends Model {
        whenTestCommand1(...data) {
            this.testCommandData = data;
            this.event("TestEvent2", ...data);
        }
        onTestEvent1(total) {
            this.testTotal = total;
        }
        whenTestEntry(...data) {
            this.whenTestCommand1(...data);
        }
    }

    class TestModel2 extends Model {
        cyclicalCounter = 0;
        whenCyclicalEvent() {
            if (++this.cyclicalCounter < 5) {
                this.event("CyclicalEvent");
            }
        }
        onTestEvent1(total) {
            this.testTotal = total;
        }
        onTestEvent2(...data) {
            this.event(
                "TestEvent1",
                data.reduce((acc, val) => acc + val)
            );
        }
        onCyclicalEvent() {
            this.whenCyclicalEvent();
        }
    }

    const controller = new Controller({
        noServer: true,
        models: [{ model: TestModel1 }, { model: TestModel2 }],
    });
    try {
        const model1 = controller.getModel("TestModel1");
        const model2 = controller.getModel("TestModel2");

        controller.command("TestEntry", 5, 5, 10, 12, -9);
        await new Promise(r => setTimeout(r, 250));
        expect(model1.testCommandData).toEqual([5, 5, 10, 12, -9]);
        expect(model1.testTotal).toEqual(23);
        expect(model2.testTotal).toEqual(23);
        controller.command("TestCommand1", "hi", "hello", "why", "?");
        await new Promise(r => setTimeout(r, 250));
        expect(model1.testCommandData).toEqual(["hi", "hello", "why", "?"]);
        expect(model1.testTotal).toEqual("hihellowhy?");
        expect(model2.testTotal).toEqual("hihellowhy?");
        controller.command("CyclicalEvent");
        await new Promise(r => setTimeout(r, 250));
        expect(model2.cyclicalCounter).toEqual(5);
    } finally {
        controller.stopDispatchingEvents();
    }
});
