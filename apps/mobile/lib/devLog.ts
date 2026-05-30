export function devLog(...args: any[]): void {
  if (__DEV__) {
    console.log('[DEV]', ...args);
  }
}
