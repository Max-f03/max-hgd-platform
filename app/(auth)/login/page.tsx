"use client"

import { useActionState, useState } from "react"
import { loginAction } from "./actions"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[#D8D4CF]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-60 w-60 -translate-x-1/2 rounded-full bg-[#2563EB]/15 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen w-full items-stretch justify-stretch">
        <div className="grid w-full min-h-screen grid-cols-1 bg-[#F7F7F7] lg:grid-cols-[1.02fr_1.28fr]">
          <section className="relative flex min-h-[56vh] flex-col justify-between overflow-hidden p-9 text-white lg:min-h-screen">
            <div className="absolute inset-0 bg-[radial-gradient(100%_100%_at_20%_0%,rgba(37,99,235,0.25)_0%,rgba(7,16,27,0.98)_50%,rgba(6,12,20,1)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(51,115,255,0.22)_0%,rgba(0,0,0,0)_55%,rgba(37,99,235,0.2)_100%)]" />

            <div className="relative z-10 flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full border border-white/25 bg-white/10 p-[3px]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white/95 text-[11px] font-bold text-slate-900">
                  M
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Max HGD Suite</p>
            </div>

            <div className="relative z-10 max-w-sm">
              <h1 className="text-[34px] font-semibold leading-[1.14] tracking-tight">
                One platform to streamline your admin analytics
              </h1>
              <p className="mt-4 text-sm leading-6 text-slate-300/90">
                Pilotez vos projets, vos clients et votre communication depuis une interface claire, rapide et élégante.
              </p>
              <div className="mt-8 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
              </div>
            </div>
          </section>

          <section className="relative flex min-h-[44vh] flex-col bg-[#F7F7F7] px-6 py-8 sm:px-10 lg:min-h-screen lg:px-14">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-bold text-slate-700">
                M
              </div>
              <p className="text-xs text-slate-500">
                Pas de compte ?{" "}
                <Link href="/contact" className="font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900">
                  Contact
                </Link>
              </p>
            </div>

            {/* Centre vertical */}
            <div className="flex flex-1 items-center justify-center">
              <div className="w-full max-w-sm animate-[fadeIn_450ms_ease-out]">
                <div className="text-center">
                  <h2 className="text-[28px] font-semibold tracking-tight text-slate-900">Welcome back</h2>
                  <p className="mt-2 text-sm text-slate-500">Please enter your details to sign in your account</p>
                </div>

                {state?.error && (
                  <div className="mt-6 flex animate-[fadeIn_350ms_ease-out] items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{state.error}</span>
                  </div>
                )}

                <form action={formAction} className="mt-8 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email</label>
                    <input
                      name="email"
                      type="email"
                      placeholder="johndoe@mail.com"
                      required
                      className="h-11 w-full rounded-[10px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Password</label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="minimum 8 character"
                        required
                        className="h-11 w-full rounded-[10px] border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={pending}
                    className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-sm font-semibold text-white shadow-[0_8px_18px_rgba(29,78,216,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <Link href="/" className="transition hover:text-slate-700">
                © 2026 MaxHGD
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/" className="transition hover:text-slate-700">
                  Privacy
                </Link>
                <Link href="/contact" className="transition hover:text-slate-700">
                  Support
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
