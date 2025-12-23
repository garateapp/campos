<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Planting extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'field_id',
        'crop_id',
        'season',
        'planted_date',
        'expected_harvest_date',
        'planted_area_hectares',
        'plants_count',
        'status',
        'expected_yield_kg',
        'notes',
    ];

    protected $casts = [
        'planted_date' => 'date',
        'expected_harvest_date' => 'date',
        'planted_area_hectares' => 'decimal:2',
        'plants_count' => 'integer',
        'expected_yield_kg' => 'decimal:2',
    ];

    /**
     * Get the field this planting belongs to.
     */
    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    /**
     * Get the crop type.
     */
    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    /**
     * Get activities for this planting.
     */
    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    /**
     * Get harvests for this planting.
     */
    public function harvests(): HasMany
    {
        return $this->hasMany(Harvest::class);
    }

    /**
     * Get tasks associated with this planting.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get costs associated with this planting.
     */
    public function costs(): HasMany
    {
        return $this->hasMany(Cost::class);
    }

    /**
     * Calculate total harvested amount.
     */
    public function getTotalHarvestedKgAttribute(): float
    {
        return $this->harvests()->sum('quantity_kg');
    }
}
