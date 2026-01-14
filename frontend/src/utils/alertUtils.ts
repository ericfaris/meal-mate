import { Alert, Platform } from 'react-native';
import { ErrorModalRef } from '../components/ErrorModal';
import { SuccessModalRef } from '../components/SuccessModal';

interface AlertOptions {
  title: string;
  message: string;
  onClose?: () => void;
}

class AlertManager {
  private errorModal: ErrorModalRef | null = null;
  private successModal: SuccessModalRef | null = null;

  setErrorModal(modalRef: ErrorModalRef | null) {
    this.errorModal = modalRef;
  }

  setSuccessModal(modalRef: SuccessModalRef | null) {
    this.successModal = modalRef;
  }

  showError({ title, message, onClose }: AlertOptions) {
    if (Platform.OS === 'android' && this.errorModal) {
      this.errorModal.show(title, message, onClose);
    } else {
      Alert.alert(title, message, onClose ? [{ text: 'OK', onPress: onClose }] : undefined);
    }
  }

  showSuccess({ title, message, onClose }: AlertOptions) {
    if (Platform.OS === 'android' && this.successModal) {
      this.successModal.show(title, message, onClose);
    } else {
      Alert.alert(title, message, onClose ? [{ text: 'OK', onPress: onClose }] : undefined);
    }
  }
}

export const alertManager = new AlertManager();