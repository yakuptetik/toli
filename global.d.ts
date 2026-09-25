export {};

declare global {
  interface Window {
    ToliAsistan?: {
      open: () => void;
      close: () => void;
    };
  }
}
