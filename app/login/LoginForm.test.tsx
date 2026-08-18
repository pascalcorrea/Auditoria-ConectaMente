import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoginForm } from './LoginForm'

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  getSession: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

const mockedSignIn = signIn as unknown as ReturnType<typeof vi.fn>
const mockedGetSession = getSession as unknown as ReturnType<typeof vi.fn>
const mockedUseRouter = useRouter as unknown as ReturnType<typeof vi.fn>
const mockedUseSearchParams = useSearchParams as unknown as ReturnType<typeof vi.fn>

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'cliente-isapre@conectamente.cl' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'ChangeMe123!' } })
  fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))
}

describe('LoginForm post-login redirect', () => {
  const push = vi.fn()

  beforeEach(() => {
    push.mockClear()
    mockedGetSession.mockClear()
    mockedUseRouter.mockReturnValue({ push })
  })

  it('redirects a cliente user to /cliente/casos when no callbackUrl is present', async () => {
    mockedUseSearchParams.mockReturnValue({ get: () => null })
    mockedSignIn.mockResolvedValue({ error: null })
    mockedGetSession.mockResolvedValue({ user: { rol: 'cliente' } })

    render(<LoginForm />)
    fillAndSubmit()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/cliente/casos'))
  })

  it('redirects a backoffice user to /admin when no callbackUrl is present', async () => {
    mockedUseSearchParams.mockReturnValue({ get: () => null })
    mockedSignIn.mockResolvedValue({ error: null })
    mockedGetSession.mockResolvedValue({ user: { rol: 'backoffice' } })

    render(<LoginForm />)
    fillAndSubmit()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin'))
  })

  it('honors an explicit callbackUrl over the role-based default', async () => {
    mockedUseSearchParams.mockReturnValue({ get: (key: string) => (key === 'callbackUrl' ? '/admin/casos/nuevo' : null) })
    mockedSignIn.mockResolvedValue({ error: null })
    mockedGetSession.mockResolvedValue({ user: { rol: 'backoffice' } })

    render(<LoginForm />)
    fillAndSubmit()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/casos/nuevo'))
    // A callbackUrl short-circuits before getSession is ever needed.
    expect(mockedGetSession).not.toHaveBeenCalled()
  })

  it('does not redirect on invalid credentials', async () => {
    mockedUseSearchParams.mockReturnValue({ get: () => null })
    mockedSignIn.mockResolvedValue({ error: 'CredentialsSignin' })

    render(<LoginForm />)
    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Email o contraseña incorrectos')).toBeInTheDocument())
    expect(push).not.toHaveBeenCalled()
  })

  it('rejects an absolute-URL callbackUrl (open redirect) and falls back to the role default', async () => {
    mockedUseSearchParams.mockReturnValue({ get: (key: string) => (key === 'callbackUrl' ? 'https://evil.com' : null) })
    mockedSignIn.mockResolvedValue({ error: null })
    mockedGetSession.mockResolvedValue({ user: { rol: 'cliente' } })

    render(<LoginForm />)
    fillAndSubmit()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/cliente/casos'))
    expect(push).not.toHaveBeenCalledWith('https://evil.com')
  })

  it('rejects a protocol-relative callbackUrl (open redirect) and falls back to the role default', async () => {
    mockedUseSearchParams.mockReturnValue({ get: (key: string) => (key === 'callbackUrl' ? '//evil.com' : null) })
    mockedSignIn.mockResolvedValue({ error: null })
    mockedGetSession.mockResolvedValue({ user: { rol: 'cliente' } })

    render(<LoginForm />)
    fillAndSubmit()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/cliente/casos'))
    expect(push).not.toHaveBeenCalledWith('//evil.com')
  })
})
