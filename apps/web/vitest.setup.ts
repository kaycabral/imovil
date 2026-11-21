import { installJsdomPolyfills } from '@cbrl/testing/vitest/jsdom'
import '@testing-library/jest-dom/vitest'

// ResizeObserver, matchMedia, scrollIntoView and Pointer Capture for Radix under jsdom.
installJsdomPolyfills()
