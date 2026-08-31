"use client";

import Link from "next/link";
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

type DownloadButtonProps = {
  href: string;
  label: string;
  variant?: "default" | "link";
};

export function DownloadButton({ href, label, variant = "default" }: DownloadButtonProps) {
  return (
    <Link href={href} prefetch={false}>
      <Button type={variant === "link" ? "link" : "default"} icon={<DownloadOutlined />}>
        {label}
      </Button>
    </Link>
  );
}
