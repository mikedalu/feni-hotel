import { useEffect, useRef } from "react";

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  // Maximum time between keystrokes to be considered a single scan (in ms)
  timeout?: number;
}

export function useBarcodeScanner({ onScan, timeout = 50 }: UseBarcodeScannerProps) {
  const buffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes inside input fields or textareas
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentTime = Date.now();
      
      // If the time between keystrokes is too long, reset the buffer
      if (currentTime - lastKeyTime.current > timeout) {
        buffer.current = "";
      }

      lastKeyTime.current = currentTime;

      if (e.key === "Enter") {
        if (buffer.current.length > 0) {
          onScan(buffer.current);
          buffer.current = ""; // Reset after scan
        }
      } else if (e.key.length === 1) { // Only capture printable characters
        buffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onScan, timeout]);
}
