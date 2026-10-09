// Browser file helpers (replacing expo-image-picker / expo-file-system /
// expo-sharing now that the app ships only as a web PWA).

/**
 * Open the browser's file chooser for a single image. Resolves to an object
 * URL for the chosen file, or null if the user cancels.
 */
export function pickImageFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.remove();
      resolve(file ? URL.createObjectURL(file) : null);
    });
    input.addEventListener('cancel', () => {
      input.remove();
      resolve(null);
    });
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Trigger a browser download of `contents` as `filename`.
 */
export function downloadTextFile(filename: string, contents: string, mimeType = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
