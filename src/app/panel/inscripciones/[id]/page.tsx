import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, Descriptions, Tag } from "antd";
import { access, enrollment } from "@/composition/container";
import {
  BASE_QUESTIONS,
  DOCUMENT_LABELS,
  MODALITY_LABELS,
  SubmissionNotFoundError,
} from "@/modules/enrollment";
import { DownloadButton } from "../download-button";
import styles from "../inscripciones.module.scss";

const dateFormatter = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const kilobytes = (bytes: number): string => `${Math.max(1, Math.round(bytes / 1024))} KB`;

type SubmissionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  await access.authorize("enrollment:read");
  const { id } = await params;

  const submission = await enrollment.getSubmission(id).catch((error: unknown) => {
    if (error instanceof SubmissionNotFoundError) notFound();
    throw error;
  });

  const labelOf = (questionId: string, value: string): string => {
    const question = BASE_QUESTIONS.find((candidate) => candidate.id === questionId);
    const option = question?.options?.find((candidate) => candidate.value === value);
    return option ? `${option.labelKaqchikel} / ${option.labelSpanish}` : value;
  };

  return (
    <div className={styles.detail}>
      <div className={styles.header}>
        <h1 className={styles.title}>{submission.fullName}</h1>
        <Link href="/panel/inscripciones">
          <Button>Volver</Button>
        </Link>
      </div>

      <Card title="Inscripción">
        <Descriptions
          column={1}
          size="small"
          items={[
            { key: "template", label: "Curso", children: submission.templateName },
            {
              key: "offering",
              label: "Convocatoria",
              children: (
                <>
                  {submission.municipalityName} · {submission.year}{" "}
                  <Tag>{MODALITY_LABELS[submission.modality]}</Tag>
                </>
              ),
            },
            { key: "documentId", label: "DPI", children: submission.documentId },
            {
              key: "submittedAt",
              label: "Enviada",
              children: dateFormatter.format(submission.submittedAt),
            },
          ]}
        />
      </Card>

      <Card title="Respuestas">
        <Descriptions
          column={1}
          size="small"
          items={BASE_QUESTIONS.map((question) => {
            const value = submission.answers[question.id] ?? "";
            return {
              key: question.id,
              label: question.labelSpanish,
              children: value === "" ? "—" : labelOf(question.id, value),
            };
          })}
        />
      </Card>

      <Card title="Documentos">
        <Descriptions
          column={1}
          size="small"
          items={submission.documents.map((document) => ({
            key: document.type,
            label: DOCUMENT_LABELS[document.type],
            children: (
              <DownloadButton
                href={`/panel/inscripciones/${submission.id}/documento/${document.type}`}
                label={`Descargar (${kilobytes(document.sizeBytes)})`}
                variant="link"
              />
            ),
          }))}
        />
      </Card>
    </div>
  );
}
