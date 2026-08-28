import { Link } from "react-router-dom";
import Paper from "@mui/material/Paper";
import { ArrowLeft, Quote, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Rating from "../../components/ui/Rating";

const BENEFITS = [
  { icon: Truck, text: "Track every order and reorder in two taps" },
  { icon: Sparkles, text: "Member-only pricing and early access to drops" },
  { icon: ShieldCheck, text: "Warranty claims handled by us, not the brand" },
];

/**
 * Shared shell for the authentication section — brand storytelling on one side,
 * the form on the other, collapsing to a single column on small screens.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-800 p-12 text-white lg:flex lg:flex-col">
        <div className="relative">
          <Link
            to="/"
            className="flex items-center gap-2.5"
            aria-label="Nova home"
          >
            <span className="grid size-9 place-items-center rounded bg-white/15">
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                <path
                  d="M7 17V7l10 10V7"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-xl font-medium tracking-tight">Nova.</span>
          </Link>
        </div>

        <div className="relative mt-auto max-w-md">
          <h2 className="text-3xl font-medium leading-tight">
            The shopping account you will actually use
          </h2>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit.text} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-brand-100">
                  <benefit.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm leading-relaxed text-brand-50">
                  {benefit.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Paper
          component="figure"
          elevation={0}
          className="relative mt-10 p-6"
          sx={{ borderRadius: 1, bgcolor: "rgba(255,255,255,0.08)", m: 0 }}
        >
          <Quote className="size-6 text-brand-200" aria-hidden="true" />
          <blockquote className="mt-3 text-sm leading-relaxed text-brand-50">
            “Signed up for the free returns, stayed for the curation. It is the
            only tech shop I do not second-guess.”
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-brand-500 text-xs font-medium">
              HO
            </span>
            <span>
              <span className="block text-sm font-medium">Hannah Okafor</span>
              <Rating value={5} size="xs" showValue={false} />
            </span>
          </figcaption>
        </Paper>
      </div>

      <div className="flex items-center justify-center bg-ink-100 px-4 py-12 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition hover:text-brand-700"
          >
            <ArrowLeft className="size-4" />
            Back to store
          </Link>

          <Paper elevation={2} className="p-6 sm:p-8" sx={{ borderRadius: 1 }}>
            <h1 className="text-2xl font-medium tracking-tight text-ink-900">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-ink-600">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </Paper>

          {footer ? (
            <div className="mt-6 text-center text-sm text-ink-600">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
