import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useWallet } from '../hooks/useWallet'
import Logo from './Logo'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import ConfirmDialog from './ui/ConfirmDialog'
import WalletButton from './wallet/WalletButton'

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
  }`

const LogoutIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { isConnected, disconnect } = useWallet()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const askLogout = () => {
    setOpen(false)
    setConfirmLogout(true)
  }

  const handleLogout = () => {
    // The MetaMask connection belongs to the browser, not the app user.
    // Disconnect it on logout so the next person to log in here must
    // connect and choose their own account explicitly.
    if (isConnected) disconnect()
    setConfirmLogout(false)
    logout()
    navigate('/login')
  }

  const links = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/studio', label: 'Create' },
        { to: '/artwork', label: 'My artwork' },
        { to: '/nfts', label: 'My NFTs' },
        { to: '/profile', label: 'Profile' },
      ]
    : []

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <WalletButton />
              <Link
                to="/profile"
                className="rounded-full transition hover:opacity-90 focus-visible:outline-2"
                title={`${user.name} · Profile`}
                aria-label="Your profile"
              >
                <Avatar name={user.name} size="sm" />
              </Link>
              <Button variant="ghost" size="sm" onClick={askLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" to="/login">
                Log in
              </Button>
              <Button size="sm" to="/register">
                Get started
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/5 px-4 pb-4 pt-2 lg:hidden">
          {isAuthenticated && (
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5"
            >
              <Avatar name={user.name} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white">{user.name}</span>
                <span className="block truncate text-xs text-slate-400">View profile</span>
              </span>
            </Link>
          )}
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={navLinkClass} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            {isAuthenticated ? (
              <div className="flex w-full flex-col gap-2">
                <WalletButton fullWidth />
                <Button variant="secondary" size="sm" className="w-full" onClick={askLogout}>
                  Log out
                </Button>
              </div>
            ) : (
              <>
                <Button variant="secondary" size="sm" className="flex-1" to="/login" onClick={() => setOpen(false)}>
                  Log in
                </Button>
                <Button size="sm" className="flex-1" to="/register" onClick={() => setOpen(false)}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {isAuthenticated && (
        <ConfirmDialog
          open={confirmLogout}
          title="Log out of your account?"
          confirmLabel="Log out"
          cancelLabel="Stay logged in"
          variant="danger"
          icon={LogoutIcon}
          onCancel={() => setConfirmLogout(false)}
          onConfirm={handleLogout}
        >
          You'll need your email and password to log back in.
          {isConnected && ' Your wallet will also be disconnected from this site.'} Nothing on the blockchain is
          affected.
        </ConfirmDialog>
      )}
    </header>
  )
}
