import { Link } from 'react-router-dom'
import {
  Banknote,
  Building2,
  CreditCard,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Smartphone,
  User,
  Wallet,
} from 'lucide-react'
import { Checkbox, RadioCard, SelectField, TextAreaField, TextField } from '../ui/Field'
import { SHIPPING_METHODS } from '../../context/CartContext'
import { cn, formatPrice } from '../../lib/utils'

export const COUNTRIES = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SG', label: 'Singapore' },
  { value: 'AU', label: 'Australia' },
]

export const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit or debit card', detail: 'Visa, Mastercard, Amex, Rupay', icon: CreditCard },
  { id: 'upi', label: 'UPI', detail: 'Pay by any UPI app', icon: Smartphone },
  { id: 'paypal', label: 'PayPal', detail: 'Pay with your PayPal balance', icon: Wallet },
  { id: 'cod', label: 'Cash on delivery', detail: 'Pay the courier on arrival', icon: Banknote },
]

export function FormSection({ title, description, icon: Icon, children, className }) {
  return (
    <section className={cn('surface-card p-5 sm:p-6', className)}>
      <div className="flex items-start gap-3.5">
        {Icon ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-ink-900">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function ShippingStep({ values, errors, onField, shippingMethodId, onShippingMethod }) {
  return (
    <div className="space-y-5">
      <FormSection
        title="Contact details"
        description="We use these only for order updates and delivery."
        icon={User}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="First name"
            icon={User}
            autoComplete="given-name"
            placeholder="Priya"
            value={values.firstName}
            onChange={onField('firstName')}
            error={errors.firstName}
            required
          />
          <TextField
            label="Last name"
            autoComplete="family-name"
            placeholder="Raghunathan"
            value={values.lastName}
            onChange={onField('lastName')}
            error={errors.lastName}
            required
          />
          <TextField
            label="Email address"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@example.com"
            hint="Your receipt and tracking link go here."
            value={values.email}
            onChange={onField('email')}
            error={errors.email}
            required
          />
          <TextField
            label="Phone number"
            type="tel"
            icon={Phone}
            autoComplete="tel"
            placeholder="+91 98765 43210"
            hint="For delivery coordination only."
            value={values.phone}
            onChange={onField('phone')}
            error={errors.phone}
            required
          />
        </div>
      </FormSection>

      <FormSection title="Shipping address" description="Where should we send this order?" icon={MapPin}>
        <div className="grid gap-4">
          <TextField
            label="Address line 1"
            autoComplete="address-line1"
            placeholder="Flat 402, Prestige Residency"
            value={values.address1}
            onChange={onField('address1')}
            error={errors.address1}
            required
          />
          <TextField
            label="Address line 2"
            autoComplete="address-line2"
            placeholder="Landmark, building or area (optional)"
            value={values.address2}
            onChange={onField('address2')}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="City"
              autoComplete="address-level2"
              placeholder="Bengaluru"
              value={values.city}
              onChange={onField('city')}
              error={errors.city}
              required
            />
            <TextField
              label="State / region"
              autoComplete="address-level1"
              placeholder="Karnataka"
              value={values.state}
              onChange={onField('state')}
              error={errors.state}
              required
            />
            <TextField
              label="Postal code"
              autoComplete="postal-code"
              inputMode="numeric"
              placeholder="560001"
              value={values.postalCode}
              onChange={onField('postalCode')}
              error={errors.postalCode}
              required
            />
          </div>
          <SelectField
            label="Country"
            options={COUNTRIES}
            value={values.country}
            onChange={onField('country')}
            required
          />
          <TextAreaField
            label="Delivery notes"
            placeholder="Gate code, preferred time window, or where to leave the parcel."
            value={values.notes}
            onChange={onField('notes')}
          />
        </div>
      </FormSection>

      <FormSection
        title="Delivery speed"
        description="Free standard delivery applies above $250."
        icon={Building2}
      >
        <div className="grid gap-3">
          {SHIPPING_METHODS.map((method) => (
            <RadioCard
              key={method.id}
              name="shipping-method"
              value={method.id}
              checked={shippingMethodId === method.id}
              onChange={() => onShippingMethod(method.id)}
              title={method.label}
              detail={method.detail}
              trailing={method.price === 0 ? 'Free' : formatPrice(method.price)}
            />
          ))}
        </div>
      </FormSection>
    </div>
  )
}

/** Formats card input into 4-digit groups as the user types. */
export function formatCardNumber(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

export function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function PaymentStep({ values, errors, onField, onRawField, sameAsShipping, onSameAsShipping }) {
  return (
    <div className="space-y-5">
      <FormSection
        title="Payment method"
        description="All transactions are encrypted end to end."
        icon={CreditCard}
      >
        <div className="grid gap-3">
          {PAYMENT_METHODS.map((method) => (
            <RadioCard
              key={method.id}
              name="payment-method"
              value={method.id}
              checked={values.paymentMethod === method.id}
              onChange={() => onRawField('paymentMethod', method.id)}
              title={method.label}
              detail={method.detail}
              icon={method.icon}
            />
          ))}
        </div>

        {values.paymentMethod === 'card' ? (
          <div className="mt-5 grid gap-4 rounded-2xl border border-ink-100 bg-ink-50/60 p-4 animate-fade-in">
            <TextField
              label="Name on card"
              autoComplete="cc-name"
              placeholder="PRIYA RAGHUNATHAN"
              value={values.cardName}
              onChange={onField('cardName')}
              error={errors.cardName}
              required
            />
            <TextField
              label="Card number"
              autoComplete="cc-number"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              value={values.cardNumber}
              onChange={(event) => onRawField('cardNumber', formatCardNumber(event.target.value))}
              error={errors.cardNumber}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Expiry date"
                autoComplete="cc-exp"
                inputMode="numeric"
                placeholder="MM/YY"
                value={values.cardExpiry}
                onChange={(event) => onRawField('cardExpiry', formatExpiry(event.target.value))}
                error={errors.cardExpiry}
                required
              />
              <TextField
                label="CVC"
                autoComplete="cc-csc"
                inputMode="numeric"
                placeholder="123"
                value={values.cardCvc}
                onChange={(event) =>
                  onRawField('cardCvc', event.target.value.replace(/\D/g, '').slice(0, 4))
                }
                error={errors.cardCvc}
                required
              />
            </div>
            <p className="text-xs text-ink-400">
              Demo mode — use any 16-digit number. No card is charged and nothing is stored.
            </p>
          </div>
        ) : null}

        {values.paymentMethod === 'upi' ? (
          <div className="mt-5 animate-fade-in">
            <TextField
              label="UPI ID"
              placeholder="yourname@bank"
              value={values.upiId}
              onChange={onField('upiId')}
              error={errors.upiId}
              hint="You will get a collect request in your UPI app."
              required
            />
          </div>
        ) : null}

        {values.paymentMethod === 'cod' ? (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 animate-fade-in">
            Cash on delivery adds a $5 handling fee, collected by the courier at your door.
          </p>
        ) : null}
      </FormSection>

      <FormSection title="Billing address" description="Used for your invoice." icon={Landmark}>
        <Checkbox
          label="Same as my shipping address"
          checked={sameAsShipping}
          onChange={(event) => onSameAsShipping(event.target.checked)}
        />

        {!sameAsShipping ? (
          <div className="mt-5 grid gap-4 animate-fade-in">
            <TextField
              label="Address line 1"
              placeholder="Billing address"
              value={values.billingAddress1}
              onChange={onField('billingAddress1')}
              error={errors.billingAddress1}
              required
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label="City"
                value={values.billingCity}
                onChange={onField('billingCity')}
                error={errors.billingCity}
                required
              />
              <TextField
                label="State / region"
                value={values.billingState}
                onChange={onField('billingState')}
                error={errors.billingState}
                required
              />
              <TextField
                label="Postal code"
                inputMode="numeric"
                value={values.billingPostalCode}
                onChange={onField('billingPostalCode')}
                error={errors.billingPostalCode}
                required
              />
            </div>
            <SelectField
              label="Country"
              options={COUNTRIES}
              value={values.billingCountry}
              onChange={onField('billingCountry')}
            />
            <TextField
              label="GST number"
              placeholder="Optional — for business invoices"
              value={values.gstNumber}
              onChange={onField('gstNumber')}
            />
          </div>
        ) : null}
      </FormSection>
    </div>
  )
}

export function ReviewStep({ values, shippingMethod, sameAsShipping, terms, onTerms, termsError }) {
  const paymentLabel =
    PAYMENT_METHODS.find((method) => method.id === values.paymentMethod)?.label ?? 'Card'

  const billingLines = sameAsShipping
    ? [values.address1, values.address2, `${values.city}, ${values.state} ${values.postalCode}`]
    : [
        values.billingAddress1,
        `${values.billingCity}, ${values.billingState} ${values.billingPostalCode}`,
      ]

  return (
    <div className="space-y-5">
      <FormSection title="Deliver to" icon={MapPin}>
        <div className="space-y-1 text-sm text-ink-700">
          <p className="font-bold text-ink-900">
            {values.firstName} {values.lastName}
          </p>
          <p>{values.address1}</p>
          {values.address2 ? <p>{values.address2}</p> : null}
          <p>
            {values.city}, {values.state} {values.postalCode}
          </p>
          <p>{COUNTRIES.find((country) => country.value === values.country)?.label}</p>
          <p className="pt-2 text-ink-500">
            {values.email} · {values.phone}
          </p>
          {values.notes ? (
            <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600">
              Note: {values.notes}
            </p>
          ) : null}
        </div>
      </FormSection>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormSection title="Delivery speed" icon={Building2}>
          <p className="text-sm font-bold text-ink-900">{shippingMethod.label}</p>
          <p className="text-sm text-ink-500">{shippingMethod.detail}</p>
        </FormSection>

        <FormSection title="Payment" icon={CreditCard}>
          <p className="text-sm font-bold text-ink-900">{paymentLabel}</p>
          {values.paymentMethod === 'card' && values.cardNumber ? (
            <p className="text-sm text-ink-500">
              Ending in {values.cardNumber.replace(/\s/g, '').slice(-4)}
            </p>
          ) : null}
          {values.paymentMethod === 'upi' && values.upiId ? (
            <p className="text-sm text-ink-500">{values.upiId}</p>
          ) : null}
          <p className="mt-2 text-xs text-ink-400">
            Billing: {billingLines.filter(Boolean).join(', ')}
          </p>
        </FormSection>
      </div>

      <div className="surface-card p-5 sm:p-6">
        <Checkbox
          label="I agree to the terms of sale and the return policy"
          description="You can cancel within one hour of ordering, free of charge."
          checked={terms}
          onChange={(event) => onTerms(event.target.checked)}
        />
        {termsError ? (
          <p className="mt-2 text-xs font-medium text-rose-600 animate-fade-in">{termsError}</p>
        ) : null}
        <p className="mt-4 text-xs leading-relaxed text-ink-400">
          By confirming this order you authorise Nova Commerce Ltd. to charge the selected payment
          method. Read our{' '}
          <Link to="/checkout" className="font-semibold text-brand-700 underline underline-offset-2">
            refund policy
          </Link>{' '}
          for details on partial returns.
        </p>
      </div>
    </div>
  )
}
