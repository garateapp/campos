<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Crop extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'species_id',
        'variety_id',
        'name',
        'variety',
        'scientific_name',
        'days_to_harvest',
        'notes',
    ];

    protected $casts = [
        'days_to_harvest' => 'integer',
        'species_id' => 'integer',
        'variety_id' => 'integer',
    ];

    /**
     * Get the species for the crop.
     */
    public function species(): BelongsTo
    {
        return $this->belongsTo(Species::class);
    }

    /**
     * Get the variety for the crop.
     */
    public function varietyEntity(): BelongsTo
    {
        return $this->belongsTo(Variety::class, 'variety_id');
    }

    /**
     * Get plantings for this crop.
     */
    public function plantings(): HasMany
    {
        return $this->hasMany(Planting::class);
    }
}
