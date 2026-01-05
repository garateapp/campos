<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminRoleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Roles/Index', [
            'roles' => Role::orderBy('name')->get(['id', 'name', 'display_name', 'description', 'permissions']),
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $request->validate([
            'permissions' => 'nullable',
        ]);

        $permissions = $this->normalizePermissions($request->input('permissions'));

        $role->permissions = $permissions;
        $role->save();

        return redirect()->back()->with('success', 'Permisos actualizados.');
    }

    private function normalizePermissions($input): array
    {
        if (is_array($input)) {
            return collect($input)->filter()->values()->all();
        }

        return collect(explode(',', (string) $input))
            ->map(fn ($item) => trim($item))
            ->filter()
            ->values()
            ->all();
    }
}
