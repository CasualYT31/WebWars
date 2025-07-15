import Model from "#src/mvc/model.mjs";

class TestModel extends Model {
    frontEndData(sessionKey) {
        return {
            testing: this.value,
        };
    }

    constructor(controller, value) {
        super(controller);
        this.value = value;
    }
}

/// Test that back-end map pack models work and that they emit their front-end data.
export const models = [{ model: TestModel, arguments: [123] }];
