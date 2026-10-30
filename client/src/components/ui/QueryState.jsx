import PageLoader from './PageLoader'
import ErrorMessage from './ErrorMessage'

export default function QueryState({ loading, error, onRetry, children }) {
  if (loading) return <PageLoader />
  if (error) return <ErrorMessage message={error} onRetry={onRetry} />
  return children
}
