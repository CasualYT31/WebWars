/**
 * @file clean-up-build.js
 * Removes the license file written by WebPack by prepending it to the output bundle.
 * I don't think it's a good idea to get rid of it completely, but it being in a separate file is annoying.
 */

import { join } from "node:path";
import { readFileSync, rmSync, writeFileSync } from "node:fs";

const licenseFile = join(import.meta.dirname, "public", "dependencies.js.LICENSE.txt");
const bundleFile = join(import.meta.dirname, "public", "dependencies.js");

const licenses = readFileSync(licenseFile);
const bundle = readFileSync(bundleFile);

writeFileSync(bundleFile, licenses + "\n" + bundle);
rmSync(licenseFile);
