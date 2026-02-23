<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Field;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'company_id',
        'field_id',
        'role_id',
        'phone',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
            'field_id' => 'integer',
        ];
    }

    /**
     * Get the company the user belongs to.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    public function fields(): BelongsToMany
    {
        return $this->belongsToMany(Field::class)->withTimestamps();
    }

    /**
     * Get the role of the user.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get tasks assigned to this user.
     */
    public function taskAssignments(): HasMany
    {
        return $this->hasMany(TaskAssignment::class);
    }

    /**
     * Get tasks created by this user.
     */
    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    /**
     * Check if user has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        return $this->role && $this->role->hasPermission($permission);
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role && in_array($this->role->name, ['admin', 'superadmin'], true);
    }

    /**
     * Check if user is super admin (gestiona todas las compañías).
     */
    public function isSuperAdmin(): bool
    {
        return $this->role && $this->role->name === 'superadmin';
    }

    public function isFieldScoped(): bool
    {
        if (!$this->role) {
            return false;
        }

        return in_array($this->role->name, ['field_worker', 'crop_manager'], true);
    }

    public function fieldScopeIds(): ?array
    {
        if ($this->isSuperAdmin()) {
            return null;
        }

        if ($this->isFieldScoped()) {
            return $this->field_id ? [$this->field_id] : [];
        }

        if (in_array($this->role?->name, ['admin', 'agronomist'], true)) {
            $ids = $this->fields()->pluck('fields.id')->all();
            return $ids ?: null;
        }

        return null;
    }

    /**
     * Check if user has completed company setup.
     */
    public function hasCompany(): bool
    {
        return $this->company_id !== null;
    }
}
