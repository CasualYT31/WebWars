import Model from "#src/mvc/model.mjs";

class TestModel2 extends Model {
    frontEndData(sessionKey) {
        return {
            sessionKey: sessionKey,
        };
    }
}

/// Test that back-end map pack models work and that they emit their front-end data.
/// Also make sure the first TestModel is removed by the time this one is added to the front end.
export const models = [{ model: TestModel2 }];
