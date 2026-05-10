export interface FormState {
  message: string;
  fileData?: string; // This will hold the base64 encoded file
  fileName?: string; // This will hold the name of the file
  downloadLink?: string; // Keep this for now for compatibility, but we'll phase it out
}
