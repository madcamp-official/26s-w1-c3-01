import type { PropsWithChildren } from "react";

type ModalProps = PropsWithChildren<{
  open: boolean;
  title?: string;
  onClose?: () => void;
}>;

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true">
      {title ? <h2>{title}</h2> : null}
      {children}
      <button type="button" onClick={onClose}>닫기</button>
    </div>
  );
}
