import { resolve } from "path";
export default {
    entry: resolve(import.meta.dirname, "src", "frontEndDependencies.mjs"),
    mode: "production",
    output: {
        filename: "dependencies.js",
        path: resolve(import.meta.dirname, "public"),
    },
};
