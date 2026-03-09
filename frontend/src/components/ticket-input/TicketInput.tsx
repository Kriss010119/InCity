import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicket } from '../../context/TicketContext';
import { fetchTicketDetails } from '../../api/ticketApi';
import { useLocale } from '../../hooks/useLocale';
import { 
  InputField, SubmitButton, 
  ErrorMessage, SuccessMessage 
} from './components';
import type { ValidationStatus } from './types';
import styles from './TicketInput.module.css';
import { createRouteDataFromTicket, normalizeTicketNumber, validateTicketNumber } from '../../utils/categoryUtils';

interface TicketInputProps {
  className?: string;
  onSuccess?: () => void;
  autoFillForm?: boolean;
}

export const TicketInput = ({ className = '', onSuccess, autoFillForm = true }: TicketInputProps) => {
  const [ticketNumber, setTicketNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  
  const navigate = useNavigate();
  const { setTicketData, setIsLoading, setError, error } = useTicket();
  const { t } = useLocale();

  useEffect(() => {
    if (validationStatus === 'error') {
      setValidationStatus('idle');
      setError(null);
    }
  }, [ticketNumber, setError, validationStatus]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const normalizedTicket = normalizeTicketNumber(ticketNumber);
    
    if (!validateTicketNumber(normalizedTicket)) {
      setError(t('ticket.error'));
      setValidationStatus('error');
      return;
    }

    setValidationStatus('validating');
    setIsLoading(true);
    setError(null);

    try {
      const ticketDetails = await fetchTicketDetails(normalizedTicket);
      
      setTicketData({
        ticketNumber: normalizedTicket,
        ticketDetails
      });

      setValidationStatus('success');
      
      if (onSuccess) {
        onSuccess();
      }

      if (autoFillForm) {
        const routeData = createRouteDataFromTicket(ticketDetails);
        navigate('/map', { 
          state: { 
            ...routeData,
            autoFill: true,
            ticketType: ticketDetails.orderType
          } 
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ticket.error'));
      setValidationStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = () => {
    setTicketNumber('');
    setValidationStatus('idle');
    setError(null);
  };

  const isSubmitDisabled = !ticketNumber.trim() || validationStatus === 'validating';
  const isChecking = validationStatus === 'validating';

  return (
    <form 
      className={`${styles.ticketForm} ${className} ${
        isFocused ? styles.focused : ''
      } ${validationStatus === 'error' ? styles.error : ''}`}
      onSubmit={handleSubmit}
    >
      <InputField
        value={ticketNumber}
        onChange={setTicketNumber}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        onClear={handleClear}
        placeholder={t('ticket.placeholder')}
        disabled={validationStatus === 'validating'}
        status={validationStatus}
      />

      <SubmitButton
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        isChecking={isChecking}
      />

      {error && <ErrorMessage message={error} />}
      {validationStatus === 'success' && <SuccessMessage message={t('ticket.success')} />}
    </form>
  );
};