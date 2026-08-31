"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Divider, Input, Radio, Select, Typography } from "antd";
import type {
  AnswerProblem,
  Answers,
  DocumentType,
  FormTemplateDefinition,
  OfferingView,
  Question,
} from "@/modules/enrollment";
import { DOCUMENT_LABELS, validateAnswers } from "@/modules/enrollment";
import type { Department, Municipality } from "@/modules/geography";
import { DocumentUpload } from "./document-upload";
import { loadMunicipalitiesAction, loadZonesAction, submitEnrollmentAction } from "./actions";
import { rememberSubmission } from "./submitted-marks";
import styles from "./inscripcion.module.scss";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const OTHER_LANGUAGE = "__other__";

type EnrollmentFormProps = {
  offering: OfferingView;
  template: FormTemplateDefinition;
  departments: Department[];
};

const problemText = (problem: AnswerProblem): string =>
  problem.reason === "missing" ? "Esta pregunta es obligatoria." : "Revisa el formato.";

export function EnrollmentForm({ offering, template, departments }: EnrollmentFormProps) {
  const router = useRouter();
  const [draftId] = useState(() => `draft-${crypto.randomUUID()}`);
  const [answers, setAnswers] = useState<Answers>({});
  const [documents, setDocuments] = useState<Partial<Record<DocumentType, string>>>({});
  const [municipalities, setMunicipalities] = useState<Record<string, Municipality[]>>({});
  const [zones, setZones] = useState<Record<string, string[]>>({});
  const [languageMode, setLanguageMode] = useState<Record<string, string>>({});
  const [problems, setProblems] = useState<AnswerProblem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const problemOf = useMemo(
    () => (id: string) => problems.find((problem) => problem.questionId === id),
    [problems],
  );

  const setAnswer = (id: string, value: string) => {
    setAnswers((current) => ({ ...current, [id]: value }));
    setProblems((current) => current.filter((problem) => problem.questionId !== id));
  };

  const chooseDepartment = async (question: Question, departmentCode: string) => {
    setAnswer(question.id, departmentCode);
    const dependent = template.questions.find((candidate) => candidate.dependsOn === question.id);
    if (dependent) setAnswer(dependent.id, "");

    const result = await loadMunicipalitiesAction(departmentCode);
    if (result.ok) setMunicipalities((current) => ({ ...current, [question.id]: result.value }));
  };

  const chooseMunicipality = async (question: Question, municipalityCode: string) => {
    setAnswer(question.id, municipalityCode);
    const dependent = template.questions.find((candidate) => candidate.dependsOn === question.id);
    if (dependent) setAnswer(dependent.id, "");

    const result = await loadZonesAction(municipalityCode);
    if (result.ok) setZones((current) => ({ ...current, [question.id]: result.value }));
  };

  const onUploaded = (type: DocumentType, storageKey: string) =>
    setDocuments((current) => ({ ...current, [type]: storageKey }));

  const missingDocuments = template.documents.filter((type) => !documents[type]);

  const submit = async () => {
    setMessage(null);

    const found = validateAnswers(template, answers);
    if (found.length > 0) {
      setProblems(found);
      setMessage("Faltan respuestas obligatorias o hay datos con formato inválido.");
      return;
    }

    if (missingDocuments.length > 0) {
      setMessage("Faltan documentos por adjuntar.");
      return;
    }

    setSending(true);
    try {
      const result = await submitEnrollmentAction({
        offeringId: offering.id,
        draftId,
        answers,
        documents: template.documents.map((type) => ({ type, key: documents[type] ?? "" })),
      });

      if (!result.ok) {
        setMessage(result.message);
        setProblems(result.problems ?? []);
        return;
      }

      rememberSubmission(offering.id, new Date(result.value.submittedAt));
      router.push(result.value.redirectTo);
    } finally {
      setSending(false);
    }
  };

  const renderControl = (question: Question) => {
    const value = answers[question.id] ?? "";

    switch (question.kind) {
      case "commitment":
      case "choice":
        if ((question.options ?? []).length > 6) {
          return (
            <Select
              value={value || undefined}
              onChange={(next: string) => setAnswer(question.id, next)}
              placeholder="Elige una opción"
              options={(question.options ?? []).map((option) => ({
                value: option.value,
                label: option.labelSpanish,
              }))}
            />
          );
        }
        return (
          <Radio.Group
            value={value}
            onChange={(event) => setAnswer(question.id, String(event.target.value))}
          >
            {(question.options ?? []).map((option) => (
              <Radio key={option.value} value={option.value}>
                {option.labelKaqchikel} / {option.labelSpanish}
              </Radio>
            ))}
          </Radio.Group>
        );

      case "department":
        return (
          <Select
            value={value || undefined}
            onChange={(next: string) => void chooseDepartment(question, next)}
            placeholder="Elige el departamento"
            showSearch
            optionFilterProp="label"
            options={departments.map((department) => ({
              value: department.code,
              label: department.name,
            }))}
          />
        );

      case "municipality": {
        const options = municipalities[question.dependsOn ?? ""] ?? [];
        return (
          <Select
            value={value || undefined}
            onChange={(next: string) => void chooseMunicipality(question, next)}
            placeholder={options.length ? "Elige el municipio" : "Elige antes el departamento"}
            disabled={options.length === 0}
            showSearch
            optionFilterProp="label"
            options={options.map((municipality) => ({
              value: municipality.code,
              label: municipality.name,
            }))}
          />
        );
      }

      case "zone": {
        const options = zones[question.dependsOn ?? ""] ?? [];
        if (options.length === 0) return null;
        return (
          <Select
            value={value || undefined}
            onChange={(next: string) => setAnswer(question.id, next)}
            placeholder="Elige la zona"
            options={options.map((zone) => ({ value: zone, label: zone }))}
          />
        );
      }

      case "language-choice": {
        const mode = languageMode[question.id] ?? value;
        const known = (question.options ?? []).some((option) => option.value === value);
        return (
          <>
            <Radio.Group
              value={known ? value : mode === OTHER_LANGUAGE ? OTHER_LANGUAGE : undefined}
              onChange={(event) => {
                const next = String(event.target.value);
                setLanguageMode((current) => ({ ...current, [question.id]: next }));
                setAnswer(question.id, next === OTHER_LANGUAGE ? "" : next);
              }}
            >
              {(question.options ?? []).map((option) => (
                <Radio key={option.value} value={option.value}>
                  {option.labelKaqchikel} / {option.labelSpanish}
                </Radio>
              ))}
              <Radio value={OTHER_LANGUAGE}>Ch&apos;aqa chik / Otro</Radio>
            </Radio.Group>
            {mode === OTHER_LANGUAGE && !known ? (
              <Input
                value={value}
                onChange={(event) => setAnswer(question.id, event.target.value)}
                placeholder="Escribe el idioma; si son varios, sepáralos con comas"
              />
            ) : null}
          </>
        );
      }

      case "text":
        if (question.id === "home_address" || question.id === "institution_address") {
          return (
            <TextArea
              value={value}
              onChange={(event) => setAnswer(question.id, event.target.value)}
              rows={2}
            />
          );
        }
        return (
          <Input value={value} onChange={(event) => setAnswer(question.id, event.target.value)} />
        );

      default:
        return (
          <Input
            value={value}
            inputMode={
              question.kind === "phone" || question.kind === "document-id" ? "numeric" : undefined
            }
            type={question.kind === "email" ? "email" : "text"}
            onChange={(event) => setAnswer(question.id, event.target.value)}
          />
        );
    }
  };

  return (
    <div className={styles.form}>
      {template.questions.map((question) => {
        const control = renderControl(question);
        if (control === null) return null;
        const problem = problemOf(question.id);

        return (
          <div key={question.id} className={styles.question}>
            <div className={styles.label}>
              <Text strong>
                {question.labelKaqchikel} / {question.labelSpanish}
                {question.required ? <span className={styles.required}> *</span> : null}
              </Text>
              {question.hint ? <Text type="secondary">{question.hint}</Text> : null}
            </div>
            {control}
            {problem ? <Text type="danger">{problemText(problem)}</Text> : null}
          </div>
        );
      })}

      <Divider />

      <div className={styles.documents}>
        <Text strong>Wujil / Documentos</Text>
        {template.documents.map((type) => (
          <Card key={type} size="small" title={DOCUMENT_LABELS[type]}>
            <DocumentUpload
              offeringId={offering.id}
              draftId={draftId}
              type={type}
              uploaded={Boolean(documents[type])}
              onUploaded={onUploaded}
            />
          </Card>
        ))}
      </div>

      {message ? <Alert type="error" message={message} showIcon /> : null}

      <div className={styles.actions}>
        <Button type="primary" size="large" loading={sending} onClick={() => void submit()}>
          Enviar inscripción
        </Button>
      </div>

      <Paragraph className={styles.muted}>
        Al enviar aceptas que la Academia se comunique contigo por correo electrónico, que es el
        único medio por el que informará sobre el curso.
      </Paragraph>
    </div>
  );
}
