import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import AuthLayout from './AuthLayout'
import Button from '../../components/ui/Button'
import { Checkbox, TextField } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SOCIAL_PROVIDERS = [
  { id: 'google', label: 'Google', glyph: 'G' },
  { id: 'apple', label: 'Apple', glyph: 'A' },
  { id: 'github', label: 'GitHub', glyph: 'GH' },
]

export default function Login() {
  const { login, isPending } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.from ?? '/'

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [remember, setRemember] = useState(true)

  const setField = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const validate = () => {
    const next = {}
    if (!values.email.trim()) next.email = 'Email address is required.'
    else if (!EMAIL_PATTERN.test(values.email)) next.email = 'Enter a valid email address.'
    if (!values.password) next.password = 'Password is required.'
    else if (values.password.length < 6) next.password = 'Must be at least 6 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    const result = await login(values)
    if (!result.ok) {
      setErrors({ password: result.message })
      return
    }
    toast(`Welcome back, ${result.user.name.split(' ')[0]}`, {
      description: 'Your cart and saved items are ready.',
    })
    navigate(redirectTo, { replace: true })
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to track orders, save products and check out faster."
      footer={
        <>
          New to Nova?{' '}
          <Link
            to="/signup"
            state={{ from: redirectTo }}
            className="font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField
          label="Email address"
          type="email"
          name="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={setField('email')}
          error={errors.email}
          required
        />

        <TextField
          label="Password"
          type="password"
          name="password"
          icon={Lock}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          onChange={setField('password')}
          error={errors.password}
          required
        />

        <div className="flex items-center justify-between gap-3 pt-1">
          <Checkbox
            label="Keep me signed in"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <button
            type="button"
            onClick={() => toast('Password reset link sent', { tone: 'info' })}
            className="text-sm font-semibold text-brand-700 transition hover:text-brand-800"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" size="lg" fullWidth loading={isPending} className="mt-2">
          {isPending ? 'Signing you in' : 'Log in'}
          {isPending ? null : <ArrowRight className="size-4" />}
        </Button>

        <p className="rounded-lg bg-ink-50 px-3.5 py-2.5 text-xs leading-relaxed text-ink-600">
          This is a UI demo — any valid email with a password of 6 or more characters will sign you
          in.
        </p>
      </form>

      <div className="relative my-7">
        <span className="absolute inset-x-0 top-1/2 h-px bg-ink-200" aria-hidden="true" />
        <span className="relative mx-auto block w-fit bg-white px-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
          or continue with
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {SOCIAL_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => toast(`${provider.label} sign-in is not wired up in this demo`, { tone: 'info' })}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-ink-300 bg-white text-sm font-medium text-ink-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
          >
            <span aria-hidden="true" className="text-base">
              {provider.glyph}
            </span>
            <span className="hidden sm:inline">{provider.label}</span>
          </button>
        ))}
      </div>
    </AuthLayout>
  )
}
