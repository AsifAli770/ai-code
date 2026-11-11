import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useWallet } from '../hooks/useWallet'
import Logo from './Logo'
import Button from './ui/Button'
import WalletButton from './wallet/WalletButton'

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
  }`

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { isConnected, disconnect } = useWallet()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    // The MetaMask connection belongs to the browser, not the app user.
    // Disconnect it on logout so the next person to log in here must
    // connect and choose their own account explicitly.
    if (isConnected) disconnect()
    logout()
    setOpen(false)
    navigate('/login')
  }

  const links = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/studio', label: 'Create' },
        { to: '/artwork', label: 'My artwork' },
        { to: '/profile', label: 'Profile' },
      ]
    : []

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-slate-400 lg:inline">
                Hi, <span className="font-medium text-white">{user.name.split(' ')[0]}</span>
              </span>
              <WalletButton />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
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
          className="rounded-lg p-2 text-slate-300 hover:bg-white/5 md:hidden"
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
        <div className="border-t border-white/5 px-4 pb-4 pt-2 md:hidden">
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
                <Button variant="secondary" size="sm" className="w-full" onClick={handleLogout}>
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
    </header>
  )
}
