"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Input, Modal, Select, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { TEMPLATES } from "@/modules/enrollment";
import type { Modality, OfferingView } from "@/modules/enrollment";
import { DEPARTMENTS, MUNICIPALITIES } from "@/modules/geography";
import { createOfferingAction, updateOfferingAction } from "./actions";
import { localDateTimeFields } from "./local-time";
import styles from "../inscripciones.module.scss";

const { Text } = Typography;

type OfferingFormProps = {
  offering?: OfferingView;
  trigger?: "button" | "link";
};

const MODALITIES: { value: Modality; label: string }[] = [
  { value: "virtual", label: "Virtual" },
  { value: "in_person", label: "Presencial" },
];

const departmentOf = (municipalityCode: string): string => municipalityCode.slice(0, 2);

const byName = (a: { name: string }, b: { name: string }): number => a.name.localeCompare(b.name);

export function OfferingForm({ offering, trigger = "button" }: OfferingFormProps) {
  const router = useRouter();
  const editing = Boolean(offering);

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [templateCode, setTemplateCode] = useState(offering?.templateCode ?? TEMPLATES[0].code);
  const [modality, setModality] = useState<Modality>(offering?.modality ?? "virtual");
  const [year, setYear] = useState(offering?.year ?? new Date().getFullYear());
  // Al editar, los cinco campos de fecha y hora se siembran desde la convocatoria: si no,
  // el formulario los muestra vacíos y hay que volver a teclearlos para cambiar cualquier
  // otra cosa.
  const opens = offering ? localDateTimeFields(offering.opensAt) : null;
  const closes = offering ? localDateTimeFields(offering.closesAt) : null;

  const [classesStartOn, setClassesStartOn] = useState(offering?.classesStartOn ?? "");
  const [opensOn, setOpensOn] = useState(opens?.day ?? "");
  const [opensAtTime, setOpensAtTime] = useState(opens?.time ?? "08:00");
  const [closesOn, setClosesOn] = useState(closes?.day ?? "");
  const [closesAtTime, setClosesAtTime] = useState(closes?.time ?? "23:59");
  const [scheduleLabel, setScheduleLabel] = useState(offering?.scheduleLabel ?? "");
  const [departmentCode, setDepartmentCode] = useState(
    offering ? departmentOf(offering.municipalityCode) : "",
  );
  const [municipalityCode, setMunicipalityCode] = useState(offering?.municipalityCode ?? "");

  const departments = useMemo(() => [...DEPARTMENTS].sort(byName), []);

  const municipalities = useMemo(
    () =>
      MUNICIPALITIES.filter((municipality) => municipality.departmentCode === departmentCode).sort(
        byName,
      ),
    [departmentCode],
  );

  const chooseDepartment = (code: string) => {
    setDepartmentCode(code);
    setMunicipalityCode("");
  };

  const save = async () => {
    setMessage(null);

    if (!departmentCode || !municipalityCode) {
      setMessage("Falta elegir el departamento y el municipio.");
      return;
    }
    if (!opensOn || !opensAtTime || !closesOn || !closesAtTime) {
      setMessage("Faltan las fechas de apertura y cierre.");
      return;
    }

    const input = {
      templateCode,
      year,
      municipalityCode,
      modality,
      opensOn,
      opensAtTime,
      closesOn,
      closesAtTime,
      classesStartOn: classesStartOn === "" ? null : classesStartOn,
      scheduleLabel: scheduleLabel.trim() === "" ? null : scheduleLabel.trim(),
    };

    setSaving(true);
    try {
      const result = offering
        ? await updateOfferingAction(offering.id, input)
        : await createOfferingAction(input);

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {trigger === "button" ? (
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Nueva convocatoria
        </Button>
      ) : (
        <Button type="link" onClick={() => setOpen(true)}>
          Editar
        </Button>
      )}

      <Modal
        title={editing ? "Editar convocatoria" : "Abrir una convocatoria"}
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <Text strong>Curso</Text>
            <Select
              value={templateCode}
              onChange={setTemplateCode}
              options={TEMPLATES.map((template) => ({
                value: template.code,
                label: template.nameSpanish,
              }))}
            />
          </div>

          <div className={styles.field}>
            <Text strong>Modalidad</Text>
            <Select value={modality} onChange={setModality} options={MODALITIES} />
          </div>

          <div className={styles.field}>
            <Text strong>Año</Text>
            <Input
              type="number"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            />
          </div>

          <div className={styles.field}>
            <Text strong>Inicio de clases</Text>
            <Input
              type="date"
              value={classesStartOn}
              onChange={(event) => setClassesStartOn(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <Text strong>Abre el</Text>
            <Input
              type="date"
              value={opensOn}
              onChange={(event) => setOpensOn(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <Text strong>Hora de apertura</Text>
            <Input
              type="time"
              value={opensAtTime}
              onChange={(event) => setOpensAtTime(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <Text strong>Cierra el</Text>
            <Input
              type="date"
              value={closesOn}
              onChange={(event) => setClosesOn(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <Text strong>Hora de cierre</Text>
            <Input
              type="time"
              value={closesAtTime}
              onChange={(event) => setClosesAtTime(event.target.value)}
            />
          </div>

          <div className={styles.fieldWide}>
            <Text strong>Horario del curso</Text>
            <Input
              value={scheduleLabel}
              onChange={(event) => setScheduleLabel(event.target.value)}
              placeholder="Martes de 14:00 a 16:30 horas"
            />
          </div>

          <div className={styles.field}>
            <Text strong>Departamento</Text>
            <Select
              value={departmentCode || undefined}
              onChange={chooseDepartment}
              showSearch
              optionFilterProp="label"
              placeholder="Elige el departamento"
              options={departments.map((department) => ({
                value: department.code,
                label: department.name,
              }))}
            />
          </div>
          <div className={styles.field}>
            <Text strong>Municipio</Text>
            <Select
              value={municipalityCode || undefined}
              onChange={setMunicipalityCode}
              disabled={departmentCode === ""}
              showSearch
              optionFilterProp="label"
              placeholder={
                departmentCode === "" ? "Elige antes el departamento" : "Elige el municipio"
              }
              options={municipalities.map((municipality) => ({
                value: municipality.code,
                label: municipality.name,
              }))}
            />
          </div>
        </div>

        <Text type="secondary">Las fechas y horas se interpretan en hora de Guatemala.</Text>

        {message ? <Alert type="error" message={message} showIcon /> : null}

        <div className={styles.formActions}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="primary" loading={saving} onClick={() => void save()}>
            {editing ? "Guardar" : "Abrir convocatoria"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
