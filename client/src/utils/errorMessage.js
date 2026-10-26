export default function getErrorMessage(error) {
  if (error.response) {
    return error.response.data?.message || `Request failed with status ${error.response.status}`
  }
  if (error.request) {
    return 'Cannot reach the server. Check your connection and try again.'
  }
  return error.message || 'Something went wrong. Please try again.'
}
