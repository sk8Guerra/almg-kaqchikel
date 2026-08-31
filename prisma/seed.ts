import "dotenv/config";
import { prisma } from "@/composition/prisma";
import { enrollment, geography } from "@/composition/container";
import type { Modality, TemplateCode } from "@/modules/enrollment";

const argumentValue = (name: string): string | undefined =>
  process.argv.find((entry) => entry.startsWith(`--${name}=`))?.split("=")[1];

const hasFlag = (name: string): boolean =>
  process.argv.some((entry) => entry === `--${name}` || entry.startsWith(`--${name}=`));

async function grantAdmin(identityId: string) {
  const user = await prisma.user.findUnique({ where: { identityId } });
  if (!user) {
    console.error(`❌ No profile for ${identityId}. That person must sign in once first.`);
    process.exitCode = 1;
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  console.log(`✅ admin role granted to ${user.email}`);
}

async function syncCatalogues() {
  const departments = await geography.listDepartments();
  const municipalities = await geography.listMunicipalities();
  console.log(
    `ℹ️  geografía en código: ${departments.length} departamentos, ${municipalities.length} municipios`,
  );

  const templates = await enrollment.syncFormTemplates();
  console.log(`✅ formularios: ${templates.synced} plantillas`);
}

async function createDemoOffering(municipalityCode: string) {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", status: "ACTIVE" } });
  if (!admin) {
    console.error("❌ No hay administradores. Corre primero --admin=<identityId>.");
    process.exitCode = 1;
    return;
  }

  const municipalities = await geography.listMunicipalities();
  const municipality = municipalities.find((candidate) => candidate.code === municipalityCode);
  if (!municipality) {
    console.error(`❌ Municipio ${municipalityCode} no está en el catálogo.`);
    process.exitCode = 1;
    return;
  }

  const now = new Date();
  const templateCode: TemplateCode = "l2-principiante";
  const modality: Modality = "virtual";

  const existing = await enrollment.listOfferings({ year: now.getFullYear(), templateCode });
  const alreadyThere = existing.find(
    (offering) => offering.municipalityCode === municipality.code && offering.modality === modality,
  );
  if (alreadyThere) {
    console.log(`ℹ️  La convocatoria de demostración ya existe: ${alreadyThere.id}`);
    return;
  }

  const offering = await enrollment.createOffering({
    templateCode,
    year: now.getFullYear(),
    municipalityCode: municipality.code,
    modality,
    opensAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    closesAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    classesStartOn: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
    scheduleLabel: "Martes de 14:00 a 16:30 horas",
    createdById: admin.id,
  });

  console.log(`✅ convocatoria de demostración abierta en ${municipality.name}: ${offering.id}`);
}

async function main() {
  await syncCatalogues();

  const identity = argumentValue("admin");
  if (identity) await grantAdmin(identity);

  if (hasFlag("demo-offering")) {
    await createDemoOffering(argumentValue("demo-offering") ?? "0406");
  }

  if (!identity && !hasFlag("demo-offering")) {
    console.log(
      "ℹ️  Sin --admin=<identityId> ni --demo-offering: solo se sincronizaron catálogos.",
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
