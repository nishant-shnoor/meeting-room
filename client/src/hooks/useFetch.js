import { useCallback, useEffect, useState } from 'react'
import getErrorMessage from '../utils/errorMessage'

export default function useFetch(request) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({
    request: null,
    attempt: -1,
    data: null,
    error: '',
  })

  useEffect(() => {
    let cancelled = false

    request()
      .then(
        (data) =>
          !cancelled && setResult({ request, attempt, data, error: '' }),
      )
      .catch(
        (requestError) =>
          !cancelled &&
          setResult((current) => ({
            ...current,
            request,
            attempt,
            error: getErrorMessage(requestError),
          })),
      )

    return () => {
      cancelled = true
    }
  }, [request, attempt])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])

  const loading = result.request !== request || result.attempt !== attempt

  return {
    data: result.data,
    loading,
    error: loading ? '' : result.error,
    reload,
  }
}
