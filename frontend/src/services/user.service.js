import api from './api'

export async function updateProfile(updates) {
  const { data } = await api.patch('/users/me', updates)
  return data.data.user
}
