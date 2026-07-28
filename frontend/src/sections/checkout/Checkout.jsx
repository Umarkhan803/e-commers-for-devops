import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Lock, ShieldCheck, ShoppingBag, UserCheck } from 'lucide-react'
import CheckoutSteps, { CHECKOUT_STEPS } from '../../components/checkout/CheckoutSteps'
import {
  COUNTRIES,
  PaymentStep,
  ReviewStep,
  ShippingStep,
} from '../../components/checkout/CheckoutForms'
import OrderSummary from '../../components/cart/OrderSummary'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/Misc'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { placeOrder as placeOrderRequest } from '../../api/account'
import { ApiError } from '../../api/client'
import { formatPrice } from '../../lib/utils'

const countryLabel = (code) =>
  COUNTRIES.find((country) => country.value === code)?.label ?? code

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const INITIAL_VALUES = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
  notes: '',
  paymentMethod: 'card',
  cardName: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
  upiId: '',
  billingAddress1: '',
  billingCity: '',
  billingState: '',
  billingPostalCode: '',
  billingCountry: 'IN',
  gstNumber: '',
}

/** Per-step validation rules. Each returns a field → message map. */
const VALIDATORS = {
  shipping: (values) => {
    const errors = {}
    if (!values.firstName.trim()) errors.firstName = 'First name is required.'
    if (!values.lastName.trim()) errors.lastName = 'Last name is required.'
    if (!values.email.trim()) errors.email = 'Email address is required.'
    else if (!EMAIL_PATTERN.test(values.email)) errors.email = 'Enter a valid email address.'
    if (!values.phone.trim()) errors.phone = 'Phone number is required.'
    else if (values.phone.replace(/\D/g, '').length < 8) errors.phone = 'Enter a full phone number.'
    if (!values.address1.trim()) errors.address1 = 'Street address is required.'
    if (!values.city.trim()) errors.city = 'City is required.'
    if (!values.state.trim()) errors.state = 'State or region is required.'
    if (!values.postalCode.trim()) errors.postalCode = 'Postal code is required.'
    else if (values.postalCode.replace(/\s/g, '').length < 4)
      errors.postalCode = 'That postal code looks too short.'
    return errors
  },
  payment: (values, { sameAsShipping }) => {
    const errors = {}

    if (values.paymentMethod === 'card') {
      if (!values.cardName.trim()) errors.cardName = 'Name on card is required.'
      const digits = values.cardNumber.replace(/\s/g, '')
      if (!digits) errors.cardNumber = 'Card number is required.'
      else if (digits.length < 15) errors.cardNumber = 'Enter all 16 digits.'
      if (!values.cardExpiry) errors.cardExpiry = 'Expiry is required.'
      else if (!/^\d{2}\/\d{2}$/.test(values.cardExpiry)) errors.cardExpiry = 'Use MM/YY format.'
      else {
        const [month, year] = values.cardExpiry.split('/').map(Number)
        if (month < 1 || month > 12) errors.cardExpiry = 'Month must be between 01 and 12.'
        else {
          const expiry = new Date(2000 + year, month, 0)
          if (expiry < new Date()) errors.cardExpiry = 'That card has expired.'
        }
      }
      if (!values.cardCvc) errors.cardCvc = 'CVC is required.'
      else if (values.cardCvc.length < 3) errors.cardCvc = 'CVC must be 3 or 4 digits.'
    }

    if (values.paymentMethod === 'upi') {
      if (!values.upiId.trim()) errors.upiId = 'UPI ID is required.'
      else if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(values.upiId))
        errors.upiId = 'Enter a UPI ID like name@bank.'
    }

    if (!sameAsShipping) {
      if (!values.billingAddress1.trim()) errors.billingAddress1 = 'Billing address is required.'
      if (!values.billingCity.trim()) errors.billingCity = 'City is required.'
      if (!values.billingState.trim()) errors.billingState = 'State or region is required.'
      if (!values.billingPostalCode.trim()) errors.billingPostalCode = 'Postal code is required.'
    }

    return errors
  },
  review: () => ({}),
}

/**
 * Checkout / payment section. Validation gates each step, so the confirm button
 * is only reachable once shipping and payment details are complete and valid.
 */
