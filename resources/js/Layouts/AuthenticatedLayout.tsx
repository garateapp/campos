import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';
import AIChatBot from '@/Components/AIChatBot';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="border-b border-gray-100 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Dashboard
                                </NavLink>
                                <NavLink
                                    href={route('fields.index')}
                                    active={route().current('fields.*')}
                                >
                                    Parcelas
                                </NavLink>
                                <NavLink
                                    href={route('field-mapping')}
                                    active={route().current('field-mapping')}
                                >
                                    Mapa
                                </NavLink>
                                <NavLink
                                    href={route('crops.index')}
                                    active={route().current('crops.*')}
                                >
                                    Cultivos
                                </NavLink>
                                <NavLink
                                    href={route('tasks.index')}
                                    active={route().current('tasks.*')}
                                >
                                    Tareas
                                </NavLink>
                                <NavLink
                                    href={route('inputs.index')}
                                    active={route().current('inputs.*')}
                                >
                                    Inventario
                                </NavLink>
                                <NavLink
                                    href={route('costs.index')}
                                    active={route().current('costs.*')}
                                >
                                    Costos
                                </NavLink>
                                <NavLink
                                    href={route('labor-plannings.index')}
                                    active={route().current('labor-plannings.*')}
                                >
                                    Planificación
                                </NavLink>
                                <NavLink
                                    href={route('card-assignments.index')}
                                    active={route().current('card-assignments.*')}
                                >
                                    Asignación Tarjetas
                                </NavLink>

                                <div className="hidden sm:ms-6 sm:flex sm:items-center">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-6 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                                >
                                                    Administración
                                                    <svg
                                                        className="-me-0.5 ms-2 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </span>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            <Dropdown.Link href={route('families.index')}>
                                                Maestro de Familias
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('species.index')}>
                                                Maestro de Especies
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('varieties.index')}>
                                                Maestro de Variedades
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('soil-types.index')}>
                                                Maestro de Suelos
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('task-types.index')}>
                                                Maestro de Tipos de Tarea
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('labor-types.index')}>
                                                Maestro de Tipos de Labor
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('unit-of-measures.index')}>
                                                Maestro de Unidades de Medida
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('input-categories.index')}>
                                                Maestro de Categorías (Insumos)
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('contractors.index')}>
                                                Maestro de Contratistas
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('workers.index')}>
                                                Maestro de Jornaleros
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('cards.index')}>
                                                Maestro de Tarjetas
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('harvest-containers.index')}>
                                                Envases de Cosecha
                                            </Dropdown.Link>
                                            <div className="border-t border-gray-100"></div>
                                            <Dropdown.Link href={route('card-assignments.index')}>
                                                Asignación Tarjetas
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('attendance.index')}>
                                                Asistencia
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('harvest-collection.index')}>
                                                Recolección Cosecha
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                            >
                                                {user.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                        >
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                        >
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('fields.index')}
                            active={route().current('fields.*')}
                        >
                            Parcelas
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('field-mapping')}
                            active={route().current('field-mapping')}
                        >
                            Mapa
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('crops.index')}
                            active={route().current('crops.*')}
                        >
                            Cultivos
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('tasks.index')}
                            active={route().current('tasks.*')}
                        >
                            Tareas
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('inputs.index')}
                            active={route().current('inputs.*')}
                        >
                            Inventario
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('costs.index')}
                            active={route().current('costs.*')}
                        >
                            Costos
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('labor-plannings.index')}
                            active={route().current('labor-plannings.*')}
                        >
                            Planificación
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('card-assignments.index')}
                            active={route().current('card-assignments.*')}
                        >
                            Asignación Tarjetas
                        </ResponsiveNavLink>

                        <div className="pt-4 pb-1 border-t border-gray-100">
                            <div className="px-4 text-xs font-semibold text-gray-400 uppercase">Administración</div>
                            <ResponsiveNavLink href={route('families.index')} active={route().current('families.*')}>
                                Maestro de Familias
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('species.index')} active={route().current('species.*')}>
                                Maestro de Especies
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('varieties.index')} active={route().current('varieties.*')}>
                                Maestro de Variedades
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('soil-types.index')} active={route().current('soil-types.*')}>
                                Maestro de Suelos
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('task-types.index')} active={route().current('task-types.*')}>
                                Maestro de Tipos de Tarea
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('labor-types.index')} active={route().current('labor-types.*')}>
                                Maestro de Tipos de Labor
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('unit-of-measures.index')} active={route().current('unit-of-measures.*')}>
                                Maestro de Unidades de Medida
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('input-categories.index')} active={route().current('input-categories.*')}>
                                Maestro de Categorías (Insumos)
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('contractors.index')} active={route().current('contractors.*')}>
                                Maestro de Contratistas
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('workers.index')} active={route().current('workers.*')}>
                                Maestro de Jornaleros
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('card-assignments.index')} active={route().current('card-assignments.index')}>
                                Asignación Tarjetas
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('attendance.index')} active={route().current('attendance.index')}>
                                Asistencia
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('harvest-collection.index')} active={route().current('harvest-collection.index')}>
                                Recolección Cosecha
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('cards.index')} active={route().current('cards.*')}>
                                Maestro de Tarjetas
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('harvest-containers.index')} active={route().current('harvest-containers.*')}>
                                Envases de Cosecha
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('company.settings')} active={route().current('company.settings')}>
                                Configuración Empresa
                            </ResponsiveNavLink>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800">
                                {user.name}
                            </div>
                            <div className="text-sm font-medium text-gray-500">
                                {user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>

            <AIChatBot />
        </div>
    );
}
