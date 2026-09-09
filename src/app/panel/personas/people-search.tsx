"use client";

import { Button, Input, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";

type PeopleSearchProps = {
  defaultValue: string;
};

export function PeopleSearch({ defaultValue }: PeopleSearchProps) {
  return (
    <form>
      <Space.Compact block>
        <Input
          name="q"
          defaultValue={defaultValue}
          placeholder="Buscar por correo o nombre"
          aria-label="Buscar personas por correo o nombre"
        />
        <Button htmlType="submit" icon={<SearchOutlined />} />
      </Space.Compact>
    </form>
  );
}
