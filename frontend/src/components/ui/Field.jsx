import { forwardRef, useId, useState } from 'react'
import { AlertCircle, Check, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils'

const CONTROL_BASE =
  'w-full rounded-lg border bg-white text-sm text-ink-900 transition-[border-color,box-shadow] duration-150 placeholder:text-ink-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-50'

const CONTROL_STATE = {
  idle:
    'border-[rgba(0,0,0,0.23)] hover:border-ink-900 focus:border-brand-600 focus:shadow-[inset_0_0_0_1px_var(--color-brand-600)]',
  error:
    'border-rose-600 focus:border-rose-600 focus:shadow-[inset_0_0_0_1px_#d32f2f]',
}

function FieldShell({ id, label, hint, error, required, children, className }) {
  return (
    <div className={cn('space-y-1', className)}>
      {label ? (
        <label htmlFor={id} className="block text-xs font-medium tracking-[0.03em] text-ink-700">
          {label}
          {required ? (
            <span className="ml-0.5 text-rose-600" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1.5 text-xs font-medium text-rose-700 animate-fade-in"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-600">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export const TextField = forwardRef(function TextField(
  {
    label,
    hint,
    error,
    required,
    type = 'text',
    icon: Icon,
    className,
    inputClassName,
    id: providedId,
    ...props
  },
  ref,
) {
  const autoId = useId()
  const id = providedId ?? autoId
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && revealed ? 'text' : type

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500"
            aria-hidden="true"
          />
        ) : null}
        <input
          ref={ref}
          id={id}
          type={resolvedType}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            CONTROL_BASE,
            error ? CONTROL_STATE.error : CONTROL_STATE.idle,
            'h-11 px-3.5',
            Icon && 'pl-10',
            isPassword && 'pr-11',
            inputClassName,
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-800"
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
    </FieldShell>
  )
})

export const SelectField = forwardRef(function SelectField(
  { label, hint, error, required, options = [], className, id: providedId, ...props },
  ref,
) {
  const autoId = useId()
  const id = providedId ?? autoId

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div className="relative">
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            CONTROL_BASE,
            error ? CONTROL_STATE.error : CONTROL_STATE.idle,
            'h-11 appearance-none pl-3.5 pr-10',
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>
              {option.label ?? option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  )
})

export function TextAreaField({
  label,
  hint,
  error,
  required,
  rows = 3,
  className,
  id: providedId,
  ...props
}) {
  const autoId = useId()
  const id = providedId ?? autoId

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          CONTROL_BASE,
          error ? CONTROL_STATE.error : CONTROL_STATE.idle,
          'resize-y px-3.5 py-2.5',
        )}
        {...props}
      />
    </FieldShell>
  )
}

export function Checkbox({ label, description, className, ...props }) {
  const id = useId()
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <span className="relative mt-0.5 inline-flex">
        <input
          id={id}
          type="checkbox"
          className="peer size-5 cursor-pointer appearance-none rounded-sm border-2 border-ink-500 bg-white transition-all checked:border-brand-600 checked:bg-brand-600 hover:border-brand-500"
          {...props}
        />
        <Check
          className="pointer-events-none absolute left-0.5 top-0.5 size-4 text-white opacity-0 transition-opacity peer-checked:opacity-100"
          strokeWidth={3.5}
          aria-hidden="true"
        />
      </span>
      <label htmlFor={id} className="cursor-pointer select-none text-sm leading-snug text-ink-800">
        <span className="font-medium">{label}</span>
        {description ? <span className="block text-xs text-ink-600">{description}</span> : null}
      </label>
    </div>
  )
}

/** Card-styled radio used for shipping and payment method selection. */
export function RadioCard({ name, value, checked, onChange, title, detail, trailing, icon: Icon }) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-all duration-150',
        checked
          ? 'border-brand-600 bg-brand-50 shadow-[inset_0_0_0_1px_var(--color-brand-600)]'
          : 'border-ink-300 bg-white hover:border-ink-500 hover:bg-ink-50',
      )}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="size-4 shrink-0 accent-brand-600"
      />
      {Icon ? (
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg transition-colors',
            checked ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink-900">{title}</span>
        {detail ? <span className="block text-xs text-ink-600">{detail}</span> : null}
      </span>
      {trailing ? (
        <span className="shrink-0 text-sm font-medium text-ink-900">{trailing}</span>
      ) : null}
    </label>
  )
}
