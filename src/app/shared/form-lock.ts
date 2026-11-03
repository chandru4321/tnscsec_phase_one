// Shown on a form page when its edit API says the form is locked: a form
// can be edited only until the NEXT form is submitted.
export const FORM_LOCKED_MESSAGE =
  'இந்த படிவம் பூட்டப்பட்டது — அடுத்த படிவம் சமர்ப்பிக்கப்பட்டதால் இதை திருத்த முடியாது.';

// The edit APIs answer "FormN is locked because FormM ..." when locked
export function lockedMessageFrom(err: any): string {
  const message: string = err?.error?.message || err?.message || '';
  return /locked/i.test(message) ? FORM_LOCKED_MESSAGE : '';
}
