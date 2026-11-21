import React from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  paddingClassName?: string;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({
  children,
  paddingClassName = 'p-4',
}) => {
  const overlay = (
    <div
      className={`fixed inset-0 z-[100] bg-black/55 backdrop-blur-md flex items-center justify-center overflow-y-auto ${paddingClassName}`}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );

  if (typeof document === 'undefined') {
    return overlay;
  }

  return createPortal(overlay, document.body);
};
