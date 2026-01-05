import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    return (
        <>
            <Head title="Bienvenido" />
            <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 text-black/50 dark:bg-black dark:text-white/50">
                <div className="relative w-full max-w-2xl px-6 lg:max-w-7xl">
                    <header className="grid grid-cols-2 items-center gap-2 py-10 lg:grid-cols-3">
                        <div className="flex lg:col-start-2 lg:justify-center">
                            <ApplicationLogo />
                        </div>
                        <nav className="-mx-3 flex flex-1 justify-end">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                    >
                                        Iniciar Sesión
                                    </Link>
                                    {/* Register link removed as typically internal apps don't have public registration */}
                                </>
                            )}
                        </nav>
                    </header>

                    <main className="mt-6 flex flex-col items-center text-center">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-6xl">
                            Portal Gestión de Campos Greenex
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                            Bienvenido a la plataforma integral para la gestión de sus campos.

                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                href={route('login')}
                                className="rounded-md bg-[#e56b1f] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#d45d15] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e56b1f]"
                            >
                                Iniciar Sesión
                            </Link>
                            {/* <a href="#" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                                Learn more <span aria-hidden="true">→</span>
                            </a> */}
                        </div>

                        <div className="mt-16 flow-root sm:mt-24">
                            <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                                <img
                                    src="/img/hero-image.webp" // Placeholder or we can remove if no image exists
                                    alt="App Screenshot"
                                    width={2432}
                                    height={1442}
                                    className="rounded-md shadow-2xl ring-1 ring-gray-900/10"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }} // Hide if no image
                                />
                            </div>
                        </div>
                    </main>

                    <footer className="py-16 text-center text-sm text-black dark:text-white/70">
                        &copy; {new Date().getFullYear()} Greenex. Todos los derechos reservados.
                    </footer>
                </div>
            </div>
        </>
    );
}
