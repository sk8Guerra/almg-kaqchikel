import { access, enrollment } from "@/composition/container";
import {
  DOCUMENT_LABELS,
  InvalidDocumentError,
  SubmissionNotFoundError,
} from "@/modules/enrollment";
import type { DocumentType } from "@/modules/enrollment";

const isDocumentType = (value: string): value is DocumentType =>
  Object.keys(DOCUMENT_LABELS).includes(value);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; type: string }> },
): Promise<Response> {
  await access.authorize("enrollment:download");

  const { id, type } = await params;
  if (!isDocumentType(type)) return new Response("Documento desconocido", { status: 404 });

  try {
    const content = await enrollment.readSubmissionDocument({ submissionId: id, type });

    return new Response(content.body, {
      headers: {
        "content-type": content.contentType,
        "content-length": String(content.sizeBytes),
        "content-disposition": `attachment; filename="${type}-${id}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof SubmissionNotFoundError || error instanceof InvalidDocumentError) {
      return new Response("Documento no encontrado", { status: 404 });
    }
    throw error;
  }
}
