import React, { useEffect, useMemo, useState } from 'react';
import {
    Calendar as CalendarIcon,
    CreditCard,
    Home,
    Landmark,
    Settings,
    Sparkles,
} from 'lucide-react';
import {
    AppLanguage,
    AppPage,
    AuthScreenState,
    CalendarStickyNote,
    MascotMood,
    PaymentStatus,
    StudentPaymentRequest,
} from './types';
import {
    createInitialSummary,
    localizeSummary,
    readCalendarNotes,
    readLanguagePref,
    readPrefBool,
    readPrefString,
    writeCalendarNotes,
    writePrefBool,
    writePrefString,
} from './data/kasData';
import { LoginScreen, WelcomeScreen } from './components/AuthScreens';
import { CalendarOverlay } from './components/CalendarOverlay';
import { DashboardTab } from './components/DashboardTab';
import { PaymentsTab } from './components/PaymentsTab';
import { LedgerTab } from './components/LedgerTab';
import { AssistantTab } from './components/AssistantTab';
import { FloatingScreenMascot } from './components/FloatingScreenMascot';
import {
    disableRealPushNotifications,
    enableRealPushNotifications,
    getPushCapabilityStatus,
    PushCapabilityStatus,
    registerServiceWorker,
    syncPushSchedule,
    triggerNextFunFactPush,
    triggerPaymentConfirmationPush,
    triggerScheduledBillPush,
} from './services/pushNotifications';
import {
    ProfilePage,
    SettingsPage,
} from './components/SettingsAndProfile';
import {
    KasMateApiError,
    loadStudentSnapshot,
    loginStudent,
    logoutStudent,
    StudentLoginCredentials,
    StudentProfile,
    submitStudentPayment,
} from './services/kasMateApi';
import {
    clearAndroidPushRegistration,
    enableAndroidPushNotifications,
  getAndroidPushPermissionStatus,
    getAndroidInstallationId,
    isAndroidPushAvailable,
} from './services/androidPushNotifications';
import {
  clearStudentSession,
  loadStudentSession,
  saveStudentSession,
} from './services/studentSession';

function getInitialPageFromUrl(): AppPage {
    if (typeof window === 'undefined') return AppPage.HOME;
    const pageParam = new URLSearchParams(window.location.search).get('page');
    if (pageParam === 'payments') return AppPage.PAYMENTS;
    if (pageParam === 'ledger') return AppPage.LEDGER;
    if (pageParam === 'assistant') return AppPage.ASSISTANT;
    if (pageParam === 'settings') return AppPage.SETTINGS;
    return AppPage.HOME;
}

