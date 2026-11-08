import { useState } from 'react'
import { Eye, EyeOff, Layers2 } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import ThemeToggle from '../components/common/ThemeToggle.jsx'
import useAuth from '../hooks/useAuth.js'

export default function DemoAccess({ mode = 'login' }) {
  const isRegister = mode === 'register'
  const navigate = useNavigate()
  const location = useLocation()
  const { register, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function enterDemo(event) {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return
    const formData = new FormData(form)
    const name = String(formData.get('name') || '').trim()
    const submittedEmail = (email || String(formData.get('email') || '')).trim()
    const submittedPassword = password || String(formData.get('password') || '')
    const confirmation = String(formData.get('confirmPassword') || '')

    if (isRegister && name.length < 2) { setError('Enter your full name (at least 2 characters).'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submittedEmail)) { setError('Enter a valid email address.'); return }
    if (submittedPassword.length < 8) { setError('Use at least 8 characters.'); return }
    if (isRegister && submittedPassword !== confirmation) { setError('The passwords do not match.'); return }
    if (isRegister && !formData.get('terms')) { setError('Please confirm to continue.'); return }

    setError('')
    setIsSubmitting(true)
    try {
      if (isRegister) await register({ fullName: name, email: submittedEmail, password: submittedPassword })
      else await login({ email: submittedEmail, password: submittedPassword })
      const requestedPath = location.state?.from
      const destination = typeof requestedPath === 'string' && requestedPath.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : '/dashboard'
      navigate(destination, { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to continue. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <main className="fb-demo-access">
    <header className="fb-demo-access__top"><Link className="fb-brand" to="/dashboard"><span className="fb-brand__mark"><Layers2 aria-hidden="true"/></span><span>FlowBoard</span></Link><ThemeToggle/></header>
    <section aria-labelledby="demo-access-title" className="fb-demo-access__panel">
      <h1 id="demo-access-title">{isRegister ? 'Create Account' : 'Welcome back'}</h1>
      <p className="fb-demo-access__intro">{isRegister ? 'Create a local account to keep your workspace private in this browser.' : 'Log in with the email and password you registered.'}</p>
      <form className="fb-project-form" onSubmit={enterDemo}>
        {isRegister && <label className="fb-form-field"><span>Your name</span><input autoComplete="name" maxLength={80} minLength={2} name="name" required/></label>}
        <label className="fb-form-field"><span>Email address</span><input autoComplete="email" name="email" onChange={event => setEmail(event.target.value)} required type="email" value={email}/></label>
        <label className="fb-form-field"><span>Password</span><span className="fb-demo-access__password"><input autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} name="password" onChange={event => setPassword(event.target.value)} required type={passwordVisible ? 'text' : 'password'} value={password}/><button aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} className="fb-demo-access__password-toggle" onClick={() => setPasswordVisible(value => !value)} type="button">{passwordVisible ? <EyeOff aria-hidden="true"/> : <Eye aria-hidden="true"/>}</button></span></label>
        {isRegister && <label className="fb-form-field"><span>Confirm password</span><input autoComplete="new-password" minLength={8} name="confirmPassword" required type={passwordVisible ? 'text' : 'password'}/></label>}
        {!isRegister && <div className="fb-demo-access__login-options"><label><input checked={rememberMe} onChange={event => setRememberMe(event.target.checked)} type="checkbox"/>Remember me</label></div>}
        {isRegister && <label className="fb-demo-access__terms"><input name="terms" required type="checkbox"/><span>I agree to store my account data locally in this browser.</span></label>}
        {error && <p className="fb-form-error" role="alert">{error}</p>}
        <Button className="fb-demo-access__submit" disabled={isSubmitting} type="submit" variant="primary">{isSubmitting ? 'Please wait…' : isRegister ? 'Create Account' : 'Log in'}</Button>
      </form>
      <p className="fb-demo-access__switch">{isRegister ? 'Already have an account?' : 'New here?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Return to Login' : 'Register'}</Link></p>
    </section>
    <p className="fb-demo-access__footer">FlowBoard stores accounts and workspace data locally in this browser.</p>
  </main>
}
