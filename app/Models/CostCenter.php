<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CostCenter extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'code',
        'name',
        'species',
        'variety',
        'status',
        'plant_year',
        'planting_frame',
        'plants_count',
        'hectares',
    ];

    protected $casts = [
        'plant_year' => 'integer',
        'plants_count' => 'integer',
        'hectares' => 'decimal:2',
    ];

    public function crops(): HasMany
    {
        return $this->hasMany(Crop::class);
    }

    public function plantings(): HasMany
    {
        return $this->hasMany(Planting::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function laborPlannings(): HasMany
    {
        return $this->hasMany(LaborPlanning::class);
    }
}
