import React from 'react';

const ConfirmDialog = ({
  isOpen,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title">{title}</h2>
        {message && <p>{message}</p>}
        <div className="confirm-dialog-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-delete" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>

      <style>{`
        .confirm-dialog-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 1rem;
          background: rgba(15, 23, 42, 0.58);
        }
        .confirm-dialog {
          width: min(420px, 100%);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
          backdrop-filter: blur(24px) saturate(140%);
          border: 1px solid rgba(255, 255, 255, 0.24);
          color: white;
          border-radius: 8px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
          padding: 1.4rem;
        }
        .confirm-dialog h2 {
          font-size: 1.2rem;
          margin-bottom: 0.55rem;
        }
        .confirm-dialog p {
          color: rgba(255, 255, 255, 0.78);
          line-height: 1.5;
        }
        .confirm-dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.7rem;
          margin-top: 1.2rem;
        }
        .confirm-dialog-actions button {
          border: 0;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          padding: 0.55rem 0.9rem;
        }
        .confirm-dialog-actions .btn-secondary {
          background: #4c5f7a;
        }
        .confirm-dialog-actions .btn-delete {
          background: #c2413a;
        }
      `}</style>
    </div>
  );
};

export default ConfirmDialog;
