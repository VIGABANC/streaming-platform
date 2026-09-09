export {}

declare global {
  interface Window {
    __setVeyraOnline?: (online: boolean) => void
  }
}
