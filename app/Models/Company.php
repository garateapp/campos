<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'tax_id',
        'address',
        'phone',
        'email',
        'timezone',
        'currency',
        'settings',
        'is_active',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get all users belonging to this company.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get all fields belonging to this company.
     */
    public function fields(): HasMany
    {
        return $this->hasMany(Field::class);
    }

    /**
     * Get all crops belonging to this company.
     */
    public function crops(): HasMany
    {
        return $this->hasMany(Crop::class);
    }

    /**
     * Get all plantings belonging to this company.
     */
    public function plantings(): HasMany
    {
        return $this->hasMany(Planting::class);
    }

    /**
     * Get all tasks belonging to this company.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get all inputs belonging to this company.
     */
    public function inputs(): HasMany
    {
        return $this->hasMany(Input::class);
    }

    /**
     * Get all costs belonging to this company.
     */
    public function costs(): HasMany
    {
        return $this->hasMany(Cost::class);
    }

    /**
     * Boot the model - generate slug from name.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($company) {
            if (empty($company->slug)) {
                $company->slug = \Illuminate\Support\Str::slug($company->name);
            }
        });
    }
}
