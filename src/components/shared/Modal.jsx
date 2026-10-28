function Modal({ open, title, onClose, children }) {
  if (!open) return null

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="modal-header">
          <p className="eyebrow">BULKWAY</p>
          <h2>{title}</h2>
        </div>

        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal