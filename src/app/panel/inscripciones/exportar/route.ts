import { access, enrollment } from "@/composition/container";
import { isTemplateCode } from "@/modules/enrollment";

const BOM = "﻿";

const escapeCell = (value: string): string => `"${value.replace(/"/g, '""')}"`;

const toCsv = (headers: string[], rows: string[][]): string =>
  [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");

export async function GET(request: Request): Promise<Response> {
  await access.authorize("enrollment:read");

  const params = new URL(request.url).searchParams;
  const year = params.get("anio") ? Number(params.get("anio")) : undefined;
  const course = params.get("curso");

  const { headers, rows } = await enrollment.exportSubmissions({
    offeringId: params.get("convocatoria") ?? undefined,
    templateCode: course && isTemplateCode(course) ? course : undefined,
    year: Number.isFinite(year) ? year : undefined,
    search: params.get("q") ?? undefined,
  });

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(`${BOM}${toCsv(headers, rows)}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="inscripciones-${stamp}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
