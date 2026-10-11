export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    return error?.code === 'ECONNABORTED'
      ? 'The weather data took too long to load. Please try again.'
      : 'Cannot reach the server. Check your connection and try again.'
  }
  if (error.response.status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  return error.response.data?.message ?? fallback
}
