import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Lock, Mail, User } from 'lucide-react'
import AuthLayout from './AuthLayout'
import Button from '../../components/ui/Button'
import { Checkbox, TextField } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { cn } from '../../lib/utils'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const STRENGTH_LEVELS = [
  { label: 'Too short', tone: 'bg-rose-500', text: 'text-rose-600' },
  { label: 'Weak', tone: 'bg-orange-500', text: 'text-orange-600' },
  { label: 'Fair', tone: 'bg-amber-500', text: 'text-amber-600' },
  { label: 'Strong', tone: 'bg-emerald-500', text: 'text-emerald-600' },
  { label: 'Excellent', tone: 'bg-emerald-600', text: 'text-emerald-700' },
]

function scorePassword(password) {
  if (!password) return -1
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return Math.min(score, 4)
}

function PasswordStrength({ password }) {
  const score = scorePassword(password)
  if (score < 0) return null

  const level = STRENGTH_LEVELS[score]

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              index <= score ? level.tone : 'bg-ink-200',
            )}
          />
        ))}
      </div>
      <p className={cn('mt-1.5 text-xs font-semibold', level.text)}>
        Password strength: {level.label}
      </p>
    </div>
  )
}

const REQUIREMENTS = [
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { label: 'One number', test: (value) => /\d/.test(value) },
]

export default function Signup() {
  const { signup, isPending } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.from ?? '/'

  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [accepted, setAccepted] = useState(false)
  const [marketing, setMarketing] = useState(true)
  const [errors, setErrors] = useState({})

  const setField = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const requirementState = useMemo(
    () => REQUIREMENTS.map((rule) => ({ ...rule, met: rule.test(values.password) })),
    [values.password],
  )

  const validate = () => {
    const next = {}
    if (!values.name.trim()) next.name = 'Tell us your name.'
    else if (values.name.trim().length < 2) next.name = 'That name looks too short.'

    if (!values.email.trim()) next.email = 'Email address is required.'
    else if (!EMAIL_PATTERN.test(values.email)) next.email = 'Enter a valid email address.'

    if (!values.password) next.password = 'Choose a password.'
    else if (values.password.length < 8) next.password = 'Use at least 8 characters.'

    if (!values.confirm) next.confirm = 'Confirm your password.'
    else if (values.confirm !== values.password) next.confirm = 'Passwords do not match.'

    if (!accepted) next.terms = 'You need to accept the terms to continue.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    const result = await signup({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      newsletterOptIn: marketing,
    })

    if (!result.ok) {
      // Server-side rules (taken email, password strength) land on the field they belong to;
      // anything unattributed shows against the email field.
      const fieldErrors = result.fieldErrors ?? {}
      setErrors(Object.keys(fieldErrors).length ? fieldErrors : { email: result.message })
      return
    }

    toast(`Account created — welcome, ${result.user.name.split(' ')[0]}`, {
      description: marketing ? 'You are subscribed to weekly drops.' : 'Happy shopping.',
    })
    navigate(redirectTo, { replace: true })
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free to join. Free returns, order tracking and member pricing included."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            state={{ from: redirectTo }}
            className="font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
          >
            Log in instead
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField
          label="Full name"
          name="name"
          icon={User}
          autoComplete="name"
          placeholder="Priya Raghunathan"
          value={values.name}
          onChange={setField('name')}
          error={errors.name}
          required
        />

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

        <div>
          <TextField
            label="Password"
            type="password"
            name="password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={values.password}
            onChange={setField('password')}
            error={errors.password}
            required
          />
          <PasswordStrength password={values.password} />

          {values.password ? (
            <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-3">
              {requirementState.map((rule) => (
                <li
                  key={rule.label}
                  className={cn(
                    'flex items-center gap-1.5 text-[0.6875rem] font-medium transition-colors',
                    rule.met ? 'text-emerald-600' : 'text-ink-400',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-3.5 shrink-0 place-items-center rounded-full',
                      rule.met ? 'bg-emerald-100' : 'bg-ink-100',
                    )}
                  >
                    <Check className="size-2.5" strokeWidth={3.5} />
                  </span>
                  {rule.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <TextField
          label="Confirm password"
          type="password"
          name="confirm"
          icon={Lock}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={values.confirm}
          onChange={setField('confirm')}
          error={errors.confirm}
          required
        />

        <div className="space-y-2.5 pt-1">
          <Checkbox
            label="I agree to the Terms of Service and Privacy Policy"
            checked={accepted}
            onChange={(event) => {
              setAccepted(event.target.checked)
              setErrors((current) => ({ ...current, terms: undefined }))
            }}
          />
          {errors.terms ? (
            <p className="text-xs font-medium text-rose-600 animate-fade-in">{errors.terms}</p>
          ) : null}
          <Checkbox
            label="Email me new arrivals and price drops"
            description="One email a week. Unsubscribe any time."
            checked={marketing}
            onChange={(event) => setMarketing(event.target.checked)}
          />
        </div>

        <Button type="submit" size="lg" fullWidth loading={isPending} className="mt-2">
          {isPending ? 'Creating your account' : 'Create account'}
          {isPending ? null : <ArrowRight className="size-4" />}
        </Button>
      </form>
    </AuthLayout>
  )
}
