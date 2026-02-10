import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { apiClient } from '../../api/client';
import { useAuth } from '../../state/AuthContext';

const strongPasswordRules = [
  { key: 'len', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'lower', label: 'At least 1 lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'upper', label: 'At least 1 uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'num', label: 'At least 1 number', test: (p) => /\d/.test(p) },
  { key: 'special', label: 'At least 1 special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
  { key: 'space', label: 'No spaces', test: (p) => !/\s/.test(p) },
];

const inputClass =
  'w-full rounded-md border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60';

const Profile = () => {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [initial, setInitial] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', text: '' }); 
  const [passwordToast, setPasswordToast] = useState({ type: '', text: '' });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await apiClient.get('/profile/me');
        setUser(data);
        setForm({ name: data.name || '', email: data.email || '' });
        setInitial({ name: data.name || '', email: data.email || '' });
      } catch {
        setToast({ type: 'error', text: 'Failed to load profile.' });
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, []);

  const isDirty = useMemo(() => {
    return (
      form.name.trim() !== (initial.name || '').trim() ||
      form.email.trim() !== (initial.email || '').trim()
    );
  }, [form, initial]);

  const passwordChecks = useMemo(() => {
    const p = passwordForm.newPassword || '';
    const results = strongPasswordRules.map((r) => ({ ...r, ok: r.test(p) }));
    const isStrong = results.every((r) => r.ok);
    return { results, isStrong };
  }, [passwordForm.newPassword]);

  const unmetRules = useMemo(() => {
    return passwordChecks.results.filter((r) => !r.ok);
  }, [passwordChecks.results]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (toast.text) setToast({ type: '', text: '' });
  };

  const validate = () => {
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name) return 'Name is required.';
    if (!email) return 'Email is required.';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Please enter a valid email.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setToast({ type: 'error', text: validationError });
      return;
    }

    if (!isDirty) {
      setToast({ type: 'error', text: 'No changes to save.' });
      return;
    }

    try {
      setLoading(true);
      const payload = { name: form.name.trim(), email: form.email.trim() };
      const { data } = await apiClient.put('/profile', payload);

      setUser(data);
      setForm({ name: data.name || '', email: data.email || '' });
      setInitial({ name: data.name || '', email: data.email || '' });
      setToast({ type: 'success', text: 'Profile updated successfully.' });
    } catch {
      setToast({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (passwordToast.text) setPasswordToast({ type: '', text: '' });
  };

  const validatePassword = () => {
    if (!passwordForm.currentPassword) return 'Current password is required.';
    if (!passwordForm.newPassword) return 'New password is required.';
    if (!passwordChecks.isStrong) return 'New password is not strong enough.';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const validationError = validatePassword();
    if (validationError) {
      setPasswordToast({ type: 'error', text: validationError });
      return;
    }

    try {
      setPasswordLoading(true);
      const payload = {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      };
      await apiClient.put('/profile/password', payload);

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordToast({ type: 'success', text: 'Password updated successfully.' });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to update password.';
      setPasswordToast({ type: 'error', text: message });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Layout>
      <div className="w-full flex justify-center px-4 py-10">
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">Profile settings</h1>
              <p className="mt-1 text-sm text-slate-400">
                Update your basic account information used across the dashboard.
              </p>
            </div>

            {isDirty && !initialLoading && (
              <span className="mt-1 inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300">
                Unsaved changes
              </span>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            {initialLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-40 animate-pulse rounded bg-slate-800/70" />
                <div className="h-10 w-full animate-pulse rounded bg-slate-800/70" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-800/70" />
                <div className="h-10 w-full animate-pulse rounded bg-slate-800/70" />
                <div className="h-9 w-32 animate-pulse rounded bg-slate-800/70" />
              </div>
            ) : (
              <>
                {toast.text && (
                  <div
                    className={`mb-4 rounded-md border px-3 py-2 text-sm ${
                      toast.type === 'success'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-red-500/40 bg-red-500/10 text-red-300'
                    }`}
                  >
                    {toast.text}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Name</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className={inputClass}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={inputClass}
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Changing your email may require verification.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ name: initial.name, email: initial.email });
                        setToast({ type: '', text: '' });
                      }}
                      disabled={loading || !isDirty}
                      className="rounded-md border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reset
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !isDirty}
                      className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow">
            <h2 className="text-lg font-semibold text-white mb-4">Change password</h2>

            {passwordToast.text && (
              <div
                className={`mb-4 rounded-md border px-3 py-2 text-sm ${
                  passwordToast.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-red-500/40 bg-red-500/10 text-red-300'
                }`}
              >
                {passwordToast.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Current password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  className={inputClass}
                  disabled={passwordLoading}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">New password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className={inputClass}
                  disabled={passwordLoading}
                />
                {passwordForm.newPassword && unmetRules.length > 0 && (
                  <div className="mt-2 rounded-md border border-slate-800 bg-slate-950/40 p-3">
                    <p className="mb-2 text-xs text-slate-400">Password must include:</p>
                    <ul className="space-y-1">
                      {unmetRules.map((r) => (
                        <li key={r.key} className="text-xs text-slate-400">
                          • {r.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Confirm new password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className={inputClass}
                  disabled={passwordLoading}
                />
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading || !passwordChecks.isStrong}
                  className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {passwordLoading ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
