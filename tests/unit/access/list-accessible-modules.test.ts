import { beforeEach, describe, expect, it } from "vitest";
import { listAccessibleModules } from "@/modules/access/application/use-cases/list-accessible-modules";
import { MODULES } from "@/modules/access/domain/modules";
import type { ModuleKey } from "@/modules/access/domain/modules";
import { identityId } from "@/modules/access/domain/values";
import {
  InMemoryUserRepository,
  StubIdentityProvider,
  aUser,
  anAdmin,
  anIdentity,
} from "./doubles";

const everyModuleKey = Object.keys(MODULES) as ModuleKey[];

let identity: StubIdentityProvider;
let users: InMemoryUserRepository;

const run = () => listAccessibleModules({ identity, users })();

beforeEach(() => {
  identity = new StubIdentityProvider();
  users = new InMemoryUserRepository();
});

describe("listAccessibleModules — la barra lateral muestra solo lo permitido (FR-002)", () => {
  it("un admin recibe todas las areas del catalogo", async () => {
    const person = anAdmin({ identityId: identityId("clerk_admin") });
    users.seed(person);
    identity.set(anIdentity({ identityId: person.identityId }));

    const areas = await run();

    expect(areas.map((area) => area.key)).toEqual(everyModuleKey);
  });

  it("un member recibe solo las areas sobre las que tiene lectura", async () => {
    const person = aUser({ identityId: identityId("clerk_member") });
    users.seed(person, ["access:read"]);
    identity.set(anIdentity({ identityId: person.identityId }));

    const areas = await run();

    expect(areas).toEqual([{ key: "access", label: MODULES.access.label }]);
  });

  it("un member con permisos que no son de lectura no recibe el area", async () => {
    const person = aUser({ identityId: identityId("clerk_writer") });
    users.seed(person, ["enrollment:update"]);
    identity.set(anIdentity({ identityId: person.identityId }));

    expect(await run()).toEqual([]);
  });

  it("un member sin permisos recibe una lista vacia", async () => {
    const person = aUser({ identityId: identityId("clerk_bare") });
    users.seed(person);
    identity.set(anIdentity({ identityId: person.identityId }));

    expect(await run()).toEqual([]);
  });
});

describe("listAccessibleModules — estados sin acceso no lanzan (FR-005)", () => {
  it("una persona desactivada recibe una lista vacia aunque sea admin", async () => {
    const person = anAdmin({ identityId: identityId("clerk_off"), status: "inactive" });
    users.seed(person);
    identity.set(anIdentity({ identityId: person.identityId }));

    expect(await run()).toEqual([]);
  });

  it("sin identidad recibe una lista vacia", async () => {
    identity.set(null);

    expect(await run()).toEqual([]);
  });

  it("una identidad sin persona aprovisionada recibe una lista vacia", async () => {
    identity.set(anIdentity({ identityId: identityId("clerk_ghost") }));

    expect(await run()).toEqual([]);
  });
});

describe("listAccessibleModules — el resultado se deriva del catalogo", () => {
  it("etiqueta cada area con la del catalogo, no con una copia", async () => {
    const person = anAdmin({ identityId: identityId("clerk_admin") });
    users.seed(person);
    identity.set(anIdentity({ identityId: person.identityId }));

    const areas = await run();

    for (const area of areas) {
      expect(area.label).toBe(MODULES[area.key].label);
    }
  });

  it("mantiene el orden entre llamadas consecutivas", async () => {
    const person = anAdmin({ identityId: identityId("clerk_admin") });
    users.seed(person);
    identity.set(anIdentity({ identityId: person.identityId }));

    expect((await run()).map((area) => area.key)).toEqual((await run()).map((area) => area.key));
  });
});
