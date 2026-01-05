<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToCompany
{
    /**
     * Boot the trait - adds global scope and auto-sets company_id on create.
     */
    protected static function bootBelongsToCompany(): void
    {
        // Solo superadmins ven todas las compañías; admins siguen acotados.
        $isSuperAdmin = auth()->check() && method_exists(auth()->user(), 'isSuperAdmin') && auth()->user()->isSuperAdmin();

        // Auto-set company_id when creating a new record (only para no superadmins)
        static::creating(function ($model) use ($isSuperAdmin) {
            if (!$isSuperAdmin && auth()->check() && !$model->company_id) {
                $model->company_id = auth()->user()->company_id;
            }
        });

        // Add global scope to filter by company (solo si no es superadmin)
        static::addGlobalScope('company', function (Builder $builder) use ($isSuperAdmin) {
            if (!$isSuperAdmin && auth()->check() && auth()->user()->company_id) {
                $builder->where($builder->getModel()->getTable() . '.company_id', auth()->user()->company_id);
            }
        });
    }

    /**
     * Get the company that owns the model.
     */
    public function company()
    {
        return $this->belongsTo(\App\Models\Company::class);
    }

    /**
     * Scope to filter by a specific company (bypassing global scope).
     */
    public function scopeForCompany(Builder $query, int $companyId): Builder
    {
        return $query->withoutGlobalScope('company')->where('company_id', $companyId);
    }
}
