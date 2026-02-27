import { saveAs } from "file-saver";

export function downloadBlob(blob: Blob, fileName: string): void {
  saveAs(blob, fileName);
}

export function downloadText(
  content: string,
  fileName: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, fileName);
}
