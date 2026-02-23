<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Field;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    public function index(): Response
    {
        $users = User::with(['company:id,name', 'role:id,name,display_name', 'fields:id,name'])
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'email',
                'phone',
                'company_id',
                'field_id',
                'role_id',
                'is_active',
                'last_login_at',
                'created_at',
            ]);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'companies' => Company::orderBy('name')->get(['id', 'name']),
            'fields' => Field::orderBy('name')->get(['id', 'name']),
            'roles' => Role::orderBy('name')->get(['id', 'name', 'display_name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:50',
            'company_id' => 'required|exists:companies,id',
            'field_id' => 'nullable|exists:fields,id',
            'field_ids' => 'nullable|array',
            'field_ids.*' => 'exists:fields,id',
            'role_id' => 'required|exists:roles,id',
            'is_active' => 'sometimes|boolean',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'company_id' => $validated['company_id'],
            'field_id' => $validated['field_id'] ?? null,
            'role_id' => $validated['role_id'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $role = Role::find($validated['role_id']);
        $fieldIds = $request->input('field_ids', []);
        if (in_array($role?->name, ['admin', 'agronomist'], true)) {
            $user = User::where('email', $validated['email'])->first();
            $user?->fields()->sync($fieldIds);
            if ($user && $user->field_id) {
                $user->field_id = null;
                $user->save();
            }
        }

        return redirect()->back()->with('success', 'Usuario creado.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'phone' => 'nullable|string|max:50',
            'company_id' => 'required|exists:companies,id',
            'field_id' => 'nullable|exists:fields,id',
            'field_ids' => 'nullable|array',
            'field_ids.*' => 'exists:fields,id',
            'role_id' => 'required|exists:roles,id',
            'is_active' => 'sometimes|boolean',
        ]);

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'company_id' => $validated['company_id'],
            'field_id' => $validated['field_id'] ?? null,
            'role_id' => $validated['role_id'],
            'is_active' => $validated['is_active'] ?? $user->is_active,
        ]);

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        $role = Role::find($validated['role_id']);
        $fieldIds = $request->input('field_ids', []);
        if (in_array($role?->name, ['admin', 'agronomist'], true)) {
            $user->fields()->sync($fieldIds);
            if ($user->field_id) {
                $user->field_id = null;
                $user->save();
            }
        } else {
            $user->fields()->sync([]);
        }

        return redirect()->back()->with('success', 'Usuario actualizado.');
    }
}
