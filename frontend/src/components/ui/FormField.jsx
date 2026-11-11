import { useId } from 'react'

const inputClasses = (error) =>
  `w-full rounded-xl border bg-ink-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition
   focus:outline-none focus:ring-2 ${
     error
       ? 'border-red-500/60 focus:ring-red-500/40'
       : 'border-white/10 focus:border-brand-500 focus:ring-brand-500/30'
   } disabled:opacity-60`

/** Labelled input or textarea with an inline error message. */
export default function FormField({ label, error, hint, multiline = false, className = '', ...props }) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const Component = multiline ? 'textarea' : 'input'

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <Component
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`${inputClasses(error)} ${multiline ? 'min-h-28 resize-y' : ''}`}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
