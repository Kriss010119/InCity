import styles from '../PlaceDetailsModal.module.css';

interface ModalOverlayProps {
  children: React.ReactNode;
  onClose: () => void;
}

export const ModalOverlay = ({ children, onClose }: ModalOverlayProps) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      {children}
    </div>
  );
};
