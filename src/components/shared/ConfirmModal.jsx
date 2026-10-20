import Modal from './Modal'

function ConfirmModal({
  open,
  title = '¿Confirmar acción?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onClose,
  loading = false,
  danger = false,
}) {
  if (!open) return null

  return (
    <Modal open={open} title={title} onClose={loading ? () => {} : onClose}>
      <div className="confirm-modal-content">
        <div
          className={`confirm-modal-icon ${danger ? 'confirm-modal-icon-danger' : ''}`}
          aria-hidden="true"
        >
          <i className={`bi ${danger ? 'bi-exclamation-triangle' : 'bi-shield-check'}`} />
        </div>

        <p className="confirm-modal-message">
          {message}
        </p>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmModal