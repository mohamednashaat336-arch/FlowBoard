import { useCallback, useEffect, useState } from 'react'

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored === null ? initialValue : JSON.parse(stored)
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
    }
  }, [key, value])

  const updateValue = useCallback((nextValue) => {
    setValue((currentValue) => (
      typeof nextValue === 'function' ? nextValue(currentValue) : nextValue
    ))
  }, [])

  return [value, updateValue]
}
