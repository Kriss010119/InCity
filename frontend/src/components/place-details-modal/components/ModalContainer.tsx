import styles from '../PlaceDetailsModal.module.css';

interface ModalContainerProps {
  children: React.ReactNode;
}

export const ModalContainer = ({ children }: ModalContainerProps) => {
  return (
    <div className={styles.modal} onClick={e => e.stopPropagation()}>
      {children}
    </div>
  );
};