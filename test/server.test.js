import { optionDefinitions } from "../server.mjs";

test("ensures defaults are in descriptions", () => {
    expect(
        optionDefinitions
            .map(def => !def.hasOwnProperty("defaultValue") || Boolean(def.description.match(/\(default: .*\)$/)))
            .every(def => def)
    ).toBeTruthy();
});
