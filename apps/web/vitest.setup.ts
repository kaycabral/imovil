import '@testing-library/jest-dom/vitest'

// jsdom não implementa ResizeObserver; Radix (Switch, Select) depende dele.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? ResizeObserverMock

// jsdom tampouco tem PointerEvent/hasPointerCapture — usados pelo Radix Select.
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
}
