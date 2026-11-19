import React, { useState } from 'react';
import {
  Building2,
  Eye,
  EyeOff,
  Globe,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  X,
} from 'lucide-react';
import { FacilityConfig } from '../types/caresync';

interface LoginScreenProps {
  darkMode: boolean;
  facilityConfig: FacilityConfig;
  onToggleDark: () => void;
  onSignIn: (username: string, password: string) => void;
  onConfigureFacility: (payload: {
    adminUsername: string;
    adminPassword: string;
    name: string;
    type: 'PHC' | 'Hospital';
    lga: string;
    stateName: string;
    ward: string;
  }) => boolean;
  onToast: (msg: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  darkMode,
  facilityConfig,
  onToggleDark,
  onSignIn,
  onConfigureFacility,
  onToast,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [language, setLanguage] = useState('English');

  const [setupOpen, setSetupOpen] = useState(false);
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('');
  const [facName, setFacName] = useState(
    facilityConfig.configured ? facilityConfig.name : ''
  );
  const [facType, setFacType] = useState<'PHC' | 'Hospital'>(facilityConfig.type);
  const [facLga, setFacLga] = useState(facilityConfig.lga);
  const [facState, setFacState] = useState(facilityConfig.stateName);
  const [facWard, setFacWard] = useState(facilityConfig.ward);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn(username, password);
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onConfigureFacility({
      adminUsername: adminUser,
      adminPassword: adminPass,
      name: facName,
      type: facType,
      lga: facLga,
      stateName: facState,
      ward: facWard,
    });
    if (ok) {
      setSetupOpen(false);
      setAdminPass('');
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-[#F2F6F3] dark:bg-[#0D1510]">
      <div className="hidden lg:flex lg:w-[44%] flex-col justify-between bg-[#0B5D34] p-10 text-white relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -left-16 bottom-12 h-64 w-64 rounded-full border border-white/10" />

        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/assets/crest.png"
            alt="Nigerian Coat of Arms"
            className="h-12 w-12 object-contain"
          />
          <div>
            <div className="font-display text-lg font-bold tracking-tight">MaKSET</div>
            <div className="text-xs text-emerald-100/80">Primary Healthcare System</div>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight">
            Connected Care. Anywhere.
          </h1>
          <p className="text-base leading-relaxed text-emerald-50/90">
            Built for primary health centres operating offline or on low-bandwidth links.
            Record OPD, ANC, immunization, laboratory results, pharmacy dispensing, and
            facility referrals seamlessly on one device.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/15">
            <div>
              <div className="font-display text-2xl font-bold tabular-nums">6 Tiers</div>
              <div className="text-xs text-emerald-100/80">PHC to NCDC &amp; FMOH reporting</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold tabular-nums">Offline-First</div>
              <div className="text-xs text-emerald-100/80">Automatic sync on reconnect</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-emerald-100/80">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>
            {facilityConfig.configured
              ? `Device registered to ${facilityConfig.name} · ${facilityConfig.lga}, ${facilityConfig.stateName}`
              : 'Device pending facility setup by Admin'}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="font-display text-lg font-bold text-[#0B5D34] dark:text-[#39C27A]">
              MaKSET
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-2.5 py-1.5 text-xs">
              <Globe className="h-3.5 w-3.5 text-[#5D6E64] dark:text-[#98AEA1]" />
              <select
                aria-label="Language"
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  onToast(`Interface language set to ${e.target.value}`);
                }}
                className="bg-transparent text-xs font-medium outline-none cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Hausa">Hausa</option>
                <option value="Yoruba">Yoruba</option>
                <option value="Igbo">Igbo</option>
              </select>
            </div>
            <button
              type="button"
              onClick={onToggleDark}
              aria-label="Toggle color theme"
              className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] text-[#13221A] dark:text-[#EAF2ED] hover:bg-[#E7EFEA] dark:hover:bg-[#1C2D23] transition"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mx-auto my-8 w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-flex rounded-2xl bg-white p-2 shadow-sm border border-[#D9E3DD] dark:border-[#26382E]">
              <img
                src="/assets/nphcda.png"
                alt="NPHCDA logo"
                className="h-24 w-24 object-contain"
              />
            </div>
            <h2 className="font-display text-2xl font-extrabold text-[#0B5D34] dark:text-[#39C27A]">
              MaKSET
            </h2>
            <p className="mt-1 text-sm text-[#5D6E64] dark:text-[#98AEA1]">
              Primary Healthcare Information System
            </p>
          </div>

          <div
            className={`mb-5 flex items-center justify-between gap-3 rounded-xl border p-3.5 ${
              facilityConfig.configured
                ? 'border-[#C6DED0] dark:border-[#254434] bg-[#E6F3EC] dark:bg-[#152A1F]'
                : 'border-amber-300 dark:border-amber-800 bg-[#FFF3D6] dark:bg-[#2F250D]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${
                  facilityConfig.configured ? 'bg-[#0B5D34]' : 'bg-[#B45309]'
                }`}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-[#13221A] dark:text-[#EAF2ED]">
                  {facilityConfig.configured
                    ? facilityConfig.name
                    : 'Facility Not Configured'}
                </div>
                <div className="truncate text-xs text-[#4C6155] dark:text-[#98AEA1]">
                  {facilityConfig.configured
                    ? `${facilityConfig.lga} LGA · ${facilityConfig.stateName}`
                    : 'Admin setup required to bind facility'}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="lg_user"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4C6155] dark:text-[#98AEA1]"
              >
                Username or Staff ID
              </label>
              <input
                id="lg_user"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or staff ID"
                className="w-full min-h-[46px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-3.5 py-2.5 text-sm outline-none focus:border-[#0B5D34] dark:focus:border-[#39C27A]"
              />
            </div>

            <div>
              <label
                htmlFor="lg_pass"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4C6155] dark:text-[#98AEA1]"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="lg_pass"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full min-h-[46px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-white dark:bg-[#15221B] px-3.5 py-2.5 pr-11 text-sm outline-none focus:border-[#0B5D34] dark:focus:border-[#39C27A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5D6E64] hover:bg-[#F2F6F3] dark:text-[#98AEA1] dark:hover:bg-[#1F3127]"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[#0B5D34] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#094D2B] active:scale-[0.99] transition whitespace-nowrap"
            >
              Log In
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setSetupOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-[#0B5D34] dark:text-[#39C27A] hover:underline"
            >
              <Smartphone className="h-4 w-4" />
              {facilityConfig.configured ? 'Update facility setup (Admin)' : 'Set up facility & device (Admin)'}
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-[#6B7C72] dark:text-[#84998D]">
          MaKSET · Offline-first PHC Clinical Information System
        </div>
      </div>

      {setupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#D9E3DD] dark:border-[#24352B] bg-white dark:bg-[#15221B] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Facility Setup (Admin)</h3>
              <button
                type="button"
                onClick={() => setSetupOpen(false)}
                aria-label="Close setup modal"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-[#5D6E64] dark:text-[#98AEA1]">
              Configure the facility assigned to this MaKSET installation. All clinical logs, referrals, and reports will use this facility name.
            </p>
            <form onSubmit={handleSetupSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                    Admin ID / Username
                  </label>
                  <input
                    type="text"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    placeholder="Any admin ID or username"
                    className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="Any password (optional)"
                    className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                  Facility Name
                </label>
                <input
                  type="text"
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  placeholder="e.g. Kafin Madaki Primary Health Centre"
                  className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                    Facility Type
                  </label>
                  <select
                    value={facType}
                    onChange={(e) => setFacType(e.target.value as 'PHC' | 'Hospital')}
                    className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
                  >
                    <option value="PHC">PHC</option>
                    <option value="Hospital">Hospital</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                    Ward
                  </label>
                  <input
                    type="text"
                    value={facWard}
                    onChange={(e) => setFacWard(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                    LGA
                  </label>
                  <input
                    type="text"
                    value={facLga}
                    onChange={(e) => setFacLga(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#5D6E64] dark:text-[#98AEA1]">
                    State
                  </label>
                  <input
                    type="text"
                    value={facState}
                    onChange={(e) => setFacState(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-[#D9E3DD] dark:border-[#26382E] bg-[#FAFDFB] dark:bg-[#192820] px-3 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-[#0B5D34] text-sm font-bold text-white hover:bg-[#094D2B]"
              >
                Save Facility Setup
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
