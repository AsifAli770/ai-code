import { useState } from 'react'
import Alert from '../components/ui/Alert'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import CopyButton from '../components/ui/CopyButton'
import EditableField from '../components/ui/EditableField'
import { useAuth } from '../hooks/useAuth'
import { parseApiError } from '../services/api'
import { updateProfile } from '../services/user.service'
import { toChecksumAddress } from '../utils/format'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const [notice, setNotice] = useState('')

  /** Saves one field; errors are thrown so the field can show them inline. */
  const saveField = (field, label) => async (value) => {
    setNotice('')
    try {
      const updated = await updateProfile({ [field]: value })
      setUser(updated)
      setNotice(`${label} updated.`)
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err)
      throw new Error(fieldErrors[field] || message)
    }
  }

  const wallet = user.walletAddress ? toChecksumAddress(user.walletAddress) : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* --- Header */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-brand-600/30 via-brand-500/10 to-accent-500/20"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold sm:text-3xl">{user.name}</h1>
              <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-xs font-semibold text-brand-300">
                {user.role}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-slate-400">{user.email}</p>
            <p className="mt-1 text-xs text-slate-500">Member since {formatDate(user.createdAt)}</p>
          </div>
        </div>
      </section>

      <Alert type="success" className="mt-6">
        {notice}
      </Alert>

      {/* --- Personal information */}
      <section className="card mt-6 p-6">
        <h2 className="text-lg font-semibold">Personal information</h2>
        <p className="mt-1 text-sm text-slate-400">
          Click the pencil to edit a field. Enter saves, Esc cancels.
        </p>

        <div className="mt-4">
          <EditableField
            label="Full name"
            value={user.name}
            maxLength={60}
            placeholder="Your name"
            validate={(v) => (v.length < 2 ? 'Name must be at least 2 characters.' : '')}
            onSave={saveField('name', 'Name')}
          />
          <EditableField
            label="Bio"
            value={user.bio}
            multiline
            maxLength={500}
            placeholder="Tell collectors about yourself"
            emptyText="No bio yet"
            onSave={saveField('bio', 'Bio')}
          />
          <EditableField label="Email" value={user.email} readOnly readOnlyHint="Your email is your login and can't be changed." />
          <EditableField label="Role" value={user.role} readOnly />
          <EditableField label="Member since" value={formatDate(user.createdAt)} readOnly />
        </div>
      </section>

      {/* --- Wallet */}
      <section className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Verified wallet</h2>
            <p className="mt-1 text-sm text-slate-400">The wallet that owns your NFTs. It's linked by signature.</p>
          </div>
          <Button variant="secondary" size="sm" to="/dashboard">
            Manage wallet
          </Button>
        </div>

        {wallet ? (
          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-ink-800 px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                Verified
              </p>
              <p className="mt-1 break-all font-mono text-sm text-white">{wallet}</p>
            </div>
            <CopyButton value={wallet} label="Copy wallet address" />
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-slate-400">
            No wallet linked yet. Connect MetaMask and verify it on the dashboard.
          </p>
        )}
      </section>
    </div>
  )
}
