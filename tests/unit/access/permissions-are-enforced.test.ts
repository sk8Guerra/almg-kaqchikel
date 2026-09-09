import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_PERMISSION_KEYS } from "@/modules/access/domain/modules";

/**
 * Un permiso que se concede y no protege nada es indistinguible de uno que sí, hasta que
 * alguien lo prueba en QA. Este barrido mecánico lo detecta al añadirlo, no después: toda
 * clave del catálogo tiene que comprobarse en alguna parte de la aplicación.
 *
 * Si falla al incorporar un área o una operación, la respuesta no es aflojar el test: es
 * que la clave llegó al catálogo antes que la pantalla que protege.
 */
const APP_DIR = join(process.cwd(), "src/app");

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });

const appSource = sourceFiles(APP_DIR)
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

const isEnforced = (key: string): boolean =>
  new RegExp(String.raw`(?:authorize|can)\("${key}"\)`).test(appSource);

describe("todo permiso concedible protege algo", () => {
  it.each([...ALL_PERMISSION_KEYS])("%s se comprueba en la aplicación", (key) => {
    expect(isEnforced(key)).toBe(true);
  });

  it("no da por buena una clave que nadie comprueba", () => {
    expect(isEnforced("students:delete")).toBe(false);
  });
});
