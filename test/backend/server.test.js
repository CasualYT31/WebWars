import { optionDefinitions } from "../../server.mjs";

test("ensure matching defaults are in descriptions", () => {
    optionDefinitions
        .filter(def => def.hasOwnProperty("defaultValue"))
        .forEach(def => {
            const search = def.description.match(/\(default: (.*)\)$/);
            expect(search).toBeTruthy();
            expect(search[1]).toEqual(`${def.defaultValue}`);
        });
});