export default function Checkout() {
  const { items, totals, shippingMethod, shippingMethodId, setShippingMethodId, refresh } = useCart()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState('shipping')
  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [terms, setTerms] = useState(false)
  const [termsError, setTermsError] = useState(null)
  const [placing, setPlacing] = useState(false)

  // Prefill from the signed-in account so returning customers type less.
  useEffect(() => {
    if (!user) return
    const [firstName, ...rest] = user.name.split(' ')
    setValues((current) => ({
      ...current,
      firstName: current.firstName || firstName,
      lastName: current.lastName || rest.join(' '),
      email: current.email || user.email,
    }))
  }, [user])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const onField = (field) => (event) => {
    const { value } = event.target
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const onRawField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const stepIndex = CHECKOUT_STEPS.findIndex((candidate) => candidate.id === step)

  const goNext = () => {
    const validator = VALIDATORS[step]
    const nextErrors = validator(values, { sameAsShipping })

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      toast('Please fix the highlighted fields', {
        tone: 'error',
        description: `${Object.keys(nextErrors).length} field${Object.keys(nextErrors).length === 1 ? '' : 's'} need attention.`,
      })
      return
    }

    setErrors({})
    setStep(CHECKOUT_STEPS[Math.min(stepIndex + 1, CHECKOUT_STEPS.length - 1)].id)
  }

  const goBack = () => setStep(CHECKOUT_STEPS[Math.max(stepIndex - 1, 0)].id)

  const placeOrder = async () => {
    if (!terms) {
      setTermsError('Please accept the terms of sale to place your order.')
      return
    }
    setTermsError(null)
    setPlacing(true)

    const shippingAddress = {
      fullName: `${values.firstName} ${values.lastName}`.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      line1: values.address1.trim(),
      line2: values.address2.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
      postalCode: values.postalCode.trim(),
      country: countryLabel(values.country),
    }

    const cardLast4 = values.cardNumber.replace(/\D/g, '').slice(-4)

    try {
      // The server recalculates prices from the cart, so nothing money-related is sent.
      const order = await placeOrderRequest({
        shippingAddress,
        billingSameAsShipping: sameAsShipping,
        billingAddress: sameAsShipping
          ? null
          : {
              ...shippingAddress,
              line1: values.billingAddress1.trim(),
              line2: '',
              city: values.billingCity.trim(),
              state: values.billingState.trim(),
              postalCode: values.billingPostalCode.trim(),
              country: countryLabel(values.billingCountry),
            },
        paymentMethod: values.paymentMethod,
        cardLast4: values.paymentMethod === 'card' ? cardLast4 : undefined,
        shippingMethod: shippingMethodId,
        acceptedTerms: true,
      })

      navigate('/order-confirmed', {
        state: { order, countryCode: values.country },
        replace: true,
      })
      // The order endpoint empties the basket server-side; pull the new state.
      refresh()
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not reach the payment service. Please try again.'
      toast('Order could not be placed', { tone: 'error', description: message })
      setPlacing(false)
    }
  }

  const summaryAction =
    step === 'review' ? (
      <Button size="lg" fullWidth loading={placing} onClick={placeOrder}>
        {placing ? 'Confirming your order' : `Confirm order · ${formatPrice(totals.total)}`}
      </Button>
    ) : (
      <Button size="lg" fullWidth onClick={goNext}>
        {step === 'shipping' ? 'Continue to payment' : 'Review your order'}
        <ArrowRight className="size-4" />
      </Button>
    )

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShoppingBag}
          title="There is nothing to check out"
          description="Add a product to your cart and the checkout will open up here."
          action={
            <Button as={Link} to="/shop" size="lg">
              Browse the catalogue
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="bg-ink-50">
      <div className="border-b border-ink-100 bg-white">
        <div className="container-page py-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                Secure checkout
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                <Lock className="size-3.5 text-emerald-600" aria-hidden="true" />
                256-bit TLS encryption · your details are never stored
              </p>
            </div>
            <Button as={Link} to="/cart" variant="ghost" size="sm">
              <ArrowLeft className="size-4" />
              Back to cart
            </Button>
          </div>

          <CheckoutSteps current={step} onNavigate={setStep} className="mt-7" />
        </div>
      </div>

      <div className="container-page py-8">
        {!isAuthenticated ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-50/70 px-5 py-4">
            <p className="flex items-center gap-2.5 text-sm text-brand-900">
              <UserCheck className="size-5 shrink-0 text-brand-600" aria-hidden="true" />
              <span>
                <span className="font-bold">Have an account?</span> Log in to autofill your details
                and keep this order in your history.
              </span>
            </p>
            <div className="flex gap-2">
              <Button as={Link} to="/login" state={{ from: '/checkout' }} variant="outline" size="sm">
                Log in
              </Button>
              <Button as={Link} to="/signup" state={{ from: '/checkout' }} size="sm">
                Sign up
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-7 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0 animate-fade-in" key={step}>
            {step === 'shipping' ? (
              <ShippingStep
                values={values}
                errors={errors}
                onField={onField}
                shippingMethodId={shippingMethodId}
                onShippingMethod={setShippingMethodId}
              />
            ) : null}

            {step === 'payment' ? (
              <PaymentStep
                values={values}
                errors={errors}
                onField={onField}
                onRawField={onRawField}
                sameAsShipping={sameAsShipping}
                onSameAsShipping={setSameAsShipping}
              />
            ) : null}

            {step === 'review' ? (
              <ReviewStep
                values={values}
                shippingMethod={shippingMethod}
                sameAsShipping={sameAsShipping}
                terms={terms}
                onTerms={(checked) => {
                  setTerms(checked)
                  if (checked) setTermsError(null)
                }}
                termsError={termsError}
              />
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {stepIndex > 0 ? (
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              ) : (
                <Button as={Link} to="/cart" variant="outline">
                  <ArrowLeft className="size-4" />
                  Back to cart
                </Button>
              )}

              {step === 'review' ? (
                <Button size="lg" loading={placing} onClick={placeOrder}>
                  {placing ? 'Confirming' : 'Confirm order'}
                </Button>
              ) : (
                <Button size="lg" onClick={goNext}>
                  {step === 'shipping' ? 'Continue to payment' : 'Review order'}
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </div>

            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-400">
              <ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" />
              Protected by Nova Buyer Guarantee — full refund if your order does not arrive.
            </p>
          </div>

          <div className="lg:sticky lg:top-[10.5rem] lg:self-start">
            <OrderSummary variant="checkout" showPromo={false} showMeter={false} action={summaryAction} />

            {values.paymentMethod === 'cod' ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800">
                Pay {formatPrice(totals.total)} in cash when the courier hands over your parcel.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
