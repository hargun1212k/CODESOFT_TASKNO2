import { useState } from 'react';
import { useStore } from '../store.jsx';

export default function SignIn() {
  const { dispatch } = useStore();
  const [email, setEmail] = useState('aanya@redline.studio');
  const [password, setPassword] = useState('redline123');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid work email.');
    if (password.length < 6) return setError('Passwords have at least 6 characters.');
    dispatch({ type: 'signIn', user: { email } });
  };

  return (
    <main className="signin">
      <section className="signin-art">
        <div className="mark"><span /> Redline <small>Project Manager</small></div>
        <h1>Run every project like it is a flagship launch.</h1>
        <p>Boards, timelines, workload and time tracking in one sharp workspace for studios that ship.</p>
        <ul>
          <li>Live project health, not guesswork</li>
          <li>Drag-and-drop boards with a real timeline</li>
          <li>Time tracking on every task</li>
        </ul>
      </section>
      <form className="signin-form" onSubmit={submit}>
        <span className="eyebrow red">Sign in</span>
        <h2>Welcome back.</h2>
        <label className="field">
          <span className="eyebrow">Work email</span>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </label>
        <label className="field">
          <span className="eyebrow">Password</span>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-lg" type="submit">Enter workspace</button>
        <p className="muted small">Prototype: sample workspace, details are pre-filled. Any valid email and a password of six characters or more will work.</p>
      </form>
    </main>
  );
}
