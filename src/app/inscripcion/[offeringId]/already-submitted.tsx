"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button, Result } from "antd";
import {
  parseSubmittedMarks,
  serverSubmittedMarksSnapshot,
  submittedMarksSnapshot,
  subscribeToSubmittedMarks,
} from "./submitted-marks";
import styles from "./inscripcion.module.scss";

const dateFormatter = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  day: "numeric",
  month: "long",
  year: "numeric",
});

type AlreadySubmittedProps = {
  offeringId: string;
  courseLabel: string;
  children: React.ReactNode;
};

/**
 * La marca vive en el navegador, así que el servidor no puede saber si esta persona ya se
 * inscribió: renderiza el formulario y esta puerta lo sustituye al hidratar. No es la
 * defensa contra duplicados —esa es la restricción de unicidad por DPI en la base— sino la
 * cortesía de no pedir otra vez lo que ya se envió.
 */
export function AlreadySubmitted({ offeringId, courseLabel, children }: AlreadySubmittedProps) {
  const raw = useSyncExternalStore(
    subscribeToSubmittedMarks,
    submittedMarksSnapshot,
    serverSubmittedMarksSnapshot,
  );

  const mark = parseSubmittedMarks(raw).find((entry) => entry.offeringId === offeringId);

  if (!mark) return children;

  return (
    <>
      <Result
        status="info"
        title="Ya llenaste este formulario."
        subTitle={`${courseLabel}. Lo enviaste el ${dateFormatter.format(new Date(mark.submittedAt))}, así que no hace falta que lo llenes de nuevo.`}
        extra={
          <Link href="/">
            <Button type="primary">Volver a los cursos</Button>
          </Link>
        }
      />

      <div className={styles.closing}>
        <p className={styles.muted}>
          Está atento a su correo electrónico: es el único medio por el que la Academia informará
          sobre el curso.
        </p>
      </div>
    </>
  );
}
