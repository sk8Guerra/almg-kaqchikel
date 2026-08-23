"use client";

import { App } from "antd";

type ActionOutcome = {
  ok: boolean;
  message: string;
};

export function useActionFeedback() {
  const { message } = App.useApp();

  return (outcome: ActionOutcome): void => {
    if (outcome.ok) {
      message.success(outcome.message);
      return;
    }
    message.error(outcome.message);
  };
}
