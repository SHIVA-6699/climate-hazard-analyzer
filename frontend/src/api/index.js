import client from './client'

const data = (request) => request.then((response) => response.data)

export const analyzeHeatwaves = (payload) => data(client.post('/analyze', payload))

export const geocodePlace = (q) => data(client.get('/geocode', { params: { q } }))
