"use client";

import { useState } from "react";
import { Button, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { CreatePersonForm } from "./create-person-form";

export function CreatePersonButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
        Agregar
      </Button>

      <Modal
        title="Dar de alta una persona"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <CreatePersonForm onCompleted={() => setOpen(false)} />
      </Modal>
    </>
  );
}
