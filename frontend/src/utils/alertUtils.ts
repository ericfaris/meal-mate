import { ErrorModalRef } from '../components/ErrorModal';
import { SuccessModalRef } from '../components/SuccessModal';
import { ConfirmModalRef } from '../components/ConfirmModal';
import { InfoModalRef } from '../components/InfoModal';
import { ActionSheetModalRef } from '../components/ActionSheetModal';
import { Ionicons } from '@expo/vector-icons';

interface AlertOptions {
  title: string;
  message: string;
  onClose?: () => void;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'default' | 'destructive';
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface InfoOptions {
  title: string;
  message: string;
  buttonText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onClose?: () => void;
}

interface ActionOption {
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: 'default' | 'destructive' | 'cancel';
  onPress?: () => void | Promise<void>;
}

interface ActionSheetOptions {
  title?: string;
  message?: string;
  options: ActionOption[];
}

class AlertManager {
  private errorModal: ErrorModalRef | null = null;
  private successModal: SuccessModalRef | null = null;
  private confirmModal: ConfirmModalRef | null = null;
  private infoModal: InfoModalRef | null = null;
  private actionSheetModal: ActionSheetModalRef | null = null;

  setErrorModal(modalRef: ErrorModalRef | null) {
    this.errorModal = modalRef;
  }

  setSuccessModal(modalRef: SuccessModalRef | null) {
    this.successModal = modalRef;
  }

  setConfirmModal(modalRef: ConfirmModalRef | null) {
    this.confirmModal = modalRef;
  }

  setInfoModal(modalRef: InfoModalRef | null) {
    this.infoModal = modalRef;
  }

  setActionSheetModal(modalRef: ActionSheetModalRef | null) {
    this.actionSheetModal = modalRef;
  }

  /**
   * Show an error alert with a red icon
   */
  showError({ title, message, onClose }: AlertOptions) {
    if (this.errorModal) {
      this.errorModal.show(title, message, onClose);
    } else {
      console.warn('ErrorModal not initialized');
    }
  }

  /**
   * Show a success alert with a green icon
   */
  showSuccess({ title, message, onClose }: AlertOptions) {
    if (this.successModal) {
      this.successModal.show(title, message, onClose);
    } else {
      console.warn('SuccessModal not initialized');
    }
  }

  /**
   * Show a confirmation dialog with Cancel and Confirm buttons
   */
  showConfirm(options: ConfirmOptions) {
    if (this.confirmModal) {
      this.confirmModal.show(options);
    } else {
      console.warn('ConfirmModal not initialized');
    }
  }

  /**
   * Show an informational alert (single button)
   */
  showInfo(options: InfoOptions) {
    if (this.infoModal) {
      this.infoModal.show(options);
    } else {
      console.warn('InfoModal not initialized');
    }
  }

  /**
   * Show an action sheet with multiple options
   */
  showActionSheet(options: ActionSheetOptions) {
    if (this.actionSheetModal) {
      this.actionSheetModal.show(options);
    } else {
      console.warn('ActionSheetModal not initialized');
    }
  }

  /**
   * Hide the action sheet programmatically
   */
  hideActionSheet() {
    if (this.actionSheetModal) {
      this.actionSheetModal.hide();
    }
  }
}

export const alertManager = new AlertManager();
