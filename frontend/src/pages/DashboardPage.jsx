import Button from '../components/ui/Button'
import WalletPanel from '../components/wallet/WalletPanel'
import { useAuth } from '../hooks/useAuth'

function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/5 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-white">{children}</dd>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold">Welcome, {user.name.split(' ')[0]}</h1>
        </div>
        <Button variant="secondary" to="/profile">
          Edit profile
        </Button>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Account</h2>
          <dl className="mt-3">
            <InfoRow label="Name">{user.name}</InfoRow>
            <InfoRow label="Email">{user.email}</InfoRow>
            <InfoRow label="Role">
              <span className="rounded-md bg-brand-500/15 px-2 py-0.5 text-xs text-brand-300">{user.role}</span>
            </InfoRow>
            <InfoRow label="Member since">{memberSince}</InfoRow>
          </dl>
        </section>

        <WalletPanel />
      </div>
    </div>
  )
}
