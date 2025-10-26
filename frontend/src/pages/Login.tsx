import { forwardRef, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

type AuthResponse = {
  user?: { id: string; email: string; name: string }
  [k: string]: any
}

const getErr = (err: any) =>
  err?.response?.data?.message || err?.message || 'Something went wrong'

/** ---------- Input (forwardRef) ---------- */
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <label className="block">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        ref={ref}
        {...props}
        className={`mt-1 w-full rounded-xl border px-3 py-2 outline-none ring-0 focus:border-gray-300 focus:ring-2 focus:ring-black/10 ${
          error ? 'border-rose-300' : 'border-gray-200 bg-white/70'
        } ${className}`}
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  )
)
Input.displayName = 'Input'

/** ---------- Page ---------- */
export const Login = ({ onLoggedIn }: { onLoggedIn: (u: AuthResponse) => void }) => {
  const [showRegister, setShowRegister] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)

  // Schemas
  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email('Enter a valid email'),
        password: z.string().min(1, 'Password is required'),
      }),
    []
  )

  const registerSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, 'Name is required').max(50, 'Max 50 chars'),
        email: z.string().email('Enter a valid email'),
        password: z.string().min(6, 'At least 6 characters'),
      }),
    []
  )

  // Use the right resolver for the current mode
  const resolver = zodResolver(showRegister ? registerSchema : loginSchema)

  type LoginForm = z.infer<typeof loginSchema> & Partial<z.infer<typeof registerSchema>>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginForm>({
    resolver,
    mode: 'onBlur',
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      if (showRegister) {
        await api.post('/auth/register', {
          name: values.name!,
          email: values.email,
          password: values.password,
        })
      }
      const { data } = await api.post<AuthResponse>('/auth/login', {
        email: values.email,
        password: values.password,
      })
      onLoggedIn(data)
    } catch (err: any) {
      setServerError(getErr(err))
    }
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-rose-50 via-white to-blue-50">
      {/* Floating gradient blobs */}
      <div className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full bg-gradient-to-br from-rose-300 to-amber-200 opacity-60 blur-3xl animate-[spin_30s_linear_infinite]" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-sky-300 to-indigo-200 opacity-60 blur-3xl animate-[spin_40s_linear_infinite_reverse]" />

      <div className="container relative z-10 mx-auto grid min-h-screen place-items-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-md ring-1 ring-black/5">
          <h1 className="mb-6 text-center text-2xl font-semibold">
            {showRegister ? 'Create your account' : 'Welcome back'}
          </h1>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {showRegister && (
              <Input
                label="Name"
                placeholder="Your name"
                {...register('name')}
                error={errors.name?.message}
                autoComplete="name"
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              error={errors.email?.message}
              autoComplete="email"
            />

            <label className="block">
              <span className="text-sm text-gray-700">Password</span>
              <div
                className={`mt-1 flex w-full items-center rounded-xl border px-3 ring-0 focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-black/10 ${
                  errors.password ? 'border-rose-300' : 'border-gray-200 bg-white/70'
                }`}
              >
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  className="w-full bg-transparent py-2 outline-none"
                  placeholder={showRegister ? 'Create a password' : 'Your password'}
                  autoComplete={showRegister ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPw((s) => !s)}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && (
                <span className="mt-1 block text-xs text-rose-600">{errors.password.message}</span>
              )}
            </label>

            {serverError && (
              <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
                {serverError}
              </div>
            )}

            <button
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-2xl bg-black px-4 py-3 text-white transition active:scale-[0.99] disabled:opacity-50"
            >
              <span className="relative z-10">
                {isSubmitting ? 'Please wait…' : showRegister ? 'Create account' : 'Login'}
              </span>
              <span className="absolute inset-0 -z-0 bg-gradient-to-r from-black via-gray-800 to-black opacity-0 blur-2xl transition group-hover:opacity-40" />
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            {showRegister ? (
              <>
                Already have an account?{' '}
                <button
                  className="font-medium text-gray-900 underline-offset-4 hover:underline"
                  onClick={() => {
                    setShowRegister(false)
                    setServerError(null)
                    reset({ name: '', email: '', password: '' })
                  }}
                >
                  Back to login
                </button>
              </>
            ) : (
              <>
                Need an account?{' '}
                <button
                  className="font-medium text-gray-900 underline-offset-4 hover:underline"
                  onClick={() => {
                    setShowRegister(true)
                    setServerError(null)
                    reset({ name: '', email: '', password: '' })
                  }}
                >
                  Register
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
