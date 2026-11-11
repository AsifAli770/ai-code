import { useState } from 'react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import { useAuth } from '../hooks/useAuth'
import { parseApiError } from '../services/api'
import { updateProfile } from '../services/user.service'

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [saving, setSaving] = useState(false)

  const dirty = form.name.trim() !== user.name || form.bio.trim() !== (user.bio || '')

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: undefined }))
    setStatus({ type: '', message: '' })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (form.name.trim().length < 2) {
      setFieldErrors({ name: 'Name must be 2–60 characters' })
      return
    }
    setSaving(true)
    try {
      const updated = await updateProfile({ name: form.name.trim(), bio: form.bio.trim() })
      setUser(updated)
      setForm({ name: updated.name, bio: updated.bio || '' })
      setStatus({ type: 'success', message: 'Profile saved.' })
    } catch (err) {
      const { message, fieldErrors: fe } = parseApiError(err)
      setFieldErrors(fe)
      setStatus({ type: 'error', message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-sm text-slate-400">Settings</p>
      <h1 className="mt-1 text-3xl font-bold">Profile</h1>

      <form onSubmit={onSubmit} className="card mt-8 space-y-5 p-6" noValidate>
        {status.message && <Alert type={status.type}>{status.message}</Alert>}

        <FormField
          label="Full name"
          name="name"
          value={form.name}
          onChange={onChange}
          error={fieldErrors.name}
          maxLength={60}
        />
        <FormField label="Email" value={user.email} disabled hint="Email can't be changed." readOnly />
        <FormField
          label="Bio"
          name="bio"
          multiline
          value={form.bio}
          onChange={onChange}
          error={fieldErrors.bio}
          maxLength={500}
          placeholder="Tell collectors about yourself"
          hint={`${form.bio.length}/500`}
        />

        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  )
}
