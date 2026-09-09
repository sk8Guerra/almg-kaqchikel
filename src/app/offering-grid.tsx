"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button, Card, Empty, Tag, Typography } from "antd";
import { formatCalendarDate } from "@/shared/calendar-date";
import type { OfferingView } from "@/modules/enrollment";
import { LEVEL_LABELS, MODALITY_LABELS, TRACK_LABELS } from "@/modules/enrollment";
import {
  parseSubmittedMarks,
  serverSubmittedMarksSnapshot,
  submittedMarksSnapshot,
  subscribeToSubmittedMarks,
} from "./inscripcion/[offeringId]/submitted-marks";
import styles from "./page.module.scss";

const { Text, Paragraph } = Typography;

const dateFormatter = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

type OfferingGridProps = {
  offerings: OfferingView[];
};

export function OfferingGrid({ offerings }: OfferingGridProps) {
  const raw = useSyncExternalStore(
    subscribeToSubmittedMarks,
    submittedMarksSnapshot,
    serverSubmittedMarksSnapshot,
  );

  const submitted = useMemo(
    () =>
      Object.fromEntries(
        parseSubmittedMarks(raw).map((mark) => [mark.offeringId, mark.submittedAt]),
      ),
    [raw],
  );

  if (offerings.length === 0) {
    return (
      <div className={styles.empty}>
        <Empty description="En este momento no hay inscripciones abiertas. Vuelve cuando la Academia publique una nueva convocatoria." />
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {offerings.map((offering) => {
        const alreadySent = submitted[offering.id];

        return (
          <Card key={offering.id} title={offering.templateNameSpanish}>
            <div className={styles.cardBody}>
              <Text type="secondary">{offering.templateNameKaqchikel}</Text>

              <div className={styles.tags}>
                <Tag color="green">{TRACK_LABELS[offering.track]}</Tag>
                <Tag color="blue">{LEVEL_LABELS[offering.level]}</Tag>
                <Tag>{MODALITY_LABELS[offering.modality]}</Tag>
              </div>

              <div className={styles.facts}>
                <Text>
                  {offering.municipalityName}, {offering.departmentName}
                </Text>
                {offering.scheduleLabel ? <Text>{offering.scheduleLabel}</Text> : null}
                {offering.classesStartOn ? (
                  <Text type="secondary">
                    Inicio de clases: {formatCalendarDate(offering.classesStartOn)}
                  </Text>
                ) : null}
                <Text type="secondary">
                  Cierra el {dateTimeFormatter.format(offering.closesAt)}
                </Text>
              </div>

              {alreadySent ? (
                <Paragraph type="success">
                  Ya te inscribiste el {dateFormatter.format(new Date(alreadySent))}.
                </Paragraph>
              ) : (
                <Link href={`/inscripcion/${offering.id}`}>
                  <Button type="primary" block>
                    Inscribirme
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
