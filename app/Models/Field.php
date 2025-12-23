<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Field extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'name',
        'code',
        'area_hectares',
        'soil_type_id',
        'coordinates',
        'status',
        'notes',
    ];

    protected $casts = [
        'area_hectares' => 'decimal:2',
        'soil_type_id' => 'integer',
        'coordinates' => 'array',
    ];

    /**
     * Get the soil type for this field.
     */
    public function soilType(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(SoilType::class);
    }

    /**
     * Get plantings for this field.
     */
    public function plantings(): HasMany
    {
        return $this->hasMany(Planting::class);
    }

    /**
     * Get tasks associated with this field.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get costs associated with this field.
     */
    public function costs(): HasMany
    {
        return $this->hasMany(Cost::class);
    }

    /**
     * Get input usages on this field.
     */
    public function inputUsages(): HasMany
    {
        return $this->hasMany(InputUsage::class);
    }
}