export function App() {
    const [darkMode, setDarkMode] = useState<boolean>(() =>
        readPrefBool('dark_mode', false)
    );
    const [language, setLanguage] = useState<AppLanguage>(() =>
        readLanguagePref()
    );
    const [authScreen, setAuthScreen] = useState<AuthScreenState>(() => {
        return AuthScreenState.WELCOME;
    });
  const [isRestoringSession, setIsRestoringSession] = useState(true);
    const [activeUserName, setActiveUserName] = useState<string>('');
    const [studentToken, setStudentToken] = useState<string | null>(null);
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

    const [summary, setSummary] = useState(() => createInitialSummary());
    const [page, setPage] = useState<AppPage>(() => getInitialPageFromUrl());
    const [paymentRequests, setPaymentRequests] = useState<StudentPaymentRequest[]>([]);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [calendarNotes, setCalendarNotes] = useState<CalendarStickyNote[]>(() =>
        readCalendarNotes()
    );
    const [profileImageUri, setProfileImageUri] = useState<string | null>(() => {
        const val = readPrefString('profile_image_uri', '');
        return val ? val : null;
    });
    const [paymentCelebration, setPaymentCelebration] = useState(false);
    const [navDirection, setNavDirection] = useState<'forward' | 'backward' | 'fade'>('fade');
    const [tabSkeleton, setTabSkeleton] = useState(false);
    const [payFocusKey, setPayFocusKey] = useState(0);
    const [funFactIntervalMinutes, setFunFactIntervalMinutes] = useState<number>(
        () => {
            const saved = Number(readPrefString('fun_fact_interval_min', '15'));
            return Number.isFinite(saved) && saved >= 1 ? saved : 15;
        }
    );
    const [pushStatus, setPushStatus] = useState<PushCapabilityStatus>({
        supported: false,
        permission: 'default',
        subscribed: false,
        isIOSNeedsInstall: false,
    });

    const english = language === AppLanguage.ENGLISH;
    const hasPendingPayment = paymentRequests.some(
        (request) => request.status === 'PENDING'
    );
    const localizedSummary = useMemo(
        () => localizeSummary(summary, english),
        [summary, english]
    );

    const PAGE_ORDER: Record<AppPage, number> = {
        [AppPage.HOME]: 0,
        [AppPage.PAYMENTS]: 1,
        [AppPage.LEDGER]: 2,
        [AppPage.ASSISTANT]: 3,
        [AppPage.SETTINGS]: 4,
        [AppPage.PROFILE]: 5,
    };

    const navigateTo = (nextPage: AppPage, options?: { skipSkeleton?: boolean }) => {
        if (nextPage === page) return;
        const prevIdx = PAGE_ORDER[page] ?? 0;
        const nextIdx = PAGE_ORDER[nextPage] ?? 0;
        setNavDirection(nextIdx >= prevIdx ? 'forward' : 'backward');
        setPage(nextPage);
        setTabSkeleton(!options?.skipSkeleton);
    };

    const openPaymentsDirectly = () => {
        if (page !== AppPage.PAYMENTS) {
            navigateTo(AppPage.PAYMENTS, { skipSkeleton: true });
        }
        setPayFocusKey((prev) => prev + 1);
    };

    const refreshPushStatus = async () => {
        const status = await getPushCapabilityStatus();
        setPushStatus(status);
    };

    const authenticateStudent = async (credentials: StudentLoginCredentials) => {
        const session = await loginStudent(credentials);
        try {
            const snapshot = await loadStudentSnapshot(session.token);
            setStudentToken(session.token);
            setStudentProfile(snapshot.profile);
            setActiveUserName(snapshot.profile.name);
            setSummary(snapshot.summary);
            setPaymentRequests(snapshot.paymentRequests);
      await saveStudentSession({ token: session.token, snapshot }).catch((error) => {
        console.warn('The signed-in session could not be saved securely.', error);
      });
      void enableAndroidPushNotifications(session.token)
        .then(() => refreshPushStatus())
        .catch((error) => {
          console.warn('Android push registration could not be completed.', error);
          return refreshPushStatus();
        });
            return snapshot.profile;
        } catch (loadError) {
            void logoutStudent(session.token).catch(() => undefined);
            throw loadError;
        }
    };

    const handleLogout = () => {
        const token = studentToken;
        setStudentToken(null);
        setStudentProfile(null);
        setActiveUserName('');
        setSummary(createInitialSummary());
        setPaymentRequests([]);
        setPaymentCelebration(false);
        setProfileImageUri(null);
        writePrefString('profile_image_uri', '');
        void clearStudentSession().catch((error) => {
            console.warn('The saved session could not be cleared.', error);
        });
        setAuthScreen(AuthScreenState.WELCOME);
        setPage(AppPage.HOME);
        void disableRealPushNotifications();
        clearAndroidPushRegistration();
        if (token) {
            void (async () => {
                const installationId = await getAndroidInstallationId();
                await logoutStudent(token, installationId).catch(() => undefined);
            })();
        }
    };

    const handlePaymentRequest = async (input: {
        billStudentId: string;
        paymentMethod: 'QRIS' | 'TF' | 'TUNAI';
        proof: File;
    }) => {
        if (!studentToken) throw new Error('Please sign in again to submit a payment.');
        const bill = summary.myBills.find((item) => item.id === input.billStudentId);
        if (!bill) throw new Error('This bill is no longer available. Refresh your data and try again.');

        try {
            const submittedRequest = await submitStudentPayment(
                studentToken,
                input,
                bill.title
            );
            const nextPaymentRequests = [
                submittedRequest,
                ...paymentRequests.filter((item) => item.id !== submittedRequest.id),
            ];
            const nextSummary = {
                ...summary,
                myBills: summary.myBills.map((item) =>
                    item.id === bill.id ? { ...item, status: PaymentStatus.PROSES } : item
                ),
            };
            setPaymentRequests(nextPaymentRequests);
            setSummary(nextSummary);
            if (studentProfile) {
                void saveStudentSession({
                    token: studentToken,
                    snapshot: {
                        profile: studentProfile,
                        summary: nextSummary,
                        paymentRequests: nextPaymentRequests,
                    },
                }).catch((error) => {
                    console.warn('The cached student data could not be updated.', error);
                });
            }
            setPaymentCelebration(true);
            void syncPushSchedule({
                bills: localizedSummary.myBills,
                hasPendingPayment: true,
                english,
                userName: activeUserName,
                funFactIntervalMinutes,
            });
            void triggerPaymentConfirmationPush(
                submittedRequest.title,
                submittedRequest.amount,
                english
            );
            return submittedRequest;
        } catch (error) {
            if (error instanceof KasMateApiError && error.statusCode === 401) {
                handleLogout();
            }
            throw error;
        }
    };

    const handleEnablePush = async () => {
        if (isAndroidPushAvailable()) {
            if (!studentToken) return;
            try {
                const result = await enableAndroidPushNotifications(studentToken);
                await refreshPushStatus();
                if (result.granted) {
                    await triggerScheduledBillPush({
                        bills: localizedSummary.myBills,
                        hasPendingPayment,
                        english,
                        userName: activeUserName,
                        funFactIntervalMinutes,
                    });
                }
            } catch (error) {
                console.warn('Android push notifications could not be enabled.', error);
                await refreshPushStatus();
            }
            return;
        }

        const res = await enableRealPushNotifications({
            bills: localizedSummary.myBills,
            hasPendingPayment,
            english,
            userName: activeUserName,
            funFactIntervalMinutes,
        });
        await refreshPushStatus();
        if (res.ok) {
            await triggerScheduledBillPush({
                bills: localizedSummary.myBills,
                hasPendingPayment,
                english,
                userName: activeUserName,
                funFactIntervalMinutes,
            });
        }
    };

    useEffect(() => {
      let cancelled = false;

      const restoreSession = async () => {
        try {
          const storedSession = await loadStudentSession();
          if (cancelled) return;
          if (!storedSession) {
            setIsRestoringSession(false);
            return;
          }

          const applySnapshot = (snapshot: Awaited<ReturnType<typeof loadStudentSnapshot>>) => {
            setStudentToken(storedSession.token);
            setStudentProfile(snapshot.profile);
            setActiveUserName(snapshot.profile.name);
            setSummary(snapshot.summary);
            setPaymentRequests(snapshot.paymentRequests);
            setAuthScreen(AuthScreenState.HOME);
          };

          applySnapshot(storedSession.snapshot);
          setIsRestoringSession(false);

          try {
            const freshSnapshot = await loadStudentSnapshot(storedSession.token);
            if (cancelled) return;
            applySnapshot(freshSnapshot);
            void saveStudentSession({
              token: storedSession.token,
              snapshot: freshSnapshot,
            }).catch((error) => {
              console.warn('The refreshed session could not be saved securely.', error);
            });

            if (
              isAndroidPushAvailable() &&
              (await getAndroidPushPermissionStatus()) === 'granted'
            ) {
              void enableAndroidPushNotifications(storedSession.token)
                .then(() => refreshPushStatus())
                .catch((error) => {
                  console.warn('Android push registration could not be refreshed.', error);
                });
            }
          } catch (error) {
            if (error instanceof KasMateApiError && error.statusCode === 401) {
              await clearStudentSession().catch(() => undefined);
              if (!cancelled) {
                setStudentToken(null);
                setStudentProfile(null);
                setActiveUserName('');
                setSummary(createInitialSummary());
                setPaymentRequests([]);
                setAuthScreen(AuthScreenState.WELCOME);
              }
            }
          }
        } catch (error) {
          console.warn('The previous student session could not be restored.', error);
        } finally {
          if (!cancelled) setIsRestoringSession(false);
        }
      };

      void restoreSession();
      return () => {
        cancelled = true;
      };
    }, []);

    useEffect(() => {
        if (!tabSkeleton) return;
        const timer = window.setTimeout(() => setTabSkeleton(false), 240);
        return () => window.clearTimeout(timer);
    }, [tabSkeleton, page]);

    // Sync dark mode class on <html>
    useEffect(() => {
        const root = document.documentElement;
        if (darkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        writePrefBool('dark_mode', darkMode);
    }, [darkMode]);

    // Persist language preference
    useEffect(() => {
        writePrefString('app_language', language);
    }, [language]);

    // Overdue calculations (silent phone notifications only — no speech audio)
    const overdueStats = useMemo(() => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startMs = startOfToday.getTime();
        const overdueBills = summary.myBills.filter(
            (b) =>
                b.status !== PaymentStatus.LUNAS &&
                b.status !== PaymentStatus.PROSES &&
                b.dueDateMillis < startMs
        );
        const amount = overdueBills.reduce((acc, b) => acc + (b.amountDue || b.amount), 0);
        const maxDays = overdueBills.reduce((max, b) => {
            const days = Math.max(
                1,
                Math.floor((startMs - b.dueDateMillis) / 86_400_000)
            );
            return Math.max(max, days);
        }, 0);
        return { amount, maxDays, firstTitle: overdueBills[0]?.title ?? '' };
    }, [summary, hasPendingPayment]);

    useEffect(() => {
        writePrefString('overdue_amount', String(overdueStats.amount));
        writePrefString('overdue_days', String(overdueStats.maxDays));
    }, [overdueStats]);

    // Register Service Worker + listen for OS notification click navigation
    useEffect(() => {
        void registerServiceWorker().then(() => refreshPushStatus());
        if (!('serviceWorker' in navigator)) return;
        const onMessage = (event: MessageEvent) => {
            if (event.data?.type === 'KASMATE_NAVIGATE') {
                if (event.data.page === 'payments') {
                    setNavDirection('forward');
                    setPage(AppPage.PAYMENTS);
                    setTabSkeleton(false);
                    setPayFocusKey((prev) => prev + 1);
                } else if (event.data.page === 'home') {
                    setNavDirection('backward');
                    setPage(AppPage.HOME);
                    setTabSkeleton(false);
                }
            }
        };
        navigator.serviceWorker.addEventListener('message', onMessage);
        return () => navigator.serviceWorker.removeEventListener('message', onMessage);
    }, []);

    // Sync bill schedule & preferences with backend Push scheduler
    useEffect(() => {
        writePrefString('fun_fact_interval_min', String(funFactIntervalMinutes));
        if (authScreen !== AuthScreenState.HOME) return;
        void syncPushSchedule({
            bills: localizedSummary.myBills,
            hasPendingPayment,
            english,
            userName: activeUserName,
            funFactIntervalMinutes,
        });
    }, [
        authScreen,
        localizedSummary,
        hasPendingPayment,
        english,
        activeUserName,
        funFactIntervalMinutes,
    ]);

    // Ensure real Web Push subscription & deliver scheduled OS bill reminder when entering Home
    useEffect(() => {
        if (authScreen !== AuthScreenState.HOME) return;
        if (isAndroidPushAvailable()) {
            void registerServiceWorker().then(() => disableRealPushNotifications());
            return;
        }
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        const timer = window.setTimeout(() => {
            void enableRealPushNotifications({
                bills: localizedSummary.myBills,
                hasPendingPayment,
                english,
                userName: activeUserName,
                funFactIntervalMinutes,
            }).then(async (res) => {
                await refreshPushStatus();
                if (res.ok) {
                    await triggerScheduledBillPush({
                        bills: localizedSummary.myBills,
                        hasPendingPayment,
                        english,
                        userName: activeUserName,
                        funFactIntervalMinutes,
                    });
                }
            });
        }, 650);

        return () => window.clearTimeout(timer);
    }, [authScreen]);

    // Fallback periodic non-repeating Fun Fact OS notification via SW if PushManager is unavailable in preview iframe
    useEffect(() => {
        if (authScreen !== AuthScreenState.HOME) return;
        if (isAndroidPushAvailable()) return;
        if (pushStatus.permission !== 'granted' || pushStatus.subscribed) return;

        const intervalMs = Math.max(1, funFactIntervalMinutes) * 60_000;
        const timer = window.setInterval(() => {
            void triggerNextFunFactPush(english);
        }, intervalMs);

        return () => window.clearInterval(timer);
    }, [authScreen, pushStatus.permission, pushStatus.subscribed, funFactIntervalMinutes, english]);

    // Reset payment celebration after 8 seconds on HOME
    useEffect(() => {
        if (page === AppPage.HOME && paymentCelebration) {
            const timer = window.setTimeout(() => {
                setPaymentCelebration(false);
            }, 8_000);
            return () => window.clearTimeout(timer);
        }
    }, [page, paymentCelebration]);

    if (isRestoringSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] dark:bg-[#111216]">
                <div className="text-sm font-bold text-[#858585] dark:text-[#B3B3BA]">
                    KasMate
                </div>
            </div>
        );
    }

    if (authScreen === AuthScreenState.WELCOME) {
        return (
            <WelcomeScreen
                onGetStarted={() => {
                    writePrefBool('welcome_seen', true);
                    setAuthScreen(AuthScreenState.LOGIN);
                }}
            />
        );
    }

    if (authScreen === AuthScreenState.LOGIN) {
        return (
            <LoginScreen
                onLogin={authenticateStudent}
                onAuthenticated={() => setAuthScreen(AuthScreenState.HOME)}
            />
        );
    }

    const navItems: Array<{
        page: AppPage;
        label: string;
        icon: React.ReactNode;
    }> = [
            {
                page: AppPage.HOME,
                label: english ? 'Home' : 'Beranda',
                icon: <Home className="w-5 h-5" />,
            },
            {
                page: AppPage.PAYMENTS,
                label: english ? 'Pay' : 'Bayar',
                icon: <CreditCard className="w-5 h-5" />,
            },
            {
                page: AppPage.LEDGER,
                label: english ? 'Class' : 'Kas kelas',
                icon: <Landmark className="w-5 h-5" />,
            },
            {
                page: AppPage.ASSISTANT,
                label: english ? 'Assistant' : 'Asisten',
                icon: <Sparkles className="w-5 h-5" />,
            },
            {
                page: AppPage.SETTINGS,
                label: english ? 'Settings' : 'Pengaturan',
                icon: <Settings className="w-5 h-5" />,
            },
        ];

    const isNavActive = (itemPage: AppPage) =>
        page === itemPage ||
        (itemPage === AppPage.SETTINGS && page === AppPage.PROFILE);

    const activeNavIndex = Math.max(
        0,
        navItems.findIndex((item) => isNavActive(item.page))
    );

    const pageAnimClass =
        navDirection === 'forward'
            ? 'animate-page-forward'
            : navDirection === 'backward'
                ? 'animate-page-backward'
                : 'animate-page-enter';

    const floatingMascotMood: MascotMood =
        paymentCelebration || hasPendingPayment
            ? MascotMood.EXCITED
            : overdueStats.maxDays >= 3
                ? MascotMood.ANGRY
                : overdueStats.maxDays > 0
                    ? MascotMood.SAD
                    : summary.myBills.some(
                        (bill) =>
                            bill.status !== PaymentStatus.LUNAS &&
                            bill.status !== PaymentStatus.PROSES
                    )
                        ? MascotMood.NEUTRAL
                        : MascotMood.HAPPY;

    return (
        <div className="min-h-dvh w-full flex flex-col">
            {/* Main Content Canvas */}
            <main
                className={`flex-1 w-full max-w-5xl mx-auto px-5 pt-4 ${page === AppPage.ASSISTANT
                        ? 'pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))]'
                        : 'pb-[calc(8rem+env(safe-area-inset-bottom,0px))]'
                    }`}
            >
                <div key={page} className={pageAnimClass}>
                    {tabSkeleton ? (
                        <div className="w-full flex flex-col gap-4 pt-2 pb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-2">
                                    <div className="h-3 w-20 rounded-md skeleton-shimmer" />
                                    <div className="h-7 w-48 rounded-xl skeleton-shimmer" />
                                </div>
                                <div className="w-11 h-11 rounded-full skeleton-shimmer" />
                            </div>
                            <div className="h-32 w-full rounded-3xl skeleton-shimmer" />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="h-24 rounded-3xl skeleton-shimmer" />
                                <div className="h-24 rounded-3xl skeleton-shimmer" />
                            </div>
                            <div className="h-44 w-full rounded-3xl skeleton-shimmer" />
                        </div>
                    ) : (
                        <>
                            {page === AppPage.HOME && (
                                <DashboardTab
                                    summary={localizedSummary}
                                    english={english}
                                    userName={activeUserName}
                                    paymentSubmitted={paymentCelebration}
                                    hasPendingPayment={hasPendingPayment}
                                    showPushOptIn={
                                        pushStatus.supported && pushStatus.permission === 'default'
                                    }
                                    onEnablePush={() => void handleEnablePush()}
                                    onOpenSettings={() => navigateTo(AppPage.SETTINGS)}
                                    onOpenPayments={openPaymentsDirectly}
                                    onOpenLedger={() => navigateTo(AppPage.LEDGER)}
                                    onOpenAssistant={() => navigateTo(AppPage.ASSISTANT)}
                                />
                            )}
                            {page === AppPage.PAYMENTS && (
                                <PaymentsTab
                                    summary={localizedSummary}
                                    english={english}
                                    requests={paymentRequests}
                                    payFocusKey={payFocusKey}
                                    onRequest={handlePaymentRequest}
                                />
                            )}
                            {page === AppPage.LEDGER && (
                                <LedgerTab summary={localizedSummary} english={english} />
                            )}
                            {page === AppPage.ASSISTANT && (
                                <AssistantTab
                                    summary={localizedSummary}
                                    userName={activeUserName}
                                    english={english}
                                    onOpenCalendar={() => setCalendarOpen(true)}
                                />
                            )}
                            {page === AppPage.SETTINGS && (
                                <SettingsPage
                                    darkMode={darkMode}
                                    onDarkModeChange={setDarkMode}
                                    language={language}
                                    onLanguageChange={setLanguage}
                                    english={english}
                                    onOpenProfile={() => navigateTo(AppPage.PROFILE)}
                                    onLogout={handleLogout}
                                    pushStatus={pushStatus}
                                    funFactIntervalMinutes={funFactIntervalMinutes}
                                    onFunFactIntervalChange={setFunFactIntervalMinutes}
                                    onEnablePush={() => void handleEnablePush()}
                                    onTestFunFactPush={() => void triggerNextFunFactPush(english)}
                                    onTestBillPush={() =>
                                        void triggerScheduledBillPush({
                                            bills: localizedSummary.myBills,
                                            hasPendingPayment,
                                            english,
                                            userName: activeUserName,
                                            funFactIntervalMinutes,
                                        })
                                    }
                                />
                            )}
                            {page === AppPage.PROFILE && (
                                <ProfilePage
                                    english={english}
                                    userName={activeUserName}
                                    imageUri={profileImageUri}
                                    onChangeImage={(dataUrl) => {
                                        setProfileImageUri(dataUrl);
                                        writePrefString('profile_image_uri', dataUrl);
                                    }}
                                    className={studentProfile?.className ?? ''}
                                    academicYear={studentProfile?.academicYear ?? ''}
                                    nis={studentProfile?.nis ?? ''}
                                    savingsBalance={studentProfile?.savingsBalance ?? 0}
                                    onBack={() => navigateTo(AppPage.SETTINGS)}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Calendar Floating Action Button (hidden on Assistant tab where it sits cleanly in the header) */}
            {page !== AppPage.ASSISTANT && (
                <button
                    type="button"
                    onClick={() => setCalendarOpen(true)}
                    aria-label={english ? 'Open calendar' : 'Buka kalender'}
                    className="fixed right-4 sm:right-6 bottom-[calc(max(1.25rem,env(safe-area-inset-bottom,0px))+5.25rem)] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] z-30 w-13 h-13 rounded-[19px] kas-gradient text-white shadow-[0_10px_24px_rgba(227,30,36,0.3)] hover:brightness-105 active:scale-90 ios-spring transition-all duration-200 flex items-center justify-center cursor-pointer"
                >
                    <CalendarIcon className="w-5 h-5" />
                </button>
            )}

            {/* iPhone-style Elevated Floating Pill Bottom Navigation Bar (safe above phone home/back bars) */}
            <div className="fixed bottom-[calc(max(1.25rem,env(safe-area-inset-bottom,0px))+0.65rem)] left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
                <nav
                    aria-label={english ? 'Bottom navigation' : 'Navigasi bawah'}
                    className="pointer-events-auto relative w-full max-w-[320px] rounded-full bg-white/95 dark:bg-[#191A20]/95 backdrop-blur-xl border border-[#EEEEF0] dark:border-[#34353C] shadow-[0_14px_36px_rgba(0,0,0,0.14)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.5)] p-1.5 animate-nav-dock"
                >
                    <div className="relative grid grid-cols-5 items-center">
                        {/* Raised Sliding KasMate Red Pill Indicator */}
                        <div
                            aria-hidden="true"
                            style={{
                                width: '20%',
                                transform: `translateX(${activeNavIndex * 100}%) translateY(-5px) scale(1.06)`,
                            }}
                            className="absolute top-0 bottom-0 left-0 rounded-full kas-gradient shadow-[0_10px_22px_rgba(227,30,36,0.42),0_2px_6px_rgba(0,0,0,0.12)] transition-transform duration-440 ios-spring"
                        />
                        {navItems.map((item) => {
                            const active = isNavActive(item.page);
                            return (
                                <button
                                    key={item.page}
                                    type="button"
                                    onClick={() => navigateTo(item.page)}
                                    aria-label={item.label}
                                    title={item.label}
                                    className="relative z-10 h-11 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-150 cursor-pointer"
                                >
                                    <span
                                        className={`transition-all duration-300 ios-spring ${active
                                                ? 'text-white animate-nav-pop'
                                                : 'text-[#858585] dark:text-[#B3B3BA] hover:text-[#E31E24] scale-100'
                                            }`}
                                    >
                                        {item.icon}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </nav>
            </div>

            {/* Floating Fixed Draggable Screen Mascot — tapping mascot or dialog goes straight to Payments */}
            <FloatingScreenMascot
                mood={floatingMascotMood}
                daysLate={overdueStats.maxDays}
                english={english}
                onOpenPayments={openPaymentsDirectly}
            />

            {/* Calendar Sticky Notes Overlay */}
            {calendarOpen && (
                <CalendarOverlay
                    english={english}
                    notes={calendarNotes}
                    onClose={() => setCalendarOpen(false)}
                    onAdd={(note) => {
                        const updated = [...calendarNotes, note];
                        setCalendarNotes(updated);
                        writeCalendarNotes(updated);
                    }}
                    onToggle={(target) => {
                        const updated = calendarNotes.map((n) =>
                            n.id === target.id ? { ...n, done: !n.done } : n
                        );
                        setCalendarNotes(updated);
                        writeCalendarNotes(updated);
                    }}
                    onDelete={(target) => {
                        const updated = calendarNotes.filter((n) => n.id !== target.id);
                        setCalendarNotes(updated);
                        writeCalendarNotes(updated);
                    }}
                />
            )}
        </div>
    );
}

export default App;
