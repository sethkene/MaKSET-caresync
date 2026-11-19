import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ClipboardList,
  FileBarChart2,
  Home,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  Sun,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { ROLE_LABELS } from '../data/initialData';
import { CareSyncState, ScreenRoute } from '../types/caresync';

interface AppShellProps {
  state: CareSyncState;
  currentScreen: ScreenRoute;
  title: string;
  subtitle?: string;
  canGoBack: boolean;
  darkMode: boolean;
  unreadNotifications: number;
  taskBadgeCount: number;
  toastMessage: string | null;
  onBack: () => void;
  onNavigate: (route: ScreenRoute, reset?: boolean) => void;
  onSyncNow: () => void;
  onToggleMute: () => void;
  onToggleNinGate: () => void;
  onToggleDark: () => void;
  onSwitchFacilityDemo: () => void;
  onLogout: () => void;
  onToast: (msg: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  state,
  currentScreen,
  title,
  subtitle,
  canGoBack,
  darkMode,
  unreadNotifications,
  taskBadgeCount,
  toastMessage,
  onBack,
  onNavigate,
  onSyncNow,
  onToggleMute,
  onToggleNinGate,
  onToggleDark,
  onSwitchFacilityDemo,
  onLogout,
  onToast,
  children,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const initials = state.staffName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const homeFacilityName = state.facilityConfig.name;
  const isReceivingFacilityDemo =
    state.position !== 'creator' && state.activeFacility !== homeFacilityName;
  const activeFacilityStaffCount = state.staffList.filter(
    (s) => s.fac === state.activeFacility && s.status === 'Active'
  ).length;

  const perms = state.activePermissions;
  const hasTasksAccess = perms.laboratory || perms.pharmacy;

  type NavItem = {
    id: string;
    label: string;
    route: ScreenRoute;
    icon: React.FC<{ className?: string }>;
    badge?: number;
    visible: boolean;
  };

  const allNavItems: NavItem[] = [
    {
      id: 'Home',
      label: 'Home',
      route: 'home',
      icon: Home,
      visible: true,
    },
    {
      id: 'Patients',
      label: 'Patients',
      route: 'search',
      icon: Users,
      visible: !isReceivingFacilityDemo && perms.patients,
    },
    {
      id: 'Tasks',
      label: 'Tasks',
      route: 'tasks',
      icon: ClipboardList,
      badge: taskBadgeCount,
      visible: !isReceivingFacilityDemo && (hasTasksAccess || perms.clinicalEncounters),
    },
    {
      id: 'Reports',
      label: 'Reports',
      route: 'reports',
      icon: FileBarChart2,
      visible: !isReceivingFacilityDemo && perms.reportsDashboards,
    },
    {
      id: 'More',
      label: 'More',
      route: 'more',
      icon: MoreHorizontal,
      visible: !isReceivingFacilityDemo && state.position !== 'creator',
    },
  ];

  const navItems = allNavItems.filter((item) => item.visible);

  const navTabMap: Record<ScreenRoute, string> = {
    splash: '',
    login: '',
    home: 'Home',
    notif: 'Home',
    rfo: 'Home',
    stf: 'Home',
    adm: 'Home',
    search: 'Patients',
    register: 'Patients',
    verify: 'Patients',
    profile: 'Patients',
    hist: 'Patients',
    shr: 'Patients',
    sel: 'Patients',
    encounter: 'Patients',
    ref: 'Patients',
    note: 'Patients',
    refs: 'Home',
    tasks: 'Tasks',
    tdet: 'Tasks',
    reports: 'Reports',
    dash: 'Reports',
    more: 'More',
    surv: 'More',
    cs: 'More',
  };

  const activeNavId = navTabMap[currentScreen] || 'Home';
  const showBottomNav = state.position !== 'creator' && !isReceivingFacilityDemo;

  const drawerContent = (
    <div className="flex h-full flex-col bg-white dark:bg-[#15221B]">
      <div className="bg-[#0B5D34] p-5 text-white">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-base font-bold text-[#0B5D34]">
            {initials || 'MK'}
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation menu"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/90 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 font-display text-lg font-bold leading-snug">
          {state.staffName}
        </div>
        <div className="text-xs text-emerald-100/85 font-mono-tabular">
          Staff ID: {state.staffId}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <div className="space-y-2.5 border-b border-[#E3ECE6] dark:border-[#24352B] pb-3 text-xs">
          <div>
            <div className="text-[#6B7C72] dark:text-[#84998D]">Role</div>
            <div className="font-semibold text-[#13221A] dark:text-[#EAF2ED]">
              {ROLE_LABELS[state.position] || 'Staff'}
            </div>
          </div>
          <div>
            <div className="text-[#6B7C72] dark:text-[#84998D]">Facility</div>
            <div className="font-semibold text-[#13221A] dark:text-[#EAF2ED]">
              {state.activeFacility}
            </div>
          </div>
          <div>
            <div className="text-[#6B7C72] dark:text-[#84998D]">Last synced</div>
            <div className="font-semibold text-[#13221A] dark:text-[#EAF2ED] tabular-nums">
              {state.lastSyncedLabel}
            </div>
          </div>

          {(perms.manageStaff || state.position === 'oc') && state.position !== 'creator' && (
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onNavigate('stf');
              }}
              className="mt-1 flex w-full min-h-[42px] items-center justify-between gap-2 rounded-xl border border-[#0B5D34] dark:border-[#39C27A] bg-[#E6F3EC] dark:bg-[#1B3326] px-3 py-2 text-xs font-bold text-[#0B5D34] dark:text-[#39C27A] hover:bg-[#D7ECE0] dark:hover:bg-[#224030] transition"
            >
              <span className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 shrink-0" />
                <span>Staff &amp; Access</span>
              </span>
              <span className="tabular-nums font-semibold">
                {activeFacilityStaffCount} active
              </span>
            </button>
          )}
        </div>

        <nav className="hidden lg:block space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeNavId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.route, true)}
                className={`flex w-full min-h-[44px] items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-[#E6F3EC] text-[#0B5D34] dark:bg-[#1B3326] dark:text-[#39C27A]'
                    : 'text-[#394A40] hover:bg-[#F2F6F3] dark:text-[#C8DAD0] dark:hover:bg-[#1C2D23]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.badge ? (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-md bg-[#C62828] px-1.5 text-[11px] font-bold text-white tabular-nums">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="space-y-1 pt-1 border-t border-[#E3ECE6] dark:border-[#24352B]">
          {perms.reportsDashboards && (
            <>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onNavigate('dash');
                }}
                className="flex w-full min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#13221A] dark:text-[#EAF2ED] hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23]"
              >
                <BarChart3 className="h-4 w-4 text-[#0B5D34] dark:text-[#39C27A]" />
                <span>Dashboards (6 Tiers)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onNavigate('surv');
                }}
                className="flex w-full min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#13221A] dark:text-[#EAF2ED] hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23]"
              >
                <Activity className="h-4 w-4 text-[#0B5D34] dark:text-[#39C27A]" />
                <span>Surveillance (IDSR)</span>
              </button>
            </>
          )}

          {state.position !== 'creator' && (
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onNavigate('more', true);
              }}
              className="flex w-full min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#13221A] dark:text-[#EAF2ED] hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23]"
            >
              <RefreshCw className="h-4 w-4 text-[#0B5D34] dark:text-[#39C27A]" />
              <span>Sync &amp; Audit Status</span>
            </button>
          )}

          {perms.referrals && (
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onSwitchFacilityDemo();
              }}
              className="flex w-full min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#13221A] dark:text-[#EAF2ED] hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23]"
            >
              <Building2 className="h-4 w-4 text-[#0B5D34] dark:text-[#39C27A]" />
              <span>Switch Receiving Facility View</span>
            </button>
          )}

          {perms.patients && (
            <button
              type="button"
              onClick={onToggleNinGate}
              className="flex w-full min-h-[44px] items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-[#13221A] dark:text-[#EAF2ED] hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23]"
            >
              <span className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[#0B5D34] dark:text-[#39C27A]" />
                <span>NIN Verification Gate</span>
              </span>
              <span className="text-xs font-bold text-[#0B5D34] dark:text-[#39C27A]">
                {state.ninGateEnabled ? 'On' : 'Off'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleMute}
            className="flex w-full min-h-[44px] items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-[#13221A] dark:text-[#EAF2ED] hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23]"
          >
            <span className="flex items-center gap-3">
              {state.muteSound ? (
                <VolumeX className="h-4 w-4 text-[#6B7C72]" />
              ) : (
                <Volume2 className="h-4 w-4 text-[#0B5D34] dark:text-[#39C27A]" />
              )}
              <span>Alert Sound</span>
            </span>
            <span className="text-xs font-bold text-[#5D6E64] dark:text-[#98AEA1]">
              {state.muteSound ? 'Off' : 'On'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleDark}
            className="flex w-full min-h-[44px] items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-[#13221A] dark:text-[#EAF2ED] hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23]"
          >
            <span className="flex items-center gap-3">
              {darkMode ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-[#0B5D34]" />
              )}
              <span>Appearance</span>
            </span>
            <span className="text-xs font-bold text-[#5D6E64] dark:text-[#98AEA1]">
              {darkMode ? 'Dark' : 'Light'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              onToast(`Device registered to ${state.facilityConfig.name}`);
            }}
            className="flex w-full min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#13221A] dark:text-[#EAF2ED] hover:bg-[#F2F6F3] dark:hover:bg-[#1C2D23]"
          >
            <Building2 className="h-4 w-4 text-[#6B7C72]" />
            <span>Device Profile</span>
          </button>
        </div>
      </div>

      <div className="border-t border-[#E3ECE6] dark:border-[#24352B] p-3">
        <button
          type="button"
          onClick={() => {
            setDrawerOpen(false);
            onLogout();
          }}
          className="flex w-full min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[#C62828] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-[#F2F6F3] dark:bg-[#0D1510]">
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 border-r border-[#D9E3DD] dark:border-[#24352B]">
        <div className="sticky top-0 h-screen overflow-hidden">{drawerContent}</div>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl">
            {drawerContent}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-[#094D2B] bg-[#0B5D34] pt-[env(safe-area-inset-top)] text-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              {canGoBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="Go back"
                  className="-ml-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white hover:bg-white/10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open menu"
                  className="-ml-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white hover:bg-white/10 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="truncate font-display text-base font-bold leading-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="truncate text-xs text-emerald-100/85">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {state.position !== 'creator' && (
                <button
                  type="button"
                  onClick={onSyncNow}
                  title={
                    state.offline
                      ? 'Offline — waiting for internet connection'
                      : 'Online — tap to sync pending records now'
                  }
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                    state.offline
                      ? 'bg-[#FFF3D6] text-[#8A5A00]'
                      : 'bg-[#1D7F4C] text-white border border-white/20'
                  }`}
                >
                  {state.offline ? (
                    <WifiOff className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Wifi className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="hidden sm:inline">
                    {state.offline
                      ? `Offline (${state.pendingCount} pending)`
                      : state.pendingCount > 0
                        ? `Online · ${state.pendingCount} pending`
                        : 'Online · Synced'}
                  </span>
                  <span className="sm:hidden">
                    {state.offline ? 'Offline' : 'Online'}
                  </span>
                </button>
              )}

              {perms.clinicalEncounters && !isReceivingFacilityDemo && (
                <button
                  type="button"
                  onClick={() => onNavigate('notif')}
                  aria-label="Notifications"
                  className="relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C62828] px-1 text-[11px] font-bold text-white tabular-nums">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </header>

        {state.position !== 'creator' && currentScreen === 'home' && (
          <div
            className={`w-full border-b px-4 py-1.5 text-xs font-medium ${
              state.offline
                ? 'border-amber-200 bg-[#FFF3D6] text-[#7A5100] dark:border-amber-900/60 dark:bg-[#2F250D] dark:text-amber-200'
                : 'border-emerald-200 bg-[#E6F3EC] text-[#0B5D34] dark:border-emerald-900/60 dark:bg-[#173022] dark:text-emerald-200'
            }`}
          >
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    state.offline ? 'bg-[#F59E0B]' : 'bg-[#16A34A]'
                  }`}
                />
                <strong className="font-bold">
                  {state.offline ? 'Offline mode' : 'Online'}
                </strong>
                <span className="hidden sm:inline text-current/85">
                  {state.offline
                    ? '— No network connection detected. Records are saved locally and sync automatically when online.'
                    : '— Connected. Records sync automatically.'}
                </span>
              </span>
              <span className="tabular-nums font-semibold shrink-0">
                {state.offline
                  ? `Last synced: ${state.lastSyncedLabel}`
                  : state.pendingCount > 0
                    ? `Syncing ${state.pendingCount} pending…`
                    : 'All records synced'}
              </span>
            </div>
          </div>
        )}

        <main
          className={`mx-auto w-full max-w-6xl flex-1 px-4 pt-3 pb-5 sm:px-6 ${
            showBottomNav ? 'pb-24 lg:pb-8' : 'pb-8'
          }`}
        >
          {children}
        </main>
      </div>

      {showBottomNav && navItems.length > 1 && (
        <nav
          aria-label="Mobile navigation"
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#D9E3DD] dark:border-[#24352B] bg-white/95 dark:bg-[#15221B]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        >
          <div
            className="grid h-14 items-center"
            style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeNavId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.route, true)}
                  className={`relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${
                    active
                      ? 'text-[#0B5D34] dark:text-[#39C27A]'
                      : 'text-[#5D6E64] dark:text-[#98AEA1]'
                  }`}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {item.badge ? (
                      <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C62828] px-1 text-[10px] font-bold text-white tabular-nums">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 lg:bottom-6 max-w-md w-[calc(100%-2rem)] rounded-xl bg-[#13221A] px-4 py-3 text-center text-sm font-medium text-white shadow-xl border border-white/10"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
