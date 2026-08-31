"use client";

import { useState } from "react";
import { Alert, Button, Upload } from "antd";
import type { UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { DocumentType } from "@/modules/enrollment";
import { DOCUMENT_CONTENT_TYPE, MAX_DOCUMENT_BYTES } from "@/modules/enrollment";
import { requestUploadTicketAction } from "./actions";
import styles from "./inscripcion.module.scss";

type DocumentUploadProps = {
  offeringId: string;
  draftId: string;
  type: DocumentType;
  uploaded: boolean;
  onUploaded: (type: DocumentType, storageKey: string) => void;
};

export function DocumentUpload({
  offeringId,
  draftId,
  type,
  uploaded,
  onUploaded,
}: DocumentUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const customRequest: UploadProps["customRequest"] = async ({ file, onSuccess, onError }) => {
    const selected = file as File;
    setError(null);

    if (selected.type !== DOCUMENT_CONTENT_TYPE) {
      setError("El archivo debe ser un PDF.");
      onError?.(new Error("content-type"));
      return;
    }
    if (selected.size > MAX_DOCUMENT_BYTES) {
      setError("El archivo debe pesar menos de 10 MB.");
      onError?.(new Error("size"));
      return;
    }

    setBusy(true);
    try {
      const ticket = await requestUploadTicketAction({
        offeringId,
        draftId,
        type,
        contentType: DOCUMENT_CONTENT_TYPE,
      });

      if (!ticket.ok) {
        setError(ticket.message);
        onError?.(new Error(ticket.message));
        return;
      }

      const response = await fetch(ticket.value.url, {
        method: ticket.value.method,
        headers: ticket.value.headers,
        body: selected,
      });

      if (!response.ok) {
        setError("No se pudo subir el archivo. Intenta de nuevo.");
        onError?.(new Error("upload"));
        return;
      }

      const stored = (await response.json()) as { url?: string; pathname?: string };
      const storageKey = stored.url ?? stored.pathname;
      if (!storageKey) {
        setError("No se pudo subir el archivo. Intenta de nuevo.");
        onError?.(new Error("missing-url"));
        return;
      }

      onUploaded(type, storageKey);
      onSuccess?.(stored);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.upload}>
      <Upload
        accept="application/pdf"
        maxCount={1}
        customRequest={customRequest}
        showUploadList={{ showRemoveIcon: false }}
      >
        <Button icon={<UploadOutlined />} loading={busy}>
          {uploaded ? "Reemplazar PDF" : "Adjuntar PDF"}
        </Button>
      </Upload>
      {error ? <Alert type="error" message={error} showIcon /> : null}
    </div>
  );
}
