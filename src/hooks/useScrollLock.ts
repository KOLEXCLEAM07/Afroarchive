import { useEffect, useRef } from 'react'

let lockCount = 0
let originalOverflow = ''

/** Ref-counted body scroll lock, so stacked modals don't unlock each other. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    if (lockCount === 0) originalOverflow = document.body.style.overflow
    lockCount += 1
    document.body.style.overflow = 'hidden'
    return () => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount === 0) document.body.style.overflow = originalOverflow
    }
  }, [active])
}

interface StackEntry {
  close: () => void
}

const modalStack: StackEntry[] = []

function handleEscape(e: KeyboardEvent) {
  if (e.key !== 'Escape' || modalStack.length === 0) return
  e.preventDefault()
  modalStack[modalStack.length - 1].close()
}

export function hasOpenModal() {
  return modalStack.length > 0
}

/**
 * Registers an open modal: locks scroll, closes only the top-most modal on Escape,
 * moves focus into the dialog on open and restores it on close.
 * Attach the returned ref to the dialog panel (give it tabIndex={-1}).
 */
export function useModalStack<T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  onClose: () => void,
) {
  const containerRef = useRef<T>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return

    const entry: StackEntry = { close: () => onCloseRef.current() }
    modalStack.push(entry)
    if (modalStack.length === 1) window.addEventListener('keydown', handleEscape)

    const previouslyFocused = document.activeElement as HTMLElement | null
    const container = containerRef.current
    if (container && !container.contains(document.activeElement)) {
      container.focus({ preventScroll: true })
    }

    return () => {
      const index = modalStack.indexOf(entry)
      if (index !== -1) modalStack.splice(index, 1)
      if (modalStack.length === 0) window.removeEventListener('keydown', handleEscape)
      if (previouslyFocused && previouslyFocused !== document.body && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [isOpen])

  return containerRef
}
