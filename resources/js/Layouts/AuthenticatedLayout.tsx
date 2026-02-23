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
    const user = usePage().props.auth.user as any;
    const isSuperAdmin =
        user?.role?.name === 'superadmin' ||
        user?.role_id === 1;

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
                                    <ApplicationLogo className="block h-9" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Dashboard
                                </NavLink>

                                {/* Dropdown: Operacion */}
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300 transition duration-150 ease-in-out h-16">
                                            <span>Operacion</span>
                                            <svg className="ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('fields.index')}>Campos</Dropdown.Link>
                                        <Dropdown.Link href={route('crops.index')}>Cuarteles</Dropdown.Link>
                                        <Dropdown.Link href={route('field-mapping')}>Mapa</Dropdown.Link>
                                        <Dropdown.Link href={route('tasks.index')}>Tareas</Dropdown.Link>
                                        <Dropdown.Link href={route('plantings.index')}>Labores</Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>

                                {/* Dropdown: Gestion */}
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300 transition duration-150 ease-in-out h-16">
                                            <span>Gestion</span>
                                            <svg className="ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('inputs.index')}>Inventario Insumos</Dropdown.Link>
                                        <Dropdown.Link href={route('costs.index')}>Costos Directos</Dropdown.Link>
                                        <Dropdown.Link href={route('labor-plannings.index')}>Planificación Laboral</Dropdown.Link>
                                        <Dropdown.Link href={route('profitability.index')}>Rentabilidad por Campo</Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>

                                {/* Dropdown: Analisis */}
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300 transition duration-150 ease-in-out h-16">
                                            <span>Analisis</span>
                                            <svg className="ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('reports.index')}>Reportes y Exportacion</Dropdown.Link>
                                        <Dropdown.Link href={route('reports.attendance-daily')}>Asistencia Diaria</Dropdown.Link>
                                        <Dropdown.Link href={route('reports.attendance-monthly')}>Asistencia Mensual</Dropdown.Link>
                                        <Dropdown.Link href={route('analytics.index')}>Analitica BI</Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>

                                <div className="hidden sm:ms-6 sm:flex sm:items-center">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-6 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                                >
                                                    Administracion
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
                                            <Dropdown.Link href={route('cost-centers.index')}>
                                                Maestro de Centros de Costo
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('input-categories.index')}>
                                                Maestro de Categorias (Insumos)
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
                                                Asignacion Tarjetas
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('attendance.index')}>
                                                Asistencia
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('harvest-collection.index')}>
                                                Recoleccion Cosecha
                                            </Dropdown.Link>
                                            {isSuperAdmin && (
                                                <>
                                                    <div className="border-t border-gray-100"></div>
                                                    <Dropdown.Link href={route('admin.users.index')}>
                                                        Usuarios
                                                    </Dropdown.Link>
                                                    <Dropdown.Link href={route('admin.roles.index')}>
                                                        Roles y Permisos
                                                    </Dropdown.Link>
                                                    <Dropdown.Link href={route('admin.companies.index')}>
                                                        Companias
                                                    </Dropdown.Link>
                                                </>
                                            )}
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

                        <div className="pt-4 pb-1 border-t border-gray-100">
                            <div className="px-4 text-xs font-semibold text-gray-400 uppercase">Operacion</div>
                            <ResponsiveNavLink href={route('fields.index')} active={route().current('fields.*')}>Campos</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('crops.index')} active={route().current('crops.*')}>Cuarteles</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('field-mapping')} active={route().current('field-mapping')}>Mapa</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('tasks.index')} active={route().current('tasks.*')}>Tareas</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('plantings.index')} active={route().current('plantings.*')}>Labores</ResponsiveNavLink>
                        </div>

                        <div className="pt-4 pb-1 border-t border-gray-100">
                            <div className="px-4 text-xs font-semibold text-gray-400 uppercase">Gestion Financiera</div>
                            <ResponsiveNavLink href={route('inputs.index')} active={route().current('inputs.*')}>Inventario</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('costs.index')} active={route().current('costs.*')}>Costos</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('labor-plannings.index')} active={route().current('labor-plannings.*')}>Planificación</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('profitability.index')} active={route().current('profitability.*')}>Rentabilidad</ResponsiveNavLink>
                        </div>

                        <div className="pt-4 pb-1 border-t border-gray-100">
                            <div className="px-4 text-xs font-semibold text-gray-400 uppercase">Inteligencia</div>
                            <ResponsiveNavLink href={route('reports.index')} active={route().current('reports.*')}>Reportes</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('reports.attendance-daily')} active={route().current('reports.attendance-daily')}>Asistencia Diaria</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('reports.attendance-monthly')} active={route().current('reports.attendance-monthly')}>Asistencia Mensual</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('analytics.index')} active={route().current('analytics.*')}>Analitica BI</ResponsiveNavLink>
                        </div>

                        <div className="pt-4 pb-1 border-t border-gray-100">
                            <div className="px-4 text-xs font-semibold text-gray-400 uppercase">Administracion</div>
                            <ResponsiveNavLink href={route('families.index')} active={route().current('families.*')}>Maestro de Familias</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('species.index')} active={route().current('species.*')}>Maestro de Especies</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('varieties.index')} active={route().current('varieties.*')}>Maestro de Variedades</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('soil-types.index')} active={route().current('soil-types.*')}>Maestro de Suelos</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('task-types.index')} active={route().current('task-types.*')}>Maestro de Tipos de Tarea</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('labor-types.index')} active={route().current('labor-types.*')}>Maestro de Tipos de Labor</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('unit-of-measures.index')} active={route().current('unit-of-measures.*')}>Maestro de Unidades de Medida</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('cost-centers.index')} active={route().current('cost-centers.*')}>Maestro de Centros de Costo</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('input-categories.index')} active={route().current('input-categories.*')}>Maestro de Categorias (Insumos)</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('contractors.index')} active={route().current('contractors.*')}>Maestro de Contratistas</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('workers.index')} active={route().current('workers.*')}>Maestro de Jornaleros</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('card-assignments.index')} active={route().current('card-assignments.*')}>Asignacion Tarjetas</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('attendance.index')} active={route().current('attendance.*')}>Asistencia</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('harvest-collection.index')} active={route().current('harvest-collection.*')}>Recoleccion Cosecha</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('cards.index')} active={route().current('cards.*')}>Maestro de Tarjetas</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('harvest-containers.index')} active={route().current('harvest-containers.*')}>Envases de Cosecha</ResponsiveNavLink>
                            {isSuperAdmin && (
                                <>
                                    <ResponsiveNavLink href={route('admin.users.index')} active={route().current('admin.users.*')}>Usuarios</ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('admin.roles.index')} active={route().current('admin.roles.*')}>Roles y Permisos</ResponsiveNavLink>
                                    <ResponsiveNavLink href={route('admin.companies.index')} active={route().current('admin.companies.*')}>Companias</ResponsiveNavLink>
                                </>
                            )}
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
